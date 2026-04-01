import { initTRPC } from "@trpc/server";
import { describe, expect, it, vi, beforeEach } from "vitest";
import type { AuthUser, Context } from "../src/context";

const { mockCollectionGroup, mockRunTransaction, mockTransaction, mockProcessOneScan } = vi.hoisted(() => ({
  mockCollectionGroup: vi.fn(),
  mockRunTransaction: vi.fn(),
  mockTransaction: { get: vi.fn(), update: vi.fn() },
  mockProcessOneScan: vi.fn(),
}));

vi.mock("../src/lib/firebase", () => ({
  auth: { verifyIdToken: vi.fn() },
  db: {
    collectionGroup: mockCollectionGroup,
    runTransaction: mockRunTransaction,
    collection: vi.fn(),
    doc: vi.fn(),
  },
}));

vi.mock("firebase-admin/firestore", () => ({
  FieldValue: {
    serverTimestamp: vi.fn(() => "SERVER_TIMESTAMP"),
    arrayUnion: vi.fn((...args: unknown[]) => ({ _arrayUnion: args })),
  },
  Timestamp: {
    now: vi.fn(() => ({ seconds: 1000, nanoseconds: 0 })),
  },
}));

vi.mock("../src/lib/scan-process", () => ({
  processOneScan: (...args: unknown[]) => mockProcessOneScan(...args),
}));

import { scanRouter } from "../src/routers/scan";

const t = initTRPC.context<Context>().create();
const scanCaller = t.createCallerFactory(t.router({ scan: scanRouter }));

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


describe("scan.process", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("advances piece status on valid transition", async () => {
    mockProcessOneScan.mockResolvedValue({
      pieceId: "piece-1",
      shipmentId: "ship-1",
      newStatus: "in_transit",
      shipmentNumber: "SH-20260401-0001",
      pieceNumber: 1,
    });

    const result = await scanCaller(driverCtx()).scan.process({
      qrCode: "piece-1",
      action: "in_transit",
    });

    expect(result.newStatus).toBe("in_transit");
    expect(result.pieceId).toBe("piece-1");
    expect(result.shipmentNumber).toBe("SH-20260401-0001");
    expect(mockProcessOneScan).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ uid: "driver-1" }),
      expect.objectContaining({ qrCode: "piece-1", action: "in_transit" }),
    );
  });

  it("writes deliverySignatureUrl when delivered with signature", async () => {
    mockProcessOneScan.mockResolvedValue({
      pieceId: "piece-2",
      shipmentId: "ship-1",
      newStatus: "delivered",
      shipmentNumber: "SH-20260401-0002",
      pieceNumber: 1,
    });

    await scanCaller(driverCtx()).scan.process({
      qrCode: "piece-2",
      action: "delivered",
      signatureUrl: "https://storage.example.com/sig.png",
    });

    expect(mockProcessOneScan).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        action: "delivered",
        signatureUrl: "https://storage.example.com/sig.png",
      }),
    );
  });

  it("writes photoUrls via arrayUnion", async () => {
    mockProcessOneScan.mockResolvedValue({
      pieceId: "piece-3",
      shipmentId: "ship-1",
      newStatus: "in_transit",
      shipmentNumber: "SH-20260401-0003",
      pieceNumber: 1,
    });

    await scanCaller(driverCtx()).scan.process({
      qrCode: "piece-3",
      action: "in_transit",
      photoUrls: ["https://example.com/photo.jpg"],
    });

    expect(mockProcessOneScan).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({
        photoUrls: ["https://example.com/photo.jpg"],
      }),
    );
  });

  it("rejects UNKNOWN_QR for empty collectionGroup result", async () => {
    const { TRPCError } = await import("@trpc/server");
    mockProcessOneScan.mockRejectedValue(
      new TRPCError({ code: "NOT_FOUND", message: "UNKNOWN_QR" }),
    );

    await expect(
      scanCaller(driverCtx()).scan.process({
        qrCode: "nonexistent",
        action: "in_transit",
      }),
    ).rejects.toThrow(expect.objectContaining({ code: "NOT_FOUND" }));
  });
});

describe("scan.processBatch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns per-index results on mixed success", async () => {
    mockProcessOneScan
      .mockResolvedValueOnce({
        pieceId: "piece-1", shipmentId: "ship-1", newStatus: "in_transit",
        shipmentNumber: "SH-20260401-0001", pieceNumber: 1,
      })
      .mockRejectedValueOnce(new Error("ALREADY_AT_STATUS: piece is already delivered"))
      .mockResolvedValueOnce({
        pieceId: "piece-3", shipmentId: "ship-1", newStatus: "in_transit",
        shipmentNumber: "SH-20260401-0001", pieceNumber: 3,
      });

    const results = await scanCaller(driverCtx()).scan.processBatch({
      scans: [
        { qrCode: "qr-1", action: "in_transit" },
        { qrCode: "qr-2", action: "in_transit" },
        { qrCode: "qr-3", action: "in_transit" },
      ],
    });

    expect(results).toHaveLength(3);
    expect(results[0].ok).toBe(true);
    expect(results[0].data).toMatchObject({ pieceId: "piece-1" });
    expect(results[1].ok).toBe(false);
    expect(results[1].error).toContain("ALREADY_AT_STATUS");
    expect(results[2].ok).toBe(true);
    expect(results[2].data).toMatchObject({ pieceId: "piece-3" });
  });

  it("rejects unauthenticated calls", async () => {
    await expect(
      scanCaller({ user: null }).scan.processBatch({
        scans: [{ qrCode: "qr-1", action: "in_transit" }],
      }),
    ).rejects.toThrow(expect.objectContaining({ code: "UNAUTHORIZED" }));
  });
});
