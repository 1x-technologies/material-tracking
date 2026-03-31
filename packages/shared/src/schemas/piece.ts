import { z } from "zod";

export const pieceEventSchema = z.object({
  action: z.enum(["created", "in_transit", "delivered", "picked_up"]),
  timestamp: z.date(),
  userId: z.string(),
  userName: z.string(),
  location: z
    .object({
      locationId: z.string(),
      name: z.string(),
    })
    .optional(),
  signatureUrl: z.string().url().optional(),
  photoUrl: z.string().url().optional(),
});

export type PieceEventInput = z.infer<typeof pieceEventSchema>;
