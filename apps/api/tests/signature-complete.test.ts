import { describe, expect, it, vi, beforeEach } from "vitest";

// --- Hoisted mocks (must be hoisted for vi.mock factory) ---
const {
  mockBatchUpdate,
  mockBatchCommit,
  mockFileSave,
  mockFileMakePublic,
  mockFileGetSignedUrl,
  mockDocUpdate,
  mockDocGet,
  mockDocSet,
  mockPiecesGet,
} = vi.hoisted(() => ({
  mockBatchUpdate: vi.fn(),
  mockBatchCommit: vi.fn().mockResolvedValue(undefined),
  mockFileSave: vi.fn().mockResolvedValue(undefined),
  mockFileMakePublic: vi.fn().mockResolvedValue(undefined),
  mockFileGetSignedUrl: vi.fn().mockResolvedValue(["https://storage.example.com/sig.png"]),
  mockDocUpdate: vi.fn().mockResolvedValue(undefined),
  mockDocGet: vi.fn(),
  mockDocSet: vi.fn().mockResolvedValue(undefined),
  mockPiecesGet: vi.fn(),
}));

const mockPieceDocs = [
  {
    ref: { path: "shipments/ship1/pieces/p1" },
    data: () => ({ status: "delivered", events: [] }),
  },
  {
    ref: { path: "shipments/ship1/pieces/p2" },
    data: () => ({ status: "delivered", events: [] }),
  },
  {
    ref: { path: "shipments/ship1/pieces/p3" },
    data: () => ({ status: "completed", events: [] }),
  },
];

vi.mock("firebase-admin/firestore", () => ({
  FieldValue: {
    serverTimestamp: vi.fn(() => "SERVER_TIMESTAMP"),
    arrayUnion: vi.fn((...args: unknown[]) => args),
  },
  Timestamp: {
    now: vi.fn(() => ({ _seconds: 1700000000, _nanoseconds: 0 })),
    fromDate: vi.fn((d: Date) => ({
      toDate: () => d,
      toMillis: () => d.getTime(),
      _seconds: Math.floor(d.getTime() / 1000),
    })),
  },
}));

vi.mock("../src/lib/firebase", () => {
  const shipmentRef = { path: "shipments/ship1", update: mockDocUpdate };

  return {
    auth: { verifyIdToken: vi.fn() },
    db: {
      collection: vi.fn((path: string) => {
        if (path === "shipments/ship1/pieces") {
          return { get: mockPiecesGet };
        }
        if (path === "signatureRequests") {
          return {
            doc: vi.fn(() => ({
              get: mockDocGet,
              set: mockDocSet,
              update: mockDocUpdate,
            })),
          };
        }
        return { doc: vi.fn() };
      }),
      doc: vi.fn((path: string) => {
        if (path === "shipments/ship1") {
          return shipmentRef;
        }
        if (path.includes("pieces")) {
          return { update: mockDocUpdate };
        }
        return { get: mockDocGet, update: mockDocUpdate };
      }),
      batch: vi.fn(() => ({
        update: mockBatchUpdate,
        commit: mockBatchCommit,
      })),
      runTransaction: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => {
        const tx = {
          get: mockDocGet,
          update: mockDocUpdate,
          set: mockDocSet,
        };
        return fn(tx);
      }),
    },
    storage: {
      bucket: vi.fn(() => ({
        name: "test-bucket",
        file: vi.fn(() => ({
          save: mockFileSave,
          makePublic: mockFileMakePublic,
          getSignedUrl: mockFileGetSignedUrl,
        })),
      })),
    },
  };
});

vi.mock("../src/lib/slack", () => ({
  sendSlackDM: vi.fn().mockResolvedValue(undefined),
}));

import { initTRPC } from "@trpc/server";
import type { Context } from "../src/context";
import { scanRouter } from "../src/routers/scan";

const t = initTRPC.context<Context>().create();
const caller = t.createCallerFactory(t.router({ scan: scanRouter }));

function publicCtx(): Context {
  return { user: null };
}

const validSignatureInput = {
  token: "valid-token-123",
  signatureData: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==",
};

describe("submitSignatureByToken - piece completion", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set up the token document to be valid and unconsumed
    mockDocGet.mockResolvedValue({
      exists: true,
      data: () => ({
        shipmentId: "ship1",
        pieceId: "p1",
        createdBy: "admin-1",
        consumedAt: null,
        expiresAt: { toDate: () => new Date(Date.now() + 86400000) },
      }),
    });

    // Set up pieces collection
    mockPiecesGet.mockResolvedValue({ docs: mockPieceDocs });
  });

  it("updates all non-completed pieces to completed status", async () => {
    await caller(publicCtx()).scan.submitSignatureByToken(validSignatureInput);

    // p1 (delivered) and p2 (delivered) should be updated, p3 (completed) should not
    const updatePaths = mockBatchUpdate.mock.calls.map(
      (call: unknown[]) => (call[0] as { path: string }).path,
    );
    expect(updatePaths).toContain("shipments/ship1/pieces/p1");
    expect(updatePaths).toContain("shipments/ship1/pieces/p2");
    expect(updatePaths).not.toContain("shipments/ship1/pieces/p3");
  });

  it("sets correct fields on each updated piece including events", async () => {
    await caller(publicCtx()).scan.submitSignatureByToken(validSignatureInput);

    // Find calls for piece refs (not shipment ref)
    const pieceCalls = mockBatchUpdate.mock.calls.filter(
      (call: unknown[]) => (call[0] as { path: string }).path.includes("pieces"),
    );

    for (const call of pieceCalls) {
      const updateData = call[1] as Record<string, unknown>;
      expect(updateData.status).toBe("completed");
      expect(updateData.completedAt).toBe("SERVER_TIMESTAMP");
      expect(updateData.updatedAt).toBe("SERVER_TIMESTAMP");

      // events should include arrayUnion result with action "completed"
      const events = updateData.events as unknown[];
      expect(events).toBeDefined();
      const eventObj = (events as Array<{ action: string; userName: string; userId: string }>)[0];
      expect(eventObj.action).toBe("completed");
      expect(eventObj.userName).toBe("Signature");
      expect(eventObj.userId).toBe("signature-flow");
    }
  });

  it("updates shipment document with completed status", async () => {
    await caller(publicCtx()).scan.submitSignatureByToken(validSignatureInput);

    // Find the batch.update call for the shipment ref (not pieces)
    const shipmentCall = mockBatchUpdate.mock.calls.find(
      (call: unknown[]) => (call[0] as { path: string }).path === "shipments/ship1",
    );

    expect(shipmentCall).toBeDefined();
    const updateData = shipmentCall![1] as Record<string, unknown>;
    expect(updateData.status).toBe("completed");
    expect(updateData.completedAt).toBe("SERVER_TIMESTAMP");
    expect(updateData.updatedAt).toBe("SERVER_TIMESTAMP");
  });

  it("does not update pieces already at completed status", async () => {
    await caller(publicCtx()).scan.submitSignatureByToken(validSignatureInput);

    const allUpdatePaths = mockBatchUpdate.mock.calls.map(
      (call: unknown[]) => (call[0] as { path: string }).path,
    );

    // p3 is already completed -- should not appear in batch updates
    const p3Updates = allUpdatePaths.filter((p: string) => p.includes("p3"));
    expect(p3Updates).toHaveLength(0);
  });

  it("calls batch.commit() exactly once", async () => {
    await caller(publicCtx()).scan.submitSignatureByToken(validSignatureInput);

    expect(mockBatchCommit).toHaveBeenCalledTimes(1);
  });
});
