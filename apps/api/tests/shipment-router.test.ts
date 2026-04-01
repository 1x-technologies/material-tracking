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
