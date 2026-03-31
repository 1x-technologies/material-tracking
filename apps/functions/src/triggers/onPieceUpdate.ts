import { FieldValue } from "firebase-admin/firestore";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { db } from "../lib/firebase";

export const onPieceStatusChange = onDocumentUpdated(
  {
    document: "shipments/{shipmentId}/pieces/{pieceId}",
    region: "us-central1",
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after || before.status === after.status) return;

    const shipmentRef = db.collection("shipments").doc(event.params.shipmentId);
    const piecesSnap = await shipmentRef.collection("pieces").get();
    const statuses = piecesSnap.docs.map((d) => d.data().status as string);

    const derivedStatus = deriveShipmentStatus(statuses);

    await shipmentRef.update({
      status: derivedStatus,
      updatedAt: FieldValue.serverTimestamp(),
      ...(derivedStatus === "delivered" ? { deliveredAt: FieldValue.serverTimestamp() } : {}),
      ...(derivedStatus === "picked_up" ? { pickedUpAt: FieldValue.serverTimestamp() } : {}),
    });
  },
);

function deriveShipmentStatus(pieceStatuses: string[]): string {
  if (pieceStatuses.every((s) => s === "picked_up")) return "picked_up";
  if (pieceStatuses.every((s) => s === "delivered" || s === "picked_up")) return "delivered";
  if (pieceStatuses.some((s) => s === "delivered" || s === "picked_up"))
    return "partially_delivered";
  if (pieceStatuses.some((s) => s === "in_transit")) return "in_transit";
  return "created";
}
