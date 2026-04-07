import type { LabelData } from "../../components/shipment/LabelPreviewCard";
import { pieceFraction, truncateDescription } from "../labelFormatters";

/**
 * ZD621-300dpi label configuration.
 * Thermal transfer mode, 3.5" x 2.3" labels with ribbon.
 * Darkness: 20, Speed: 3 IPS.
 * Content starts at X=100 to avoid left cutoff.
 * QR code on right side at X=800.
 */
const X = 100;        // Left margin
const QR_X = 800;     // QR code position
const PW = 1218;      // Full printhead width
const LL = 684;       // Label length (2.3" at 300dpi)

function truncate(text: string, maxChars: number): string {
  return text.length > maxChars ? text.substring(0, maxChars - 1) + "." : text;
}

export function buildLabelZpl(label: LabelData): string {
  const desc = truncateDescription(label.description, 25);
  const piece = pieceFraction(label.pieceNumber, label.pieceCount);
  const sender = truncate(label.senderName, 22);
  const receiver = truncate(label.receiverName, 22);
  const route = `${label.originName} > ${label.destinationName}`;
  const categoryDesc = `${label.category}${desc ? " - " + desc : ""}`;

  return [
    "^XA",
    `^PW${PW}`,
    `^LL${LL}`,
    "^MD20",     // Darkness 20
    "^PR3",      // Speed 3 IPS

    // Shipment number (large)
    `^FO${X},35^CF0,86^FD${label.shipmentNumber}^FS`,

    // Piece fraction
    `^FO${X},130^CF0,56^FD${piece}^FS`,

    // Separator
    `^FO${X},195^GB900,3,3^FS`,

    // From / To
    `^FO${X},220^CF0,50^FDFrom: ${sender}^FS`,
    `^FO${X},280^CF0,50^FDTo: ${receiver}^FS`,

    // Route
    `^FO${X},345^CF0,50^FD${route}^FS`,

    // Priority
    `^FO${X},410^CF0,44^FDPriority: ${label.priority}^FS`,

    // Category + Description
    `^FO${X},465^CF0,40^FD${truncate(categoryDesc, 25)}^FS`,

    // QR Code (right side, large)
    `^FO${QR_X},220^BQN,2,7^FDQA,${label.qrCode}^FS`,
    `^FO${QR_X + 10},510^CF0,30^FDScan QR^FS`,

    // Bottom separator
    `^FO${X},620^GB900,3,3^FS`,
    `^FO${X},642^CF0,30^FDScan to track shipment^FS`,

    "^XZ",
  ].join("\n");
}

export function buildBatchZpl(labels: LabelData[], copies = 1): string {
  return labels
    .flatMap((lbl) => Array.from({ length: copies }, () => buildLabelZpl(lbl)))
    .join("\n");
}
