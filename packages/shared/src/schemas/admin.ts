import { z } from "zod";

const printerSchema = z.object({
  name: z.string(),
  ip: z.string(),
  model: z.string(),
  isDefault: z.boolean(),
});

export const updateUserSchema = z.object({
  uid: z.string(),
  patch: z.object({
    role: z.enum(["admin", "driver", "staff"]).nullable().optional(),
    locationId: z.string().optional(),
    active: z.boolean().optional(),
  }),
});

export const bulkAssignRoleSchema = z.object({
  uids: z.array(z.string()).min(1),
  role: z.enum(["admin", "driver", "staff"]),
});

export const createLocationSchema = z.object({
  name: z.string().min(1).max(50),
  fullName: z.string().min(1).max(100),
  address: z.string().min(1).max(200),
  printers: z.array(printerSchema).default([]),
});

export const updateLocationSchema = z.object({
  id: z.string(),
  patch: z.object({
    name: z.string().min(1).max(50).optional(),
    fullName: z.string().min(1).max(100).optional(),
    address: z.string().min(1).max(200).optional(),
    active: z.boolean().optional(),
    printers: z.array(printerSchema).optional(),
  }),
});

export const updateSettingsSchema = z.object({
  stalledThresholdHours: z.number().int().min(1).optional(),
  overdueThresholdHours: z.number().int().min(1).optional(),
  agedThresholdHours: z.number().int().min(1).optional(),
  defaultNotificationPrefs: z
    .object({
      onDelivery: z.boolean(),
      onPickup: z.boolean(),
      onTransit: z.boolean(),
    })
    .optional(),
});

export const reportDateRangeSchema = z.object({
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
});
