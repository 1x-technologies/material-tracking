import { z } from "zod";

export const createShipmentSchema = z.object({
  description: z.string().min(1, "Description is required").max(500),
  category: z.enum(["parts", "documents", "supplies", "equipment", "other"]),
  priority: z.enum(["urgent", "standard", "low"]),
  sender: z.object({
    uid: z.string(),
    name: z.string().min(1),
    email: z.string().email(),
    department: z.string().optional(),
  }),
  receiver: z.object({
    uid: z.string().optional(),
    name: z.string().min(1),
    email: z.string().email().optional(),
    department: z.string().optional(),
    isExternal: z.boolean(),
  }),
  originId: z.string().min(1),
  destinationId: z.string().min(1),
  pieceCount: z.number().int().min(1).max(99),
  notificationPrefs: z
    .object({
      onTransit: z.boolean(),
      onDelivery: z.boolean(),
      onPickup: z.boolean(),
    })
    .optional(),
});

export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;
