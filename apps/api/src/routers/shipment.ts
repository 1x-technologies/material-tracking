import {
  cancelShipmentInputSchema,
  createShipmentSchema,
  updateShipmentInputSchema,
} from "@material-tracking/shared";
import { TRPCError } from "@trpc/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { db } from "../lib/firebase";
import { staffProcedure } from "../middleware/auth";
import { router } from "../trpc";

function padSeq(n: number): string {
  return String(n).padStart(4, "0");
}

function utcDateStr(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export const shipmentRouter = router({
  create: staffProcedure.input(createShipmentSchema).mutation(async ({ ctx, input }) => {
    const shipmentId = db.collection("shipments").doc().id;

    const result = await db.runTransaction(async (tx) => {
      const counterRef = db.doc("counters/shipments");
      const counterSnap = await tx.get(counterRef);
      const last = counterSnap.exists ? (counterSnap.data()?.last as number) ?? 0 : 0;
      const next = last + 1;
      tx.set(counterRef, { last: next }, { merge: true });

      const shipmentNumber = `SH-${utcDateStr()}-${padSeq(next)}`;

      const [originSnap, destSnap] = await Promise.all([
        tx.get(db.doc(`locations/${input.originId}`)),
        tx.get(db.doc(`locations/${input.destinationId}`)),
      ]);

      if (!originSnap.exists || originSnap.data()?.active !== true) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "INVALID_LOCATION: origin not found or inactive" });
      }
      if (!destSnap.exists || destSnap.data()?.active !== true) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "INVALID_LOCATION: destination not found or inactive" });
      }

      const originData = originSnap.data()!;
      const destData = destSnap.data()!;

      const origin = { locationId: originSnap.id, name: originData.name as string };
      const destination = { locationId: destSnap.id, name: destData.name as string };

      const shipmentRef = db.doc(`shipments/${shipmentId}`);
      tx.set(shipmentRef, {
        shipmentNumber,
        status: "created",
        priority: input.priority,
        category: input.category,
        description: input.description,
        pieceCount: input.pieceCount,
        sender: input.sender,
        receiver: input.receiver,
        origin,
        destination,
        createdBy: {
          uid: ctx.user.uid,
          name: ctx.user.name ?? ctx.user.email ?? "",
        },
        notificationPrefs: input.notificationPrefs ?? {
          onTransit: false,
          onDelivery: true,
          onPickup: true,
        },
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      for (let i = 1; i <= input.pieceCount; i++) {
        const pieceRef = db.collection(`shipments/${shipmentId}/pieces`).doc();
        tx.set(pieceRef, {
          shipmentId,
          pieceNumber: i,
          qrCode: `pending:${shipmentId}:${i}`,
          status: "created",
          events: [],
          currentLocation: origin,
          photoUrls: [],
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      return { shipmentId, shipmentNumber };
    });

    return result;
  }),

  getById: staffProcedure
    .input(z.object({ shipmentId: z.string().min(1) }))
    .query(async ({ input }) => {
      const snap = await db.doc(`shipments/${input.shipmentId}`).get();
      if (!snap.exists) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Shipment not found" });
      }
      return { id: snap.id, ...snap.data() };
    }),

  update: staffProcedure
    .input(
      z.object({
        shipmentId: z.string().min(1),
        patch: updateShipmentInputSchema,
      }),
    )
    .mutation(async ({ input }) => {
      const ref = db.doc(`shipments/${input.shipmentId}`);
      const snap = await ref.get();

      if (!snap.exists) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Shipment not found" });
      }

      const current = snap.data()!;
      if (current.status !== "created") {
        throw new TRPCError({ code: "CONFLICT", message: "SHIPMENT_NOT_EDITABLE" });
      }

      const { originId, destinationId, ...directFields } = input.patch;
      const updateData: Record<string, unknown> = {
        ...directFields,
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (originId) {
        const originSnap = await db.doc(`locations/${originId}`).get();
        if (!originSnap.exists || originSnap.data()?.active !== true) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "INVALID_LOCATION: origin not found or inactive" });
        }
        updateData.origin = { locationId: originSnap.id, name: originSnap.data()!.name as string };
      }

      if (destinationId) {
        const destSnap = await db.doc(`locations/${destinationId}`).get();
        if (!destSnap.exists || destSnap.data()?.active !== true) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "INVALID_LOCATION: destination not found or inactive" });
        }
        updateData.destination = { locationId: destSnap.id, name: destSnap.data()!.name as string };
      }

      await ref.update(updateData);

      return { success: true };
    }),

  cancel: staffProcedure.input(cancelShipmentInputSchema).mutation(async ({ input }) => {
    const ref = db.doc(`shipments/${input.shipmentId}`);
    const snap = await ref.get();

    if (!snap.exists) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Shipment not found" });
    }

    const current = snap.data()!;
    if (current.status !== "created") {
      throw new TRPCError({ code: "CONFLICT", message: "SHIPMENT_NOT_CANCELLABLE" });
    }

    await ref.update({
      status: "cancelled",
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  }),
});
