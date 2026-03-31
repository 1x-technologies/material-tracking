export const ShipmentStatus = {
  CREATED: "created",
  IN_TRANSIT: "in_transit",
  PARTIALLY_DELIVERED: "partially_delivered",
  DELIVERED: "delivered",
  PICKED_UP: "picked_up",
  CANCELLED: "cancelled",
} as const;
export type ShipmentStatus = (typeof ShipmentStatus)[keyof typeof ShipmentStatus];

export const PieceStatus = {
  CREATED: "created",
  IN_TRANSIT: "in_transit",
  DELIVERED: "delivered",
  PICKED_UP: "picked_up",
} as const;
export type PieceStatus = (typeof PieceStatus)[keyof typeof PieceStatus];

export const Priority = {
  URGENT: "urgent",
  STANDARD: "standard",
  LOW: "low",
} as const;
export type Priority = (typeof Priority)[keyof typeof Priority];

export const UserRole = {
  ADMIN: "admin",
  DRIVER: "driver",
  STAFF: "staff",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ShipmentCategory = {
  PARTS: "parts",
  DOCUMENTS: "documents",
  SUPPLIES: "supplies",
  EQUIPMENT: "equipment",
  OTHER: "other",
} as const;
export type ShipmentCategory = (typeof ShipmentCategory)[keyof typeof ShipmentCategory];

export const ScanAction = {
  CREATED: "created",
  IN_TRANSIT: "in_transit",
  DELIVERED: "delivered",
  PICKED_UP: "picked_up",
} as const;
export type ScanAction = (typeof ScanAction)[keyof typeof ScanAction];
