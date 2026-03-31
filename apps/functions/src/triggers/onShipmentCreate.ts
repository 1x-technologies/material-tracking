import { onDocumentCreated } from "firebase-functions/v2/firestore";

export const onShipmentCreated = onDocumentCreated(
  {
    document: "shipments/{shipmentId}",
    region: "us-central1",
  },
  async (event) => {
    const data = event.data?.data();
    if (!data) return;

    console.log(`Shipment created: ${data.shipmentNumber} with ${data.pieceCount} pieces`);
  },
);
