import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { sendSlackDM } from "../lib/slack";
import {
  type SlackNotificationData,
  buildCompletedSlackMessage,
  buildDeliveredSlackMessage,
  buildInTransitSlackMessage,
  shipmentDetailUrl,
} from "../lib/slackTemplates";

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

    const notifData: SlackNotificationData = {
      shipmentNumber: after.shipmentNumber,
      status: newStatus,
      pieceCount: after.pieceCount,
      senderName: after.sender.name,
      receiverName: after.receiver.name,
      detailUrl: shipmentDetailUrl(shipmentId),
    };

    let message: { text: string; blocks: object[] } | null = null;

    if (newStatus === "delivered" && after.notificationPrefs?.onDelivery) {
      message = buildDeliveredSlackMessage(notifData);
    } else if (newStatus === "completed" && after.notificationPrefs?.onPickup) {
      message = buildCompletedSlackMessage(notifData);
    } else if (newStatus === "in_transit" && after.notificationPrefs?.onTransit) {
      message = buildInTransitSlackMessage(notifData);
    } else {
      return;
    }

    const recipients: string[] = [after.sender.email];
    if (after.receiver.email) {
      recipients.push(after.receiver.email);
    }
    const uniqueRecipients = [...new Set(recipients.filter(Boolean))];

    console.log(
      `Sending ${newStatus} Slack notification for ${after.shipmentNumber} to ${uniqueRecipients.length} recipients`,
    );

    await Promise.allSettled(
      uniqueRecipients.map((email) => sendSlackDM(email, message!)),
    );
  },
);
