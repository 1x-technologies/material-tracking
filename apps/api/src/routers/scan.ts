import { processScanSchema } from "@material-tracking/shared";
import { TRPCError } from "@trpc/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { db } from "../lib/firebase";
import { deriveShipmentStatus, validateTransition } from "../lib/shipment-status";
import { protectedProcedure } from "../middleware/auth";
import { router } from "../trpc";

export const scanRouter = router({
  process: protectedProcedure
    .input(processScanSchema)
    .mutation(async ({ ctx, input }) => {
      const qr = input.qrCode.trim();

      const snap = await db
        .collectionGroup("pieces")
        .where("qrCode", "==", qr)
        .limit(2)
        .get();

      if (snap.empty) {
        throw new TRPCError({ code: "NOT_FOUND", message: "UNKNOWN_QR" });
      }
      if (snap.size > 1) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "DUPLICATE_QR",
        });
      }

      const pieceRef = snap.docs[0].ref;
      const shipmentRef = pieceRef.parent.parent!;

      return db.runTransaction(async (tx) => {
        const [pieceSnap, shipmentSnap] = await Promise.all([
          tx.get(pieceRef),
          tx.get(shipmentRef),
        ]);

        if (!pieceSnap.exists || !shipmentSnap.exists) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Piece or shipment not found",
          });
        }

        const pieceData = pieceSnap.data()!;
        const shipmentData = shipmentSnap.data()!;

        if (shipmentData.status === "cancelled") {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "SHIPMENT_CANCELLED",
          });
        }

        const result = validateTransition(pieceData.status, input.action);
        if (!result.valid) {
          throw new TRPCError({ code: "CONFLICT", message: result.error });
        }

        const event = {
          action: input.action,
          timestamp: Timestamp.now(),
          userId: ctx.user.uid,
          userName: ctx.user.name ?? ctx.user.email ?? "",
          ...(input.signatureUrl && { signatureUrl: input.signatureUrl }),
          ...(input.photoUrl && { photoUrl: input.photoUrl }),
        };

        const pieceUpdate: Record<string, unknown> = {
          status: result.newStatus,
          events: FieldValue.arrayUnion(event),
          updatedAt: FieldValue.serverTimestamp(),
        };

        if (input.action === "delivered") {
          pieceUpdate.deliveredAt = FieldValue.serverTimestamp();
        }
        if (input.action === "picked_up") {
          pieceUpdate.pickedUpAt = FieldValue.serverTimestamp();
        }

        tx.update(pieceRef, pieceUpdate);

        const allPiecesSnap = await tx.get(shipmentRef.collection("pieces"));
        const allStatuses = allPiecesSnap.docs.map((doc) =>
          doc.id === pieceRef.id ? result.newStatus : doc.data().status,
        );

        const derived = deriveShipmentStatus(allStatuses, shipmentData.status);

        const shipmentUpdate: Record<string, unknown> = {
          status: derived.status,
          updatedAt: FieldValue.serverTimestamp(),
        };
        if (derived.deliveredCount !== undefined) {
          shipmentUpdate.deliveredPieceCount = derived.deliveredCount;
        }

        tx.update(shipmentRef, shipmentUpdate);

        return {
          pieceId: pieceRef.id,
          shipmentId: shipmentRef.id,
          newStatus: result.newStatus,
          shipmentNumber: shipmentData.shipmentNumber as string,
          pieceNumber: pieceData.pieceNumber as number,
        };
      });
    }),
});
