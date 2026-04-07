import type { ProcessScanInput, ScanAction, ScanResult } from "@material-tracking/shared";
import { TRPCError } from "@trpc/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { deriveShipmentStatus, getNextAction, validateTransition } from "./shipment-status";

export async function processOneScan(
  db: FirebaseFirestore.Firestore,
  user: { uid: string; email?: string; name?: string },
  input: ProcessScanInput,
): Promise<ScanResult> {
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
    // All reads MUST happen before any writes in Firestore transactions
    const [pieceSnap, shipmentSnap, allPiecesSnap] = await Promise.all([
      tx.get(pieceRef),
      tx.get(shipmentRef),
      tx.get(shipmentRef.collection("pieces")),
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

    // Smart auto-detect: if scanner is the receiver and piece is delivered, go to completed
    let action = input.action ?? null;
    if (!action) {
      const receiver = shipmentData.receiver as { email?: string } | undefined;
      const scannerEmail = user.email?.toLowerCase();
      const receiverEmail = receiver?.email?.toLowerCase();

      if (scannerEmail && receiverEmail && scannerEmail === receiverEmail && pieceData.status === "delivered") {
        action = "completed" as ScanAction;
      } else {
        action = getNextAction(pieceData.status);
      }
    }

    if (!action) {
      throw new TRPCError({
        code: "CONFLICT",
        message: `NO_NEXT_ACTION: piece is already at terminal status ${pieceData.status}`,
      });
    }

    const result = validateTransition(pieceData.status, action);
    if (!result.valid) {
      throw new TRPCError({ code: "CONFLICT", message: result.error });
    }

    const event = {
      action,
      timestamp: Timestamp.now(),
      userId: user.uid,
      userName: user.name ?? user.email ?? "",
      ...(input.signatureUrl && { signatureUrl: input.signatureUrl }),
      ...(input.photoUrls?.length && { photoUrls: input.photoUrls }),
    };

    const pieceUpdate: Record<string, unknown> = {
      status: result.newStatus,
      events: FieldValue.arrayUnion(event),
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (action === "delivered") {
      pieceUpdate.deliveredAt = FieldValue.serverTimestamp();
    }
    if (action === "completed") {
      pieceUpdate.completedAt = FieldValue.serverTimestamp();
    }

    if (action === "delivered" && input.signatureUrl) {
      pieceUpdate.deliverySignatureUrl = input.signatureUrl;
    }

    if (input.photoUrls?.length) {
      pieceUpdate.photoUrls = FieldValue.arrayUnion(...input.photoUrls);
    }

    tx.update(pieceRef, pieceUpdate);

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
    // Set deliveredAt on shipment when it first reaches delivered status (used by reports)
    if (derived.status === "delivered" && !shipmentData.deliveredAt) {
      shipmentUpdate.deliveredAt = FieldValue.serverTimestamp();
    }
    // Copy delivery signature to shipment level for display on detail page
    if (input.signatureUrl && !shipmentData.signatureUrl) {
      shipmentUpdate.signatureUrl = input.signatureUrl;
    }
    // Set completedAt on shipment when all pieces are completed
    if (derived.status === "completed" && !shipmentData.completedAt) {
      shipmentUpdate.completedAt = FieldValue.serverTimestamp();
    }

    tx.update(shipmentRef, shipmentUpdate);

    const origin = shipmentData.origin as { name: string; locationId: string } | undefined;
    const destination = shipmentData.destination as { name: string; locationId: string } | undefined;

    return {
      pieceId: pieceRef.id,
      shipmentId: shipmentRef.id,
      newStatus: result.newStatus,
      shipmentNumber: shipmentData.shipmentNumber as string,
      pieceNumber: pieceData.pieceNumber as number,
      origin: origin?.name ?? null,
      destination: destination?.name ?? null,
      description: (shipmentData.description as string) ?? null,
      totalPieces: allPiecesSnap.size,
    };
  });
}
