import {
  FontFamily,
  Label,
  QRErrorCorrection,
} from "@schie/fluent-zpl";
import type { LabelData } from "../../components/shipment/LabelPreviewCard";
import { pieceFraction, truncateDescription } from "../labelFormatters";

export function buildLabelZpl(label: LabelData): string {
  return Label.create({ w: 812, h: 609, dpi: 203 })
    .text({
      at: { x: 20, y: 20 },
      text: label.shipmentNumber,
      font: { family: FontFamily.B, h: 32, w: 28 },
    })
    .text({
      at: { x: 20, y: 65 },
      text: pieceFraction(label.pieceNumber, label.pieceCount),
      font: { family: FontFamily.B, h: 28, w: 24 },
    })
    .text({
      at: { x: 20, y: 110 },
      text: `From: ${label.senderName}`,
      font: { family: FontFamily.A, h: 24, w: 20 },
    })
    .text({
      at: { x: 20, y: 145 },
      text: `To: ${label.receiverName}`,
      font: { family: FontFamily.A, h: 24, w: 20 },
    })
    .text({
      at: { x: 20, y: 185 },
      text: `${label.originName} -> ${label.destinationName}`,
      font: { family: FontFamily.A, h: 22, w: 18 },
    })
    .text({
      at: { x: 20, y: 220 },
      text: `Priority: ${label.priority}`,
      font: { family: FontFamily.A, h: 20, w: 16 },
    })
    .text({
      at: { x: 20, y: 250 },
      text: `Category: ${label.category}`,
      font: { family: FontFamily.A, h: 20, w: 16 },
    })
    .text({
      at: { x: 20, y: 280 },
      text: truncateDescription(label.description, 40),
      font: { family: FontFamily.A, h: 18, w: 14 },
    })
    .qr({
      at: { x: 530, y: 80 },
      text: label.qrCode,
      magnification: 5,
      errorCorrection: QRErrorCorrection.H,
      model: 2,
    })
    .toZPL();
}

export function buildBatchZpl(labels: LabelData[], copies = 1): string {
  return labels
    .flatMap((lbl) => Array.from({ length: copies }, () => buildLabelZpl(lbl)))
    .join("");
}
