const BASE_URL =
  process.env.APP_BASE_URL || "https://manufacturing-472518.web.app";

export function shipmentDetailUrl(shipmentId: string): string {
  return `${BASE_URL}/shipments/${shipmentId}`;
}

export interface SlackNotificationData {
  shipmentNumber: string;
  status: string;
  pieceCount: number;
  senderName: string;
  receiverName: string;
  detailUrl: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface SlackMessage {
  text: string;
  blocks: any[];
}

function fieldsSection(data: SlackNotificationData): object {
  return {
    type: "section",
    fields: [
      {
        type: "mrkdwn",
        text: `*Status:*\n${data.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`,
      },
      { type: "mrkdwn", text: `*Pieces:*\n${data.pieceCount}` },
      { type: "mrkdwn", text: `*Sender:*\n${data.senderName}` },
      { type: "mrkdwn", text: `*Receiver:*\n${data.receiverName}` },
    ],
  };
}

function viewShipmentActions(detailUrl: string): object {
  return {
    type: "actions",
    elements: [
      {
        type: "button",
        text: { type: "plain_text", text: "View Shipment" },
        url: detailUrl,
        action_id: "view_shipment",
      },
    ],
  };
}

export function buildDeliveredSlackMessage(
  data: SlackNotificationData,
): SlackMessage {
  return {
    text: `Shipment ${data.shipmentNumber} Delivered`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `Shipment ${data.shipmentNumber} Delivered`,
        },
      },
      fieldsSection(data),
      viewShipmentActions(data.detailUrl),
    ],
  };
}

export function buildCompletedSlackMessage(
  data: SlackNotificationData,
): SlackMessage {
  return {
    text: `Shipment ${data.shipmentNumber} Completed`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `Shipment ${data.shipmentNumber} Completed`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "All pieces have been picked up by the receiver.",
        },
      },
      fieldsSection(data),
      viewShipmentActions(data.detailUrl),
    ],
  };
}

export function buildInTransitSlackMessage(
  data: SlackNotificationData,
): SlackMessage {
  return {
    text: `Shipment ${data.shipmentNumber} In Transit`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `Shipment ${data.shipmentNumber} In Transit`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "This shipment is now on the way to its destination.",
        },
      },
      fieldsSection(data),
      viewShipmentActions(data.detailUrl),
    ],
  };
}

export function buildAgedReminderSlackMessage(
  data: SlackNotificationData & { hoursAged: number },
): SlackMessage {
  const timeText =
    data.hoursAged >= 48
      ? `${Math.round(data.hoursAged / 24)} days`
      : `${Math.round(data.hoursAged)} hours`;

  return {
    text: `Reminder: Shipment ${data.shipmentNumber} awaiting pickup (${timeText})`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "Pickup Reminder" },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Shipment *${data.shipmentNumber}* was delivered *${timeText} ago* and is still awaiting pickup.`,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Sender:*\n${data.senderName}` },
          { type: "mrkdwn", text: `*Pieces:*\n${data.pieceCount}` },
        ],
      },
      viewShipmentActions(data.detailUrl),
    ],
  };
}

export function buildSignatureRequestSlackMessage(data: {
  shipmentNumber: string;
  signUrl: string;
  receiverName: string;
}): SlackMessage {
  return {
    text: `Signature requested for shipment ${data.shipmentNumber}`,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "Signature Requested" },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Shipment *${data.shipmentNumber}* has been delivered to *${data.receiverName}*. Please sign to confirm receipt.`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "Sign Now" },
            style: "primary",
            url: data.signUrl,
            action_id: "sign_shipment",
          },
        ],
      },
    ],
  };
}
