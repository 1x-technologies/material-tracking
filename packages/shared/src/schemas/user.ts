import { z } from "zod";

export const firestoreUserProfileSchema = z.object({
  role: z.enum(["admin", "driver", "staff"]),
  email: z.string().default(""),
  displayName: z.string().default(""),
  department: z.string().default(""),
  locationId: z.string().default(""),
  fcmTokens: z.array(z.string()).default([]),
  notificationPrefs: z
    .object({
      onDelivery: z.boolean().default(true),
      onPickup: z.boolean().default(true),
      onTransit: z.boolean().default(false),
    })
    .default({ onDelivery: true, onPickup: true, onTransit: false }),
});

export type FirestoreUserProfile = z.infer<typeof firestoreUserProfileSchema>;
