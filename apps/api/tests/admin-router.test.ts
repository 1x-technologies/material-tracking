import { initTRPC } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthUser, Context } from "../src/context";

// ---------------------------------------------------------------------------
// Hoisted mocks -- these are the leaf-level mocks that tests configure
// ---------------------------------------------------------------------------

const {
  mockGet,
  mockUpdate,
  mockSet,
  mockAdd,
  mockDocGet,
  mockCollectionGet,
} = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockUpdate: vi.fn(),
  mockSet: vi.fn(),
  mockAdd: vi.fn(),
  mockDocGet: vi.fn(),
  mockCollectionGet: vi.fn(),
}));

vi.mock("../src/lib/firebase", () => {
  const docChain = {
    get: (...args: unknown[]) => mockDocGet(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    set: (...args: unknown[]) => mockSet(...args),
  };

  // Self-referencing query chain -- uses passthrough wrappers so clearAllMocks
  // does not break the chain structure
  const queryChain: Record<string, unknown> = {};
  queryChain.where = (..._args: unknown[]) => queryChain;
  queryChain.orderBy = (..._args: unknown[]) => queryChain;
  queryChain.limit = (..._args: unknown[]) => queryChain;
  queryChain.get = (...args: unknown[]) => mockCollectionGet(...args);

  return {
    auth: { verifyIdToken: vi.fn() },
    db: {
      collection: () => ({
        get: (...args: unknown[]) => mockGet(...args),
        add: (...args: unknown[]) => mockAdd(...args),
        where: queryChain.where as (...args: unknown[]) => typeof queryChain,
        orderBy: queryChain.orderBy as (...args: unknown[]) => typeof queryChain,
        limit: queryChain.limit as (...args: unknown[]) => typeof queryChain,
        doc: () => docChain,
      }),
      doc: () => docChain,
    },
  };
});

vi.mock("firebase-admin/firestore", () => ({
  FieldValue: {
    serverTimestamp: vi.fn(() => "SERVER_TIMESTAMP"),
  },
  Timestamp: {
    fromDate: vi.fn((d: Date) => ({
      toDate: () => d,
      toMillis: () => d.getTime(),
    })),
  },
}));

import { adminRouter } from "../src/routers/admin";

const t = initTRPC.context<Context>().create();
const caller = t.createCallerFactory(t.router({ admin: adminRouter }));

// ---------------------------------------------------------------------------
// Context factories
// ---------------------------------------------------------------------------

function adminCtx(): Context {
  return {
    user: {
      uid: "admin1",
      email: "admin@1x.tech",
      name: "Admin User",
      role: "admin",
      locationId: "HA",
    } satisfies AuthUser,
  };
}

function staffCtx(): Context {
  return {
    user: {
      uid: "staff1",
      email: "staff@1x.tech",
      name: "Staff User",
      role: "staff",
      locationId: "HA",
    } satisfies AuthUser,
  };
}

function pendingCtx(): Context {
  return {
    user: {
      uid: "pending1",
      email: "pending@1x.tech",
      name: "Pending User",
      role: null,
      locationId: "",
    } satisfies AuthUser,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFirestoreDoc(id: string, data: Record<string, unknown>) {
  return {
    id,
    exists: true,
    data: () => data,
  };
}

function makeTimestamp(iso: string) {
  const d = new Date(iso);
  return {
    toDate: () => d,
    toMillis: () => d.getTime(),
  };
}

function resetMocks() {
  mockGet.mockReset();
  mockUpdate.mockReset();
  mockSet.mockReset();
  mockAdd.mockReset();
  mockDocGet.mockReset();
  mockCollectionGet.mockReset();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("admin router - user management", () => {
  beforeEach(resetMocks);

  it("listUsers returns all user docs with uid, role, email, displayName, active, createdAt", async () => {
    mockGet.mockResolvedValue({
      docs: [
        mockFirestoreDoc("u1", {
          role: "admin",
          email: "admin@1x.tech",
          displayName: "Admin",
          department: "IT",
          locationId: "HA",
          active: true,
          createdAt: makeTimestamp("2026-01-01T00:00:00Z"),
          lastLoginAt: makeTimestamp("2026-03-01T00:00:00Z"),
        }),
        mockFirestoreDoc("u2", {
          role: null,
          email: "pending@1x.tech",
          displayName: "Pending",
          department: "",
          locationId: "",
          createdAt: makeTimestamp("2026-02-01T00:00:00Z"),
          lastLoginAt: makeTimestamp("2026-02-01T00:00:00Z"),
        }),
      ],
    });

    const result = await caller(adminCtx()).admin.listUsers();
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      uid: "u1",
      role: "admin",
      email: "admin@1x.tech",
      displayName: "Admin",
      active: true,
    });
    expect(result[0].createdAt).toBe("2026-01-01T00:00:00.000Z");
    expect(result[1]).toMatchObject({
      uid: "u2",
      role: null,
      email: "pending@1x.tech",
      active: true,
    });
  });

  it("updateUser calls db.doc().update with patch and writes audit log", async () => {
    mockDocGet.mockResolvedValue({
      exists: true,
      data: () => ({ role: "staff", active: true, locationId: "HA" }),
    });
    mockUpdate.mockResolvedValue(undefined);
    mockAdd.mockResolvedValue({ id: "audit1" });

    const result = await caller(adminCtx()).admin.updateUser({
      uid: "u1",
      patch: { role: "admin", active: true },
    });

    expect(result).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "admin",
        active: true,
        updatedAt: "SERVER_TIMESTAMP",
      }),
    );
    // Audit log is fire-and-forget, but add should have been called
    expect(mockAdd).toHaveBeenCalled();
  });

  it("bulkAssignRole updates multiple users and returns counts", async () => {
    mockUpdate.mockResolvedValue(undefined);
    mockAdd.mockResolvedValue({ id: "audit1" });

    const result = await caller(adminCtx()).admin.bulkAssignRole({
      uids: ["u1", "u2", "u3"],
      role: "driver",
    });

    expect(result).toEqual({ updated: 3, failed: 0 });
  });

  it("bulkAssignRole reports failures correctly", async () => {
    mockUpdate
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("not found"))
      .mockResolvedValueOnce(undefined);
    mockAdd.mockResolvedValue({ id: "audit1" });

    const result = await caller(adminCtx()).admin.bulkAssignRole({
      uids: ["u1", "u2", "u3"],
      role: "staff",
    });

    expect(result).toEqual({ updated: 2, failed: 1 });
  });
});

describe("admin router - location management", () => {
  beforeEach(resetMocks);

  it("listAllLocations returns all locations including inactive", async () => {
    mockGet.mockResolvedValue({
      docs: [
        mockFirestoreDoc("HA", {
          name: "HA",
          fullName: "Hayward",
          address: "Hayward, CA",
          active: true,
          printers: [],
          createdAt: makeTimestamp("2026-01-01T00:00:00Z"),
        }),
        mockFirestoreDoc("SC", {
          name: "SC",
          fullName: "San Carlos",
          address: "San Carlos, CA",
          active: false,
          printers: [],
          createdAt: makeTimestamp("2026-01-01T00:00:00Z"),
        }),
      ],
    });

    const result = await caller(adminCtx()).admin.listAllLocations();
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: "HA", name: "HA", active: true });
    expect(result[1]).toMatchObject({ id: "SC", name: "SC", active: false });
  });

  it("createLocation adds doc to locations collection with active: true", async () => {
    mockAdd.mockResolvedValue({ id: "new-loc" });

    const result = await caller(adminCtx()).admin.createLocation({
      name: "NY",
      fullName: "New York",
      address: "New York, NY",
      printers: [],
    });

    expect(result).toEqual({ id: "new-loc" });
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "NY",
        fullName: "New York",
        active: true,
        createdAt: "SERVER_TIMESTAMP",
      }),
    );
  });

  it("updateLocation changes fields on target location doc", async () => {
    mockDocGet.mockResolvedValue({
      exists: true,
      data: () => ({ name: "HA", fullName: "Hayward", active: true }),
    });
    mockUpdate.mockResolvedValue(undefined);
    mockAdd.mockResolvedValue({ id: "audit1" });

    const result = await caller(adminCtx()).admin.updateLocation({
      id: "HA",
      patch: { fullName: "Hayward Updated", active: false },
    });

    expect(result).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: "Hayward Updated",
        active: false,
        updatedAt: "SERVER_TIMESTAMP",
      }),
    );
  });
});

describe("admin router - settings", () => {
  beforeEach(resetMocks);

  it("getSettings returns defaults when settings/global doc does not exist", async () => {
    mockDocGet.mockResolvedValue({ exists: false, data: () => undefined });

    const result = await caller(adminCtx()).admin.getSettings();
    expect(result).toEqual({
      stalledThresholdHours: 4,
      overdueThresholdHours: 24,
      agedThresholdHours: 24,
      defaultNotificationPrefs: {
        onDelivery: true,
        onPickup: true,
        onTransit: false,
      },
    });
  });

  it("getSettings merges stored values with defaults", async () => {
    mockDocGet.mockResolvedValue({
      exists: true,
      data: () => ({ stalledThresholdHours: 8 }),
    });

    const result = await caller(adminCtx()).admin.getSettings();
    expect(result.stalledThresholdHours).toBe(8);
    expect(result.overdueThresholdHours).toBe(24);
  });

  it("updateSettings writes to settings/global doc with merge", async () => {
    mockDocGet.mockResolvedValue({ exists: false, data: () => undefined });
    mockSet.mockResolvedValue(undefined);
    mockAdd.mockResolvedValue({ id: "audit1" });

    const result = await caller(adminCtx()).admin.updateSettings({
      stalledThresholdHours: 6,
    });

    expect(result).toEqual({ success: true });
    expect(mockSet).toHaveBeenCalledWith({ stalledThresholdHours: 6 }, { merge: true });
  });
});

describe("admin router - reports", () => {
  beforeEach(resetMocks);

  it("reportDeliveryTime returns avgHours grouped by destination location", async () => {
    mockCollectionGet.mockResolvedValue({
      docs: [
        mockFirestoreDoc("s1", {
          createdAt: makeTimestamp("2026-03-01T08:00:00Z"),
          deliveredAt: makeTimestamp("2026-03-01T12:00:00Z"),
          destination: { locationId: "SC", name: "San Carlos" },
        }),
        mockFirestoreDoc("s2", {
          createdAt: makeTimestamp("2026-03-01T09:00:00Z"),
          deliveredAt: makeTimestamp("2026-03-01T15:00:00Z"),
          destination: { locationId: "SC", name: "San Carlos" },
        }),
        mockFirestoreDoc("s3", {
          createdAt: makeTimestamp("2026-03-01T10:00:00Z"),
          deliveredAt: null, // not delivered
          destination: { locationId: "HA", name: "Hayward" },
        }),
      ],
    });

    const result = await caller(adminCtx()).admin.reportDeliveryTime({
      dateFrom: "2026-03-01T00:00:00Z",
      dateTo: "2026-03-31T23:59:59Z",
    });

    expect(result).toHaveLength(1);
    expect(result[0].locationId).toBe("SC");
    expect(result[0].name).toBe("San Carlos");
    // s1: 4 hours, s2: 6 hours, avg = 5
    expect(result[0].avgHours).toBe(5);
    expect(result[0].count).toBe(2);
  });

  it("reportVolume returns daily counts sorted by date", async () => {
    mockCollectionGet.mockResolvedValue({
      docs: [
        mockFirestoreDoc("s1", { createdAt: makeTimestamp("2026-03-01T08:00:00Z") }),
        mockFirestoreDoc("s2", { createdAt: makeTimestamp("2026-03-01T14:00:00Z") }),
        mockFirestoreDoc("s3", { createdAt: makeTimestamp("2026-03-02T09:00:00Z") }),
      ],
    });

    const result = await caller(adminCtx()).admin.reportVolume({
      dateFrom: "2026-03-01T00:00:00Z",
      dateTo: "2026-03-31T23:59:59Z",
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ date: "2026-03-01", count: 2 });
    expect(result[1]).toEqual({ date: "2026-03-02", count: 1 });
  });

  it("reportDriverActivity returns per-driver scan totals", async () => {
    // Mock db.collection("shipments").where().where().get()
    mockCollectionGet.mockResolvedValue({
      docs: [mockFirestoreDoc("s1", {})],
    });

    // Mock db.collection("shipments/s1/pieces").get()
    mockGet.mockResolvedValue({
      docs: [
        mockFirestoreDoc("p1", {
          events: [
            {
              userId: "driver1",
              userName: "Driver One",
              action: "in_transit",
              timestamp: makeTimestamp("2026-03-01T10:00:00Z"),
            },
            {
              userId: "driver1",
              userName: "Driver One",
              action: "delivered",
              timestamp: makeTimestamp("2026-03-01T14:00:00Z"),
            },
            {
              userId: "driver2",
              userName: "Driver Two",
              action: "in_transit",
              timestamp: makeTimestamp("2026-03-01T11:00:00Z"),
            },
          ],
        }),
      ],
    });

    const result = await caller(adminCtx()).admin.reportDriverActivity({
      dateFrom: "2026-03-01T00:00:00Z",
      dateTo: "2026-03-31T23:59:59Z",
    });

    expect(result).toHaveLength(2);
    const d1 = result.find((r) => r.userId === "driver1");
    expect(d1).toBeDefined();
    expect(d1!.totalScans).toBe(2);
    expect(d1!.pickups).toBe(1);
    expect(d1!.deliveries).toBe(1);
    expect(d1!.userName).toBe("Driver One");

    const d2 = result.find((r) => r.userId === "driver2");
    expect(d2).toBeDefined();
    expect(d2!.totalScans).toBe(1);
    expect(d2!.pickups).toBe(1);
    expect(d2!.deliveries).toBe(0);
  });
});

describe("admin router - audit log", () => {
  beforeEach(resetMocks);

  it("listAuditLog returns recent entries ordered by timestamp desc", async () => {
    mockCollectionGet.mockResolvedValue({
      docs: [
        mockFirestoreDoc("a1", {
          adminUid: "admin1",
          adminName: "Admin User",
          action: "update_user",
          targetId: "u1",
          before: { role: "staff" },
          after: { role: "admin" },
          timestamp: makeTimestamp("2026-03-15T10:00:00Z"),
        }),
      ],
    });

    const result = await caller(adminCtx()).admin.listAuditLog();
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "a1",
      adminUid: "admin1",
      action: "update_user",
      targetId: "u1",
    });
    expect(result[0].timestamp).toBe("2026-03-15T10:00:00.000Z");
  });
});

describe("admin router - authorization", () => {
  beforeEach(resetMocks);

  it("rejects staff user from listUsers with FORBIDDEN", async () => {
    await expect(caller(staffCtx()).admin.listUsers()).rejects.toThrow(
      expect.objectContaining({ code: "FORBIDDEN" }),
    );
  });

  it("rejects staff user from updateUser with FORBIDDEN", async () => {
    await expect(
      caller(staffCtx()).admin.updateUser({ uid: "u1", patch: { role: "admin" } }),
    ).rejects.toThrow(expect.objectContaining({ code: "FORBIDDEN" }));
  });

  it("rejects staff user from bulkAssignRole with FORBIDDEN", async () => {
    await expect(
      caller(staffCtx()).admin.bulkAssignRole({ uids: ["u1"], role: "admin" }),
    ).rejects.toThrow(expect.objectContaining({ code: "FORBIDDEN" }));
  });

  it("rejects staff user from createLocation with FORBIDDEN", async () => {
    await expect(
      caller(staffCtx()).admin.createLocation({
        name: "X",
        fullName: "Test",
        address: "Test",
      }),
    ).rejects.toThrow(expect.objectContaining({ code: "FORBIDDEN" }));
  });

  it("rejects staff user from getSettings with FORBIDDEN", async () => {
    await expect(caller(staffCtx()).admin.getSettings()).rejects.toThrow(
      expect.objectContaining({ code: "FORBIDDEN" }),
    );
  });

  it("rejects pending user (null role) from listUsers with FORBIDDEN", async () => {
    await expect(caller(pendingCtx()).admin.listUsers()).rejects.toThrow(
      expect.objectContaining({ code: "FORBIDDEN" }),
    );
  });

  it("rejects unauthenticated user from listUsers with UNAUTHORIZED", async () => {
    await expect(caller({ user: null }).admin.listUsers()).rejects.toThrow(
      expect.objectContaining({ code: "UNAUTHORIZED" }),
    );
  });
});
