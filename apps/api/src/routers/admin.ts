import {
  bulkAssignRoleSchema,
  createLocationSchema,
  reportDateRangeSchema,
  updateLocationSchema,
  updateSettingsSchema,
  updateUserSchema,
} from "@material-tracking/shared";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { db } from "../lib/firebase";
import { adminProcedure } from "../middleware/auth";
import { router } from "../trpc";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toISO(val: unknown): string | null {
  if (!val || typeof val !== "object") return null;
  const ts = val as { toDate?: () => Date };
  return ts.toDate?.()?.toISOString() ?? null;
}

function writeAuditLog(entry: Record<string, unknown>): void {
  db.collection("admin_audit_log")
    .add(entry)
    .catch((err: unknown) => {
      console.error("[admin] audit log write failed:", err);
    });
}

// ---------------------------------------------------------------------------
// Default settings values
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS = {
  stalledThresholdHours: 4,
  overdueThresholdHours: 24,
  agedThresholdHours: 24,
  defaultNotificationPrefs: {
    onDelivery: true,
    onPickup: true,
    onTransit: false,
  },
};

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const adminRouter = router({
  // -----------------------------------------------------------------------
  // User CRUD (ADMN-01)
  // -----------------------------------------------------------------------

  listUsers: adminProcedure.query(async () => {
    const snap = await db.collection("users").get();
    return snap.docs.map((doc) => {
      const data = doc.data();
      return {
        uid: doc.id,
        role: (data.role as string) ?? null,
        email: (data.email as string) ?? "",
        displayName: (data.displayName as string) ?? "",
        department: (data.department as string) ?? "",
        locationId: (data.locationId as string) ?? "",
        active: data.active !== false,
        createdAt: toISO(data.createdAt),
        lastLoginAt: toISO(data.lastLoginAt),
      };
    });
  }),

  updateUser: adminProcedure.input(updateUserSchema).mutation(async ({ ctx, input }) => {
    const userRef = db.doc(`users/${input.uid}`);
    const beforeSnap = await userRef.get();
    const beforeData = beforeSnap.exists ? beforeSnap.data() : {};

    await userRef.update({
      ...input.patch,
      updatedAt: FieldValue.serverTimestamp(),
    });

    writeAuditLog({
      adminUid: ctx.user.uid,
      adminName: ctx.user.name ?? ctx.user.email ?? "",
      action: "update_user",
      targetId: input.uid,
      before: {
        role: beforeData?.role ?? null,
        active: beforeData?.active ?? true,
        locationId: beforeData?.locationId ?? "",
      },
      after: input.patch,
      timestamp: FieldValue.serverTimestamp(),
    });

    return { success: true };
  }),

  bulkAssignRole: adminProcedure.input(bulkAssignRoleSchema).mutation(async ({ ctx, input }) => {
    const results = await Promise.allSettled(
      input.uids.map(async (uid) => {
        const userRef = db.doc(`users/${uid}`);
        await userRef.update({
          role: input.role,
          updatedAt: FieldValue.serverTimestamp(),
        });

        writeAuditLog({
          adminUid: ctx.user.uid,
          adminName: ctx.user.name ?? ctx.user.email ?? "",
          action: "bulk_assign_role",
          targetId: uid,
          before: {},
          after: { role: input.role },
          timestamp: FieldValue.serverTimestamp(),
        });
      }),
    );

    const updated = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return { updated, failed };
  }),

  // -----------------------------------------------------------------------
  // Location CRUD (ADMN-02)
  // -----------------------------------------------------------------------

  listAllLocations: adminProcedure.query(async () => {
    const snap = await db.collection("locations").get();
    return snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: (data.name as string) ?? "",
        fullName: (data.fullName as string) ?? "",
        address: (data.address as string) ?? "",
        active: data.active as boolean,
        printers: (data.printers ?? []) as Array<{
          name: string;
          ip: string;
          model: string;
          isDefault: boolean;
        }>,
        createdAt: toISO(data.createdAt),
      };
    });
  }),

  createLocation: adminProcedure.input(createLocationSchema).mutation(async ({ ctx, input }) => {
    const docRef = await db.collection("locations").add({
      ...input,
      active: true,
      createdAt: FieldValue.serverTimestamp(),
    });

    writeAuditLog({
      adminUid: ctx.user.uid,
      adminName: ctx.user.name ?? ctx.user.email ?? "",
      action: "create_location",
      targetId: docRef.id,
      before: {},
      after: { ...input, active: true },
      timestamp: FieldValue.serverTimestamp(),
    });

    return { id: docRef.id };
  }),

  updateLocation: adminProcedure.input(updateLocationSchema).mutation(async ({ ctx, input }) => {
    const locRef = db.doc(`locations/${input.id}`);
    const beforeSnap = await locRef.get();
    const beforeData = beforeSnap.exists ? beforeSnap.data() : {};

    await locRef.update({
      ...input.patch,
      updatedAt: FieldValue.serverTimestamp(),
    });

    writeAuditLog({
      adminUid: ctx.user.uid,
      adminName: ctx.user.name ?? ctx.user.email ?? "",
      action: "update_location",
      targetId: input.id,
      before: beforeData ?? {},
      after: input.patch,
      timestamp: FieldValue.serverTimestamp(),
    });

    return { success: true };
  }),

  // -----------------------------------------------------------------------
  // Settings (ADMN-03)
  // -----------------------------------------------------------------------

  getSettings: adminProcedure.query(async () => {
    const snap = await db.doc("settings/global").get();
    if (!snap.exists) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...snap.data() };
  }),

  updateSettings: adminProcedure.input(updateSettingsSchema).mutation(async ({ ctx, input }) => {
    const settingsRef = db.doc("settings/global");
    const beforeSnap = await settingsRef.get();
    const beforeData = beforeSnap.exists ? beforeSnap.data() : DEFAULT_SETTINGS;

    await settingsRef.set(input, { merge: true });

    writeAuditLog({
      adminUid: ctx.user.uid,
      adminName: ctx.user.name ?? ctx.user.email ?? "",
      action: "update_settings",
      targetId: "global",
      before: beforeData ?? DEFAULT_SETTINGS,
      after: input,
      timestamp: FieldValue.serverTimestamp(),
    });

    return { success: true };
  }),

  // -----------------------------------------------------------------------
  // Reports (ADMN-04)
  // -----------------------------------------------------------------------

  reportDeliveryTime: adminProcedure.input(reportDateRangeSchema).query(async ({ input }) => {
    const fromTs = Timestamp.fromDate(new Date(input.dateFrom));
    const toTs = Timestamp.fromDate(new Date(input.dateTo));

    const snap = await db
      .collection("shipments")
      .where("createdAt", ">=", fromTs)
      .where("createdAt", "<=", toTs)
      .get();

    const groups = new Map<string, { name: string; totalHours: number; count: number }>();

    for (const doc of snap.docs) {
      const data = doc.data();
      if (!data.deliveredAt) continue;

      const createdMs = (data.createdAt as FirebaseFirestore.Timestamp).toMillis();
      const deliveredMs = (data.deliveredAt as FirebaseFirestore.Timestamp).toMillis();
      const hours = (deliveredMs - createdMs) / (1000 * 60 * 60);

      const locId = data.destination?.locationId ?? "unknown";
      const locName = (data.destination?.name as string) ?? locId;

      const existing = groups.get(locId);
      if (existing) {
        existing.totalHours += hours;
        existing.count += 1;
      } else {
        groups.set(locId, { name: locName, totalHours: hours, count: 1 });
      }
    }

    return Array.from(groups.entries()).map(([locationId, g]) => ({
      locationId,
      name: g.name,
      avgHours: Math.round((g.totalHours / g.count) * 100) / 100,
      count: g.count,
    }));
  }),

  reportVolume: adminProcedure.input(reportDateRangeSchema).query(async ({ input }) => {
    const fromTs = Timestamp.fromDate(new Date(input.dateFrom));
    const toTs = Timestamp.fromDate(new Date(input.dateTo));

    const snap = await db
      .collection("shipments")
      .where("createdAt", ">=", fromTs)
      .where("createdAt", "<=", toTs)
      .get();

    const dailyCounts = new Map<string, number>();

    for (const doc of snap.docs) {
      const data = doc.data();
      const date = (data.createdAt as FirebaseFirestore.Timestamp).toDate();
      const dateStr = date.toISOString().split("T")[0];
      dailyCounts.set(dateStr, (dailyCounts.get(dateStr) ?? 0) + 1);
    }

    return Array.from(dailyCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }),

  reportDriverActivity: adminProcedure.input(reportDateRangeSchema).query(async ({ input }) => {
    const fromTs = Timestamp.fromDate(new Date(input.dateFrom));
    const toTs = Timestamp.fromDate(new Date(input.dateTo));

    const shipmentSnap = await db
      .collection("shipments")
      .where("createdAt", ">=", fromTs)
      .where("createdAt", "<=", toTs)
      .get();

    const driverMap = new Map<
      string,
      { userName: string; totalScans: number; pickups: number; deliveries: number; days: Set<string> }
    >();

    for (const shipDoc of shipmentSnap.docs) {
      const piecesSnap = await db.collection(`shipments/${shipDoc.id}/pieces`).get();

      for (const pieceDoc of piecesSnap.docs) {
        const pieceData = pieceDoc.data();
        const events = (pieceData.events ?? []) as Array<{
          userId: string;
          userName?: string;
          action: string;
          timestamp?: { toDate?: () => Date };
        }>;

        for (const event of events) {
          if (!event.userId) continue;

          const existing = driverMap.get(event.userId);
          const dayStr = event.timestamp?.toDate?.()?.toISOString()?.split("T")[0] ?? "";

          if (existing) {
            existing.totalScans += 1;
            if (event.action === "in_transit") existing.pickups += 1;
            if (event.action === "delivered") existing.deliveries += 1;
            if (dayStr) existing.days.add(dayStr);
          } else {
            const days = new Set<string>();
            if (dayStr) days.add(dayStr);
            driverMap.set(event.userId, {
              userName: event.userName ?? "",
              totalScans: 1,
              pickups: event.action === "in_transit" ? 1 : 0,
              deliveries: event.action === "delivered" ? 1 : 0,
              days,
            });
          }
        }
      }
    }

    return Array.from(driverMap.entries()).map(([userId, d]) => ({
      userId,
      userName: d.userName,
      totalScans: d.totalScans,
      pickups: d.pickups,
      deliveries: d.deliveries,
      avgScansPerDay: d.days.size > 0 ? Math.round((d.totalScans / d.days.size) * 100) / 100 : 0,
    }));
  }),

  // -----------------------------------------------------------------------
  // Audit Log (D-15)
  // -----------------------------------------------------------------------

  listAuditLog: adminProcedure.query(async () => {
    const snap = await db
      .collection("admin_audit_log")
      .orderBy("timestamp", "desc")
      .limit(50)
      .get();

    return snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        adminUid: (data.adminUid as string) ?? "",
        adminName: (data.adminName as string) ?? "",
        action: (data.action as string) ?? "",
        targetId: (data.targetId as string) ?? "",
        before: data.before ?? {},
        after: data.after ?? {},
        timestamp: toISO(data.timestamp),
      };
    });
  }),
});
