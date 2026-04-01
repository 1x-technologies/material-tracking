export interface EmailContent {
  subject: string;
  html: string;
}

export interface ShipmentEmailData {
  shipmentNumber: string;
  status: string;
  pieceCount: number;
  senderName: string;
  receiverName: string;
  detailUrl: string;
}

const BASE_URL = process.env.APP_BASE_URL || "https://material-tracking.web.app";

function shipmentDetailUrl(shipmentId: string): string {
  return `${BASE_URL}/shipments/${shipmentId}`;
}

function wrapHtml(title: string, body: string, detailUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h2 style="margin: 0 0 16px; font-size: 20px; color: #111;">${title}</h2>
  ${body}
  <p style="margin: 24px 0 0;">
    <a href="${detailUrl}" style="display: inline-block; padding: 10px 20px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px;">View Shipment Details</a>
  </p>
  <p style="margin: 24px 0 0; font-size: 12px; color: #888;">Material Tracking System</p>
</body>
</html>`;
}

function detailsTable(data: ShipmentEmailData): string {
  const rows = [
    ["Shipment #", data.shipmentNumber],
    ["Status", data.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())],
    ["Pieces", String(data.pieceCount)],
    ["Sender", data.senderName],
    ["Receiver", data.receiverName],
  ];

  return `<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
    ${rows.map(([label, value]) => `<tr><td style="padding: 6px 12px 6px 0; color: #666; font-size: 14px;">${label}</td><td style="padding: 6px 0; font-size: 14px; font-weight: 500;">${value}</td></tr>`).join("\n    ")}
  </table>`;
}

export function buildDeliveredEmail(data: ShipmentEmailData): EmailContent {
  return {
    subject: `Shipment ${data.shipmentNumber} Delivered`,
    html: wrapHtml(
      `Shipment ${data.shipmentNumber} Delivered`,
      `<p style="margin: 0 0 8px; font-size: 15px;">All pieces have been delivered and are awaiting pickup.</p>${detailsTable(data)}`,
      data.detailUrl,
    ),
  };
}

export function buildPickedUpEmail(data: ShipmentEmailData): EmailContent {
  return {
    subject: `Shipment ${data.shipmentNumber} Picked Up`,
    html: wrapHtml(
      `Shipment ${data.shipmentNumber} Picked Up`,
      `<p style="margin: 0 0 8px; font-size: 15px;">All pieces have been picked up by the receiver. This shipment is complete.</p>${detailsTable(data)}`,
      data.detailUrl,
    ),
  };
}

export function buildInTransitEmail(data: ShipmentEmailData): EmailContent {
  return {
    subject: `Shipment ${data.shipmentNumber} In Transit`,
    html: wrapHtml(
      `Shipment ${data.shipmentNumber} In Transit`,
      `<p style="margin: 0 0 8px; font-size: 15px;">This shipment is now on the way to its destination.</p>${detailsTable(data)}`,
      data.detailUrl,
    ),
  };
}

export function buildAgedReminderEmail(
  data: ShipmentEmailData & { hoursAged: number },
): EmailContent {
  const hoursText = data.hoursAged >= 48
    ? `${Math.round(data.hoursAged / 24)} days`
    : `${Math.round(data.hoursAged)} hours`;

  return {
    subject: `Reminder: Shipment ${data.shipmentNumber} awaiting pickup`,
    html: wrapHtml(
      `Reminder: Shipment ${data.shipmentNumber} Awaiting Pickup`,
      `<p style="margin: 0 0 8px; font-size: 15px;">This shipment was delivered <strong>${hoursText} ago</strong> and is still awaiting pickup.</p>${detailsTable(data)}`,
      data.detailUrl,
    ),
  };
}

export { shipmentDetailUrl };
