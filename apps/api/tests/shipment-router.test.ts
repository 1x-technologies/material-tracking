import { initTRPC } from "@trpc/server";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { AuthUser, Context } from "../src/context";

const { mockGet, mockUpdate, mockTransaction } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockUpdate: vi.fn(),
  mockTransaction: { get: vi.fn(), set: vi.fn() },
}));

vi.mock("../src/lib/firebase", () => ({
  auth: { verifyIdToken: vi.fn() },
  db: {
    collection: vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue({ id: "auto-id-123" }),
    }),
    doc: vi.fn().mockReturnValue({
      id: "auto-id-123",
      get: mockGet,
      update: mockUpdate,
    }),
    runTransaction: vi.fn(),
  },
}));

vi.mock("firebase-admin/firestore", () => ({
  FieldValue: {
    serverTimestamp: vi.fn(() => "SERVER_TIMESTAMP"),
  },
  FieldPath: {
    documentId: vi.fn(() => "__name__"),
  },
  Timestamp: {
    fromDate: vi.fn((d: Date) => ({
      toDate: () => d,
      toMillis: () => d.getTime(),
      _seconds: Math.floor(d.getTime() / 1000),
    })),
  },
}));

import { db } from "../src/lib/firebase";
import { shipmentRouter } from "../src/routers/shipment";
import { directoryRouter } from "../src/routers/directory";

const t = initTRPC.context<Context>().create();

const shipmentCaller = t.createCallerFactory(
  t.router({ shipment: shipmentRouter }),
);

const directoryCaller = t.createCallerFactory(
  t.router({ directory: directoryRouter }),
);

function staffCtx(): Context {
  return {
    user: {
      uid: "staff-1",
      email: "staff@1x.tech",
      name: "Staff User",
      role: "staff",
      locationId: "HA",
    } satisfies AuthUser,
  };
}

function driverCtx(): Context {
  return {
    user: {
      uid: "driver-1",
      email: "driver@1x.tech",
      name: "Driver User",
      role: "driver",
      locationId: "SC",
    } satisfies AuthUser,
  };
}

const validCreateInput = {
  description: "Test shipment",
  category: "documents" as const,
  priority: "standard" as const,
  sender: { uid: "s1", name: "Sender", email: "sender@1x.tech" },
  receiver: { isExternal: false as const, uid: "r1", name: "Receiver" },
  originId: "HA",
  destinationId: "SC",
  pieceCount: 2,
};

describe("shipment.create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("runs a transaction that increments counter and writes shipment", async () => {
    const mockDb = vi.mocked(db);
    mockDb.runTransaction.mockImplementation(async (fn) => {
      mockTransaction.get.mockImplementation((ref: { id?: string; path?: string }) => {
        const path = ref.path ?? ref.id ?? "";
        if (path.includes("counters")) {
          return Promise.resolve({ exists: false, data: () => undefined });
        }
        if (path.includes("HA") || path.includes("SC")) {
          const name = path.includes("HA") ? "HA" : "SC";
          return Promise.resolve({
            exists: true,
            id: name,
            data: () => ({ name, fullName: name === "HA" ? "Hayward" : "San Carlos", active: true }),
          });
        }
        return Promise.resolve({ exists: false, data: () => undefined });
      });

      return fn(mockTransaction as any);
    });

    mockDb.doc.mockImplementation((path: string) => {
      return { id: path.split("/").pop(), path, get: mockGet } as any;
    });
    mockDb.collection.mockImplementation((path: string) => {
      return {
        doc: vi.fn().mockReturnValue({ id: `piece-${path}`, path }),
      } as any;
    });

    const result = await shipmentCaller(staffCtx()).shipment.create(validCreateInput);

    expect(result).toHaveProperty("shipmentId");
    expect(result).toHaveProperty("shipmentNumber");
    expect(result.shipmentNumber).toMatch(/^SH-\d{8}-\d{4}$/);

    expect(mockTransaction.set).toHaveBeenCalled();
    const setCalls = mockTransaction.set.mock.calls;
    const shipmentSetCall = setCalls.find(
      (call) => call[1]?.status === "created",
    );
    expect(shipmentSetCall).toBeDefined();
    expect(shipmentSetCall![1].status).toBe("created");
    expect(shipmentSetCall![1].pieceCount).toBe(2);

    const pieceCalls = setCalls.filter((call) => call[1]?.pieceNumber != null);
    expect(pieceCalls).toHaveLength(2);
    for (const call of pieceCalls) {
      expect(call[1].qrCode).not.toContain("pending:");
      expect(call[1].qrCode).toBe(call[0].id);
    }
  });

  it("rejects drivers from creating shipments", async () => {
    await expect(
      shipmentCaller(driverCtx()).shipment.create(validCreateInput),
    ).rejects.toThrow(expect.objectContaining({ code: "FORBIDDEN" }));
  });

  it("rejects unauthenticated calls", async () => {
    await expect(
      shipmentCaller({ user: null }).shipment.create(validCreateInput),
    ).rejects.toThrow(expect.objectContaining({ code: "UNAUTHORIZED" }));
  });
});

describe("shipment.getById", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const mockDb = vi.mocked(db);
    mockDb.doc.mockReturnValue({ id: "auto-id-123", get: mockGet, update: mockUpdate } as any);
  });

  it("returns shipment data when found", async () => {
    mockGet.mockResolvedValue({
      exists: true,
      id: "ship-1",
      data: () => ({ shipmentNumber: "SH-20260401-0001", status: "created" }),
    });

    const result = await shipmentCaller(staffCtx()).shipment.getById({ shipmentId: "ship-1" });
    expect(result).toMatchObject({ shipmentNumber: "SH-20260401-0001" });
  });

  it("throws NOT_FOUND for missing shipment", async () => {
    mockGet.mockResolvedValue({ exists: false, data: () => undefined });
    await expect(
      shipmentCaller(staffCtx()).shipment.getById({ shipmentId: "missing" }),
    ).rejects.toThrow(expect.objectContaining({ code: "NOT_FOUND" }));
  });
});

describe("shipment.cancel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const mockDb = vi.mocked(db);
    mockDb.doc.mockReturnValue({ id: "auto-id-123", get: mockGet, update: mockUpdate } as any);
  });

  it("cancels a shipment with created status", async () => {
    mockGet.mockResolvedValue({
      exists: true,
      id: "ship-1",
      data: () => ({ status: "created" }),
    });

    const result = await shipmentCaller(staffCtx()).shipment.cancel({ shipmentId: "ship-1" });
    expect(result).toEqual({ success: true });
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "cancelled" }),
    );
  });

  it("rejects cancel when status is not created", async () => {
    mockGet.mockResolvedValue({
      exists: true,
      id: "ship-1",
      data: () => ({ status: "in_transit" }),
    });

    await expect(
      shipmentCaller(staffCtx()).shipment.cancel({ shipmentId: "ship-1" }),
    ).rejects.toThrow("SHIPMENT_NOT_CANCELLABLE");
  });
});

describe("shipment.listPieces", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const mockDb = vi.mocked(db);
    mockDb.doc.mockReturnValue({
      id: "auto-id-123",
      get: mockGet,
      update: mockUpdate,
    } as any);
  });

  it("returns ordered pieces for an existing shipment", async () => {
    mockGet.mockResolvedValue({
      exists: true,
      id: "ship-1",
      data: () => ({ shipmentNumber: "SH-20260401-0001", status: "created" }),
    });

    const mockPieceDocs = [
      { id: "piece-a", data: () => ({ pieceNumber: 1, qrCode: "piece-a", status: "created" }) },
      { id: "piece-b", data: () => ({ pieceNumber: 2, qrCode: "piece-b", status: "created" }) },
    ];

    const mockDb = vi.mocked(db);
    mockDb.collection.mockReturnValue({
      orderBy: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({ docs: mockPieceDocs }),
      }),
    } as any);

    const result = await shipmentCaller(staffCtx()).shipment.listPieces({
      shipmentId: "ship-1",
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: "piece-a", pieceNumber: 1, qrCode: "piece-a" });
    expect(result[1]).toMatchObject({ id: "piece-b", pieceNumber: 2, qrCode: "piece-b" });
  });

  it("throws NOT_FOUND for missing shipment", async () => {
    mockGet.mockResolvedValue({ exists: false, data: () => undefined });

    await expect(
      shipmentCaller(staffCtx()).shipment.listPieces({ shipmentId: "missing" }),
    ).rejects.toThrow(expect.objectContaining({ code: "NOT_FOUND" }));
  });

  it("allows drivers to list pieces", async () => {
    mockGet.mockResolvedValue({
      exists: true,
      id: "ship-1",
      data: () => ({ shipmentNumber: "SH-20260401-0001", status: "created" }),
    });

    const mockPieceDocs = [
      { id: "piece-x", data: () => ({ pieceNumber: 1, qrCode: "piece-x", status: "created" }) },
    ];

    const mockDb = vi.mocked(db);
    mockDb.collection.mockReturnValue({
      orderBy: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({ docs: mockPieceDocs }),
      }),
    } as any);

    const result = await shipmentCaller(driverCtx()).shipment.listPieces({
      shipmentId: "ship-1",
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: "piece-x", pieceNumber: 1, qrCode: "piece-x" });
  });
});

describe("shipment.search", () => {
  const mockWhere = vi.fn();
  const mockOrderBy = vi.fn();
  const mockLimit = vi.fn();
  const mockStartAfter = vi.fn();
  const mockQueryGet = vi.fn();

  function setupQueryChain() {
    const chain = {
      where: mockWhere,
      orderBy: mockOrderBy,
      limit: mockLimit,
      startAfter: mockStartAfter,
      get: mockQueryGet,
    };
    // Each method returns the chain for fluent API
    mockWhere.mockReturnValue(chain);
    mockOrderBy.mockReturnValue(chain);
    mockLimit.mockReturnValue(chain);
    mockStartAfter.mockReturnValue(chain);
    return chain;
  }

  function makeDoc(id: string, data: Record<string, unknown>) {
    return {
      id,
      data: () => data,
    };
  }

  function makeTimestamp(iso: string) {
    return {
      toDate: () => new Date(iso),
      toMillis: () => new Date(iso).getTime(),
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    const chain = setupQueryChain();
    const mockDb = vi.mocked(db);
    mockDb.collection.mockReturnValue(chain as any);
  });

  it("returns items with hasMore=false when fewer than 51 docs", async () => {
    const docs = [
      makeDoc("s1", { shipmentNumber: "SH-20260401-0001", status: "created", createdAt: makeTimestamp("2026-04-01T10:00:00Z") }),
      makeDoc("s2", { shipmentNumber: "SH-20260401-0002", status: "in_transit", createdAt: makeTimestamp("2026-04-01T09:00:00Z") }),
    ];
    mockQueryGet.mockResolvedValue({ docs });

    const result = await shipmentCaller(staffCtx()).shipment.search({});

    expect(result.items).toHaveLength(2);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
    expect(mockLimit).toHaveBeenCalledWith(51);
  });

  it("returns hasMore=true and nextCursor when 51 docs returned", async () => {
    const docs = Array.from({ length: 51 }, (_, i) =>
      makeDoc(`s${i}`, {
        shipmentNumber: `SH-20260401-${String(i).padStart(4, "0")}`,
        status: "created",
        createdAt: makeTimestamp(`2026-04-01T${String(10 - Math.floor(i / 6)).padStart(2, "0")}:${String(i % 60).padStart(2, "0")}:00Z`),
      }),
    );
    mockQueryGet.mockResolvedValue({ docs });

    const result = await shipmentCaller(staffCtx()).shipment.search({});

    expect(result.items).toHaveLength(50);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).not.toBeNull();
    expect(result.nextCursor).toHaveProperty("createdAt");
    expect(result.nextCursor).toHaveProperty("id");
  });

  it("applies status filter via where clause", async () => {
    mockQueryGet.mockResolvedValue({ docs: [] });

    await shipmentCaller(staffCtx()).shipment.search({ status: "delivered" });

    expect(mockWhere).toHaveBeenCalledWith("status", "==", "delivered");
  });

  it("applies date range filters", async () => {
    mockQueryGet.mockResolvedValue({ docs: [] });

    await shipmentCaller(staffCtx()).shipment.search({
      dateFrom: "2026-03-01T00:00:00.000Z",
      dateTo: "2026-03-31T23:59:59.999Z",
    });

    expect(mockWhere).toHaveBeenCalledTimes(2);
    expect(mockWhere).toHaveBeenCalledWith("createdAt", ">=", expect.anything());
    expect(mockWhere).toHaveBeenCalledWith("createdAt", "<=", expect.anything());
  });

  it("applies cursor via startAfter", async () => {
    mockQueryGet.mockResolvedValue({ docs: [] });

    await shipmentCaller(staffCtx()).shipment.search({
      cursor: {
        createdAt: "2026-04-01T08:00:00.000Z",
        id: "last-doc-id",
      },
    });

    expect(mockStartAfter).toHaveBeenCalledWith(expect.anything(), "last-doc-id");
  });

  it("rejects unauthenticated calls", async () => {
    await expect(
      shipmentCaller({ user: null }).shipment.search({}),
    ).rejects.toThrow(expect.objectContaining({ code: "UNAUTHORIZED" }));
  });

  it("rejects drivers (staff-only procedure)", async () => {
    await expect(
      shipmentCaller(driverCtx()).shipment.search({}),
    ).rejects.toThrow(expect.objectContaining({ code: "FORBIDDEN" }));
  });

  it("returns empty result for no matching documents", async () => {
    mockQueryGet.mockResolvedValue({ docs: [] });

    const result = await shipmentCaller(staffCtx()).shipment.search({
      status: "completed",
    });

    expect(result.items).toHaveLength(0);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });

  it("returns exactly 50 items when exactly 50 docs returned", async () => {
    const docs = Array.from({ length: 50 }, (_, i) =>
      makeDoc(`s${i}`, {
        shipmentNumber: `SH-20260401-${String(i).padStart(4, "0")}`,
        status: "created",
        createdAt: makeTimestamp("2026-04-01T10:00:00Z"),
      }),
    );
    mockQueryGet.mockResolvedValue({ docs });

    const result = await shipmentCaller(staffCtx()).shipment.search({});

    expect(result.items).toHaveLength(50);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });

  it("combines status and date range filters with AND semantics", async () => {
    mockQueryGet.mockResolvedValue({ docs: [] });

    await shipmentCaller(staffCtx()).shipment.search({
      status: "in_transit",
      dateFrom: "2026-03-15T00:00:00.000Z",
      dateTo: "2026-03-20T23:59:59.999Z",
    });

    // Status filter + two date range filters = 3 where calls
    expect(mockWhere).toHaveBeenCalledTimes(3);
    expect(mockWhere).toHaveBeenCalledWith("status", "==", "in_transit");
    expect(mockWhere).toHaveBeenCalledWith("createdAt", ">=", expect.anything());
    expect(mockWhere).toHaveBeenCalledWith("createdAt", "<=", expect.anything());
  });

  it("nextCursor contains last item createdAt and id for page 2", async () => {
    const lastTs = "2026-04-01T05:30:00.000Z";
    const docs = Array.from({ length: 51 }, (_, i) => {
      const ts = i < 50 ? `2026-04-01T${String(10 - Math.floor(i / 6)).padStart(2, "0")}:00:00Z` : lastTs;
      return makeDoc(`doc-${i}`, {
        status: "created",
        createdAt: makeTimestamp(i === 49 ? lastTs : ts),
      });
    });
    mockQueryGet.mockResolvedValue({ docs });

    const result = await shipmentCaller(staffCtx()).shipment.search({});

    expect(result.nextCursor).toEqual({
      createdAt: new Date(lastTs).toISOString(),
      id: "doc-49",
    });
  });

  it("passes cursor values into startAfter for second page", async () => {
    mockQueryGet.mockResolvedValue({ docs: [] });

    const cursor = {
      createdAt: "2026-04-01T05:30:00.000Z",
      id: "doc-49",
    };
    await shipmentCaller(staffCtx()).shipment.search({ cursor });

    expect(mockStartAfter).toHaveBeenCalledTimes(1);
    // First arg is a Timestamp mock, second is the document ID
    const [tsArg, idArg] = mockStartAfter.mock.calls[0];
    expect(tsArg).toHaveProperty("_seconds");
    expect(idArg).toBe("doc-49");
  });

  it("does not call startAfter when no cursor provided", async () => {
    mockQueryGet.mockResolvedValue({ docs: [] });

    await shipmentCaller(staffCtx()).shipment.search({});

    expect(mockStartAfter).not.toHaveBeenCalled();
  });

  it("does not call where when no status or dates provided", async () => {
    mockQueryGet.mockResolvedValue({ docs: [] });

    await shipmentCaller(staffCtx()).shipment.search({});

    expect(mockWhere).not.toHaveBeenCalled();
  });

  it("orders by createdAt desc then documentId desc", async () => {
    mockQueryGet.mockResolvedValue({ docs: [] });

    await shipmentCaller(staffCtx()).shipment.search({});

    expect(mockOrderBy).toHaveBeenCalledTimes(2);
    expect(mockOrderBy).toHaveBeenCalledWith("createdAt", "desc");
    expect(mockOrderBy).toHaveBeenCalledWith("__name__", "desc");
  });
});

describe("directory.search", () => {
  it("returns filtered stub users when DIRECTORY_STUB=1", async () => {
    const original = process.env.DIRECTORY_STUB;
    process.env.DIRECTORY_STUB = "1";

    try {
      const result = await directoryCaller(staffCtx()).directory.search({ query: "ada" });
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ uid: "stub-user-1", name: "Ada Lovelace" });
    } finally {
      if (original === undefined) {
        delete process.env.DIRECTORY_STUB;
      } else {
        process.env.DIRECTORY_STUB = original;
      }
    }
  });

  it("throws PRECONDITION_FAILED when DIRECTORY_STUB is not set", async () => {
    const original = process.env.DIRECTORY_STUB;
    delete process.env.DIRECTORY_STUB;

    try {
      await expect(
        directoryCaller(staffCtx()).directory.search({ query: "test" }),
      ).rejects.toThrow("DIRECTORY_NOT_CONFIGURED");
    } finally {
      if (original !== undefined) {
        process.env.DIRECTORY_STUB = original;
      }
    }
  });
});
