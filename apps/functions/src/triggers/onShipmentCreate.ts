import { onDocumentCreated } from "firebase-functions/v2/firestore";

/**
 * Intentional no-op placeholder for future shipment creation logic.
 * This trigger is registered so it can be extended later (e.g., to send
 * welcome emails, initialize audit logs, or enrich shipment data).
 */
export const onShipmentCreated = onDocumentCreated(
  {
    document: "shipments/{shipmentId}",
    region: "us-central1",
  },
  async (event) => {
    try {
      const data = event.data?.data();
      if (!data) return;

      console.log(`Shipment created: ${data.shipmentNumber} with ${data.pieceCount} pieces`);
    } catch (error) {
      console.error(
        `onShipmentCreated error for shipment ${event.params.shipmentId}:`,
        error,
      );
    }
  },
);
