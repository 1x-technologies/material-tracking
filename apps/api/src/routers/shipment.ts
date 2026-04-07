import {
  cancelShipmentInputSchema,
  createShipmentSchema,
  shipmentSearchInputSchema,
  updateShipmentInputSchema,
} from "@material-tracking/shared";
import type { SearchCursor } from "@material-tracking/shared";
import { TRPCError } from "@trpc/server";
import { FieldValue, FieldPath, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";
import { db } from "../lib/firebase";
import { protectedProcedure, staffProcedure } from "../middleware/auth";
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

      const [counterSnap, originSnap, destSnap] = await Promise.all([
        tx.get(counterRef),
        tx.get(db.doc(`locations/${input.originId}`)),
        tx.get(db.doc(`locations/${input.destinationId}`)),
      ]);

      const last = counterSnap.exists ? (counterSnap.data()?.last as number) ?? 0 : 0;
      const next = last + 1;
      tx.set(counterRef, { last: next }, { merge: true });

      const shipmentNumber = `SH-${utcDateStr()}-${padSeq(next)}`;

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
          qrCode: pieceRef.id,
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

  /**
   * Paginated shipment search with optional status and date range filters.
   * Returns at most 50 items per page with cursor-based pagination (requests 51 to detect hasMore).
   * Sender/receiver/keyword filtering is client-side per D-03.
   *
   * Shipment documents are retained indefinitely; no server-side purge (HIST-02).
   */
  search: staffProcedure
    .input(shipmentSearchInputSchema)
    .query(async ({ input }) => {
      const PAGE_SIZE = 50;
      let query: FirebaseFirestore.Query = db
        .collection("shipments")
        .orderBy("createdAt", "desc")
        .orderBy(FieldPath.documentId(), "desc");

      // Apply status filter (AND with date range when both provided)
      if (input.status) {
        query = query.where("status", "==", input.status);
      }

      // Apply date range filters (createdAt stored as Firestore Timestamp)
      if (input.dateFrom) {
        query = query.where("createdAt", ">=", Timestamp.fromDate(new Date(input.dateFrom)));
      }
      if (input.dateTo) {
        query = query.where("createdAt", "<=", Timestamp.fromDate(new Date(input.dateTo)));
      }

      // Apply cursor for pagination (startAfter with both orderBy values)
      if (input.cursor) {
        const cursorTimestamp = Timestamp.fromDate(new Date(input.cursor.createdAt));
        query = query.startAfter(cursorTimestamp, input.cursor.id);
      }

      // Request PAGE_SIZE + 1 to detect if more pages exist
      query = query.limit(PAGE_SIZE + 1);

      const snapshot = await query.get();
      const docs = snapshot.docs;

      const hasMore = docs.length > PAGE_SIZE;
      const itemDocs = hasMore ? docs.slice(0, PAGE_SIZE) : docs;

      const items = itemDocs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      let nextCursor: SearchCursor | null = null;
      if (hasMore && itemDocs.length > 0) {
        const lastDoc = itemDocs[itemDocs.length - 1];
        const lastData = lastDoc.data();
        const lastCreatedAt = lastData.createdAt as FirebaseFirestore.Timestamp;
        nextCursor = {
          createdAt: lastCreatedAt.toDate().toISOString(),
          id: lastDoc.id,
        };
      }

      return { items, nextCursor, hasMore };
    }),

  update: staffProcedure
    .input(
      z.object({
        shipmentId: z.string().min(1),
        patch: updateShipmentInputSchema,
      }),
    )
    .mutation(async ({ input }) => {
      await db.runTransaction(async (tx) => {
        const ref = db.doc(`shipments/${input.shipmentId}`);
        const snap = await tx.get(ref);

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
          const originSnap = await tx.get(db.doc(`locations/${originId}`));
          if (!originSnap.exists || originSnap.data()?.active !== true) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "INVALID_LOCATION: origin not found or inactive" });
          }
          updateData.origin = { locationId: originSnap.id, name: originSnap.data()!.name as string };
        }

        if (destinationId) {
          const destSnap = await tx.get(db.doc(`locations/${destinationId}`));
          if (!destSnap.exists || destSnap.data()?.active !== true) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "INVALID_LOCATION: destination not found or inactive" });
          }
          updateData.destination = { locationId: destSnap.id, name: destSnap.data()!.name as string };
        }

        tx.update(ref, updateData);
      });

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

  listPieces: protectedProcedure
    .input(z.object({ shipmentId: z.string().min(1) }))
    .query(async ({ input }) => {
      const shipmentSnap = await db.doc(`shipments/${input.shipmentId}`).get();
      if (!shipmentSnap.exists) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Shipment not found" });
      }

      const piecesSnap = await db
        .collection(`shipments/${input.shipmentId}/pieces`)
        .orderBy("pieceNumber", "asc")
        .get();

      return piecesSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }),
});
