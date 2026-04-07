import { z } from "zod";

export const pieceEventSchema = z.object({
  action: z.enum(["created", "in_transit", "delivered", "completed"]),
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
  photoUrls: z.array(z.string().url()).max(10).optional(),
});

export type PieceEventInput = z.infer<typeof pieceEventSchema>;
