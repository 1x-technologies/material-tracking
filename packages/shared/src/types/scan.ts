import type { PieceStatus, ScanAction } from "../enums";

export interface ScanInput {
  qrCode: string;
  action?: ScanAction;
  signatureUrl?: string;
  photoUrls?: string[];
}

export interface ScanResult {
  pieceId: string;
  shipmentId: string;
  newStatus: PieceStatus;
  shipmentNumber: string;
  pieceNumber: number;
  origin: string | null;
  destination: string | null;
  description: string | null;
  totalPieces: number;
}
