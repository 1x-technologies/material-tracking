import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { sendNotificationEmail } from "../lib/email";
import {
  type ShipmentEmailData,
  buildDeliveredEmail,
  buildInTransitEmail,
  buildPickedUpEmail,
  shipmentDetailUrl,
} from "../lib/emailTemplates";

export const onShipmentStatusChange = onDocumentUpdated(
  {
    document: "shipments/{shipmentId}",
    region: "us-central1",
  },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after || before.status === after.status) return;

    const newStatus = after.status as string;
    const shipmentId = event.params.shipmentId;

    const emailData: ShipmentEmailData = {
      shipmentNumber: after.shipmentNumber,
      status: newStatus,
      pieceCount: after.pieceCount,
      senderName: after.sender.name,
      receiverName: after.receiver.name,
      detailUrl: shipmentDetailUrl(shipmentId),
    };

    let email: { subject: string; html: string } | null = null;

    if (newStatus === "delivered" && after.notificationPrefs?.onDelivery) {
      email = buildDeliveredEmail(emailData);
    } else if (newStatus === "picked_up" && after.notificationPrefs?.onPickup) {
      email = buildPickedUpEmail(emailData);
    } else if (newStatus === "in_transit" && after.notificationPrefs?.onTransit) {
      email = buildInTransitEmail(emailData);
    } else {
      return;
    }

    const recipients: string[] = [after.sender.email];
    if (after.receiver.email) {
      recipients.push(after.receiver.email);
    }
    const uniqueRecipients = [...new Set(recipients.filter(Boolean))];

    console.log(
      `Sending ${newStatus} notification for ${after.shipmentNumber} to ${uniqueRecipients.length} recipients`,
    );

    await Promise.all(
      uniqueRecipients.map((to) =>
        sendNotificationEmail({ to, subject: email!.subject, html: email!.html }),
      ),
    );
  },
);
