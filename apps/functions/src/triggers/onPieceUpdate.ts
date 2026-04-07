import { FieldValue } from "firebase-admin/firestore";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { db } from "../lib/firebase";

export const onPieceStatusChange = onDocumentUpdated(
  {
    document: "shipments/{shipmentId}/pieces/{pieceId}",
    region: "us-central1",
  },
  async (event) => {
    try {
      const before = event.data?.before.data();
      const after = event.data?.after.data();

      if (!before || !after || before.status === after.status) return;

      const shipmentRef = db.collection("shipments").doc(event.params.shipmentId);

      // Validate shipment exists before updating
      const shipmentSnap = await shipmentRef.get();
      if (!shipmentSnap.exists) {
        console.error(
          `onPieceStatusChange: shipment ${event.params.shipmentId} not found for piece ${event.params.pieceId}`,
        );
        return;
      }

      const piecesSnap = await shipmentRef.collection("pieces").get();
      const statuses = piecesSnap.docs.map((d) => d.data().status as string);

      const derivedStatus = deriveShipmentStatus(statuses);

      await shipmentRef.update({
        status: derivedStatus,
        updatedAt: FieldValue.serverTimestamp(),
        ...(derivedStatus === "delivered" ? { deliveredAt: FieldValue.serverTimestamp() } : {}),
        ...(derivedStatus === "completed" ? { completedAt: FieldValue.serverTimestamp() } : {}),
      });
    } catch (error) {
      console.error(
        `onPieceStatusChange error for shipment ${event.params.shipmentId}, piece ${event.params.pieceId}:`,
        error,
      );
    }
  },
);

function deriveShipmentStatus(pieceStatuses: string[]): string {
  if (pieceStatuses.every((s) => s === "completed")) return "completed";
  if (pieceStatuses.every((s) => s === "delivered" || s === "completed")) return "delivered";
  if (pieceStatuses.some((s) => s === "delivered" || s === "completed"))
    return "partially_delivered";
  if (pieceStatuses.some((s) => s === "in_transit")) return "in_transit";
  return "created";
}
