import type { Timestamp } from "firebase/firestore";
import type { PieceStatus, ScanAction } from "../enums";
import type { LocationRef } from "./shipment";

export interface PieceEvent {
  action: ScanAction;
  timestamp: Date;
  userId: string;
  userName: string;
  location?: LocationRef;
  signatureUrl?: string;
  photoUrls?: string[];
}

export interface Piece {
  id?: string;
  shipmentId: string;
  pieceNumber: number;
  qrCode: string;
  status: PieceStatus;
  labelUrl?: string;
  events: PieceEvent[];
  currentLocation: LocationRef;
  deliverySignatureUrl?: string;
  pickupSignatureUrl?: string;
  photoUrls: string[];
  deliveredAt?: Timestamp;
  completedAt?: Timestamp;
  updatedAt: Timestamp;
}
