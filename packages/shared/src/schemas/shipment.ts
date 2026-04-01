import { z } from "zod";

const shipmentCategoryEnum = z.enum([
  "documents",
  "parts",
  "samples",
  "equipment",
  "personal",
  "other",
]);

const priorityEnum = z.enum(["urgent", "standard", "low"]);

const senderSchema = z.object({
  uid: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  department: z.string().optional(),
});

const internalReceiverSchema = z.object({
  isExternal: z.literal(false),
  uid: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email().optional(),
  department: z.string().optional(),
});

const externalReceiverSchema = z.object({
  isExternal: z.literal(true),
  name: z.string().min(1),
  company: z.string().min(1),
  email: z.string().email(),
  department: z.string().optional(),
});

const receiverSchema = z.discriminatedUnion("isExternal", [
  internalReceiverSchema,
  externalReceiverSchema,
]);

const notificationPrefsSchema = z.object({
  onTransit: z.boolean(),
  onDelivery: z.boolean(),
  onPickup: z.boolean(),
});

export const createShipmentSchema = z.object({
  description: z.string().min(1, "Description is required").max(500),
  category: shipmentCategoryEnum,
  priority: priorityEnum,
  sender: senderSchema,
  receiver: receiverSchema,
  originId: z.string().min(1),
  destinationId: z.string().min(1),
  pieceCount: z.number().int().min(1).max(99),
  notificationPrefs: notificationPrefsSchema.optional(),
});

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;

export const updateShipmentInputSchema = z.object({
  description: z.string().min(1).max(500).optional(),
  category: shipmentCategoryEnum.optional(),
  priority: priorityEnum.optional(),
  sender: senderSchema.optional(),
  receiver: receiverSchema.optional(),
  originId: z.string().min(1).optional(),
  destinationId: z.string().min(1).optional(),
  notificationPrefs: notificationPrefsSchema.optional(),
});

export type UpdateShipmentInput = z.infer<typeof updateShipmentInputSchema>;

export const cancelShipmentInputSchema = z.object({
  shipmentId: z.string().min(1),
});

export type CancelShipmentInput = z.infer<typeof cancelShipmentInputSchema>;
