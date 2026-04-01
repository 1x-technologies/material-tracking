import type { Timestamp } from "firebase/firestore";
import type { Priority, ShipmentCategory, ShipmentStatus } from "../enums";

export interface ShipmentSender {
  uid: string;
  name: string;
  email: string;
  department?: string;
}

export interface ShipmentReceiver {
  uid?: string;
  name: string;
  email?: string;
  department?: string;
  isExternal: boolean;
  /** Required when isExternal is true (enforced by Zod at runtime) */
  company?: string;
}

export interface LocationRef {
  locationId: string;
  name: string;
}

export interface CreatedBy {
  uid: string;
  name: string;
}

export interface NotificationPrefs {
  onTransit: boolean;
  onDelivery: boolean;
  onPickup: boolean;
}

export interface Shipment {
  id?: string;
  shipmentNumber: string;
  status: ShipmentStatus;
  priority: Priority;
  category: ShipmentCategory;
  description: string;
  pieceCount: number;
  sender: ShipmentSender;
  receiver: ShipmentReceiver;
  origin: LocationRef;
  destination: LocationRef;
  createdBy: CreatedBy;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deliveredAt?: Timestamp;
  pickedUpAt?: Timestamp;
  lastAgedReminderAt?: Timestamp;
  notificationPrefs: NotificationPrefs;
}
