import { z } from "zod";

export const processScanSchema = z.object({
  qrCode: z.string().min(1, "QR code is required"),
  action: z.enum(["in_transit", "delivered", "picked_up"]),
  signatureUrl: z.string().url().optional(),
  photoUrl: z.string().url().optional(),
});

export type ProcessScanInput = z.infer<typeof processScanSchema>;

export const batchScanSchema = z.object({
  scans: z.array(processScanSchema).min(1).max(50),
});

export type BatchScanInput = z.infer<typeof batchScanSchema>;
