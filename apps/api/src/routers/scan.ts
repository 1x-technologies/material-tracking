import crypto from "node:crypto";
import { batchScanSchema, processScanSchema } from "@material-tracking/shared";
import { TRPCError } from "@trpc/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { db, storage } from "../lib/firebase";
import { processOneScan } from "../lib/scan-process";
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
    .input(z.object({ shipmentId: z.string().min(1), pieceId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const token = crypto.randomBytes(32).toString("hex");

      await db.collection("signatureRequests").doc(token).set({
        shipmentId: input.shipmentId,
        pieceId: input.pieceId,
        createdBy: ctx.user.uid,
        createdAt: FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + SIGNATURE_TOKEN_EXPIRY_MS),
        consumedAt: null,
      });

      return { token, url: `/sign/${token}` };
    }),

  submitSignatureByToken: publicProcedure
    .input(z.object({ token: z.string().min(1), signatureData: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const reqDoc = await db.collection("signatureRequests").doc(input.token).get();
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

      const { shipmentId, pieceId } = data;

      const base64Match = input.signatureData.match(/^data:image\/png;base64,(.+)$/);
      const base64 = base64Match ? base64Match[1] : input.signatureData;
      const buffer = Buffer.from(base64, "base64");

      const filePath = `signatures/${shipmentId}/${pieceId}/${Date.now()}.png`;
      const file = storage.bucket().file(filePath);
      await file.save(buffer, { contentType: "image/png", public: false });

      const [signedUrl] = await file.getSignedUrl({ action: "read", expires: "03-01-2099" });

      await db.doc(`shipments/${shipmentId}/pieces/${pieceId}`).update({
        deliverySignatureUrl: signedUrl,
        updatedAt: FieldValue.serverTimestamp(),
      });

      await db.collection("signatureRequests").doc(input.token).update({
        consumedAt: FieldValue.serverTimestamp(),
      });

      return { success: true };
    }),
});
