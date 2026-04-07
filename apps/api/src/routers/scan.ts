import crypto from "node:crypto";
import { batchScanSchema, processScanSchema } from "@material-tracking/shared";
import { TRPCError } from "@trpc/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { db, storage } from "../lib/firebase";
import { processOneScan } from "../lib/scan-process";
import { sendSlackDM } from "../lib/slack";
import { protectedProcedure } from "../middleware/auth";
import { publicProcedure, router } from "../trpc";

const SIGNATURE_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export const scanRouter = router({
  process: protectedProcedure
    .input(processScanSchema)
    .mutation(async ({ ctx, input }) => {
      return processOneScan(
        db,
        { uid: ctx.user.uid, email: ctx.user.email, name: ctx.user.name ?? ctx.user.email ?? "" },
        input,
      );
    }),

  processBatch: protectedProcedure
    .input(batchScanSchema)
    .mutation(async ({ ctx, input }) => {
      const user = {
        uid: ctx.user.uid,
        email: ctx.user.email,
        name: ctx.user.name ?? ctx.user.email ?? "",
      };

      const settled = await Promise.allSettled(
        input.scans.map((scan) => processOneScan(db, user, scan)),
      );

      return settled.map((s, index) => {
        if (s.status === "fulfilled") {
          return { index, ok: true as const, data: s.value };
        }
        const msg = s.reason instanceof Error ? s.reason.message : String(s.reason);
        return { index, ok: false as const, error: msg };
      });
    }),

  requestSignatureLink: protectedProcedure
    .input(z.object({ shipmentId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const token = crypto.randomBytes(32).toString("hex");

      await db.collection("signatureRequests").doc(token).set({
        shipmentId: input.shipmentId,
        createdBy: ctx.user.uid,
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + SIGNATURE_TOKEN_EXPIRY_MS),
        consumedAt: null,
      });

      // Send Slack DM to receiver with Sign Now button (D-06)
      const shipmentSnap = await db.doc(`shipments/${input.shipmentId}`).get();
      const shipmentData = shipmentSnap.data();
      if (shipmentData?.receiver?.email) {
        const BASE_URL = process.env.APP_BASE_URL || "https://manufacturing-472518.web.app";
        const signUrl = `${BASE_URL}/sign/${token}`;

        const message = {
          text: `Signature requested for shipment ${shipmentData.shipmentNumber}`,
          blocks: [
            {
              type: "header" as const,
              text: { type: "plain_text" as const, text: "Signature Requested" },
            },
            {
              type: "section" as const,
              text: {
                type: "mrkdwn" as const,
                text: `Shipment *${shipmentData.shipmentNumber}* has been delivered to *${shipmentData.receiver.name}*. Please sign to confirm receipt.`,
              },
            },
            {
              type: "actions" as const,
              elements: [
                {
                  type: "button" as const,
                  text: { type: "plain_text" as const, text: "Sign Now" },
                  url: signUrl,
                  style: "primary" as const,
                  action_id: "sign_shipment",
                },
              ],
            },
          ],
        };

        // Best-effort: don't await or block on Slack failure
        sendSlackDM(shipmentData.receiver.email, message).catch((err) =>
          console.error("[slack] Failed to send signature request DM:", err),
        );
      }

      return { token, url: `/sign/${token}` };
    }),

  submitSignatureByToken: publicProcedure
    .input(z.object({ token: z.string().min(1), signatureData: z.string().min(1) }))
    .mutation(async ({ input }) => {
      // Validate signature data before entering the transaction
      const base64Match = input.signatureData.match(/^data:image\/png;base64,(.+)$/);
      const base64 = base64Match ? base64Match[1] : input.signatureData;
      const buffer = Buffer.from(base64, "base64");

      // Size limit: reject if buffer > 500KB
      const MAX_SIGNATURE_SIZE = 500 * 1024;
      if (buffer.length > MAX_SIGNATURE_SIZE) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Signature image exceeds 500KB limit" });
      }

      // PNG header validation: first 4 bytes must be [0x89, 0x50, 0x4E, 0x47]
      const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47];
      if (
        buffer.length < 4 ||
        buffer[0] !== PNG_HEADER[0] ||
        buffer[1] !== PNG_HEADER[1] ||
        buffer[2] !== PNG_HEADER[2] ||
        buffer[3] !== PNG_HEADER[3]
      ) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Signature must be a valid PNG image" });
      }

      // Use a transaction for atomic consumedAt check + update (TOCTOU fix)
      const { shipmentId } = await db.runTransaction(async (tx) => {
        const reqRef = db.collection("signatureRequests").doc(input.token);
        const reqDoc = await tx.get(reqRef);

        if (!reqDoc.exists) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Invalid signature link" });
        }

        const data = reqDoc.data()!;
        if (data.consumedAt !== null) {
          throw new TRPCError({ code: "NOT_FOUND", message: "This signature link has already been used" });
        }

        const expiresAt = data.expiresAt?.toDate?.() ?? new Date(data.expiresAt);
        if (expiresAt < new Date()) {
          throw new TRPCError({ code: "NOT_FOUND", message: "This signature link has expired" });
        }

        // Mark as consumed within the transaction
        tx.update(reqRef, { consumedAt: FieldValue.serverTimestamp() });

        return { shipmentId: data.shipmentId as string };
      });

      const filePath = `signatures/${shipmentId}/${Date.now()}.png`;
      const file = storage.bucket().file(filePath);
      await file.save(buffer, { contentType: "image/png" });
      await file.makePublic();
      const publicUrl = `https://storage.googleapis.com/${storage.bucket().name}/${filePath}`;

      await db.doc(`shipments/${shipmentId}`).update({
        signatureUrl: publicUrl,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // --- Signature-to-Complete: transition all pieces to completed (D-11) ---
      const piecesSnap = await db.collection(`shipments/${shipmentId}/pieces`).get();
      const batch = db.batch();
      const serverTs = FieldValue.serverTimestamp();

      for (const pieceDoc of piecesSnap.docs) {
        if (pieceDoc.data().status !== "completed") {
          batch.update(pieceDoc.ref, {
            status: "completed",
            completedAt: serverTs,
            events: FieldValue.arrayUnion({
              action: "completed",
              timestamp: Timestamp.now(),
              userId: "signature-flow",
              userName: "Signature",
            }),
            updatedAt: serverTs,
          });
        }
      }

      // Set shipment to completed -- triggers onShipmentStatusChange -> Slack notification (D-13)
      batch.update(db.doc(`shipments/${shipmentId}`), {
        status: "completed",
        completedAt: serverTs,
        updatedAt: serverTs,
      });

      await batch.commit();

      return { success: true };
    }),
});
