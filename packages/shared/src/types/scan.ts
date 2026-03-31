import type { ScanAction } from "../enums";

export interface ScanInput {
  qrCode: string;
  action: ScanAction;
  signatureUrl?: string;
  photoUrl?: string;
}

export interface ScanResult {
  pieceId: string;
  shipmentId: string;
  newStatus: string;
  shipmentNumber: string;
  pieceNumber: number;
}
