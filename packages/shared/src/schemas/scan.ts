import { z } from "zod";

export const processScanSchema = z.object({
  qrCode: z.string().min(1, "QR code is required"),
  action: z.enum(["in_transit", "delivered", "completed"]).optional(),
  signatureUrl: z.string().url().optional(),
  photoUrls: z.array(z.string().url()).max(10).optional(),
});

export type ProcessScanInput = z.infer<typeof processScanSchema>;

export const batchScanSchema = z.object({
  scans: z.array(processScanSchema).min(1).max(50),
});

export type BatchScanInput = z.infer<typeof batchScanSchema>;
