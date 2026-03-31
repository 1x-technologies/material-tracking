import type { Timestamp } from "firebase/firestore";
import type { UserRole } from "../enums";

export interface NotificationSettings {
  onDelivery: boolean;
  onPickup: boolean;
  onTransit: boolean;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  department: string;
  role: UserRole;
  locationId: string;
  fcmTokens: string[];
  notificationPrefs: NotificationSettings;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
}
