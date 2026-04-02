import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/lib/firebase", () => {
  return {
    auth: {
      verifyIdToken: vi.fn(),
    },
    db: {
      collection: vi.fn(),
    },
  };
});

vi.mock("firebase-admin/firestore", () => ({
  FieldValue: {
    serverTimestamp: vi.fn(() => "SERVER_TIMESTAMP"),
  },
}));

import { createContext } from "../src/context";
import { auth, db } from "../src/lib/firebase";

const mockAuth = vi.mocked(auth);
const mockDb = vi.mocked(db);

function makeOpts(authorization?: string): CreateExpressContextOptions {
  return {
    req: { headers: { authorization } } as unknown as Request,
    res: {} as Response,
  };
}

function mockFirestoreDoc(exists: boolean, data?: Record<string, unknown>) {
  const mockCreate = vi.fn().mockResolvedValue(undefined);
  const mockGet = vi.fn().mockResolvedValue({ exists, data: () => data });
  const mockDocRef = { get: mockGet, create: mockCreate };
  const mockCollection = vi.fn().mockReturnValue({ doc: vi.fn().mockReturnValue(mockDocRef) });
  mockDb.collection = mockCollection as any;
  return { mockGet, mockCreate, mockCollection };
}

describe("createContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null user when no Authorization header", async () => {
    const ctx = await createContext(makeOpts());
    expect(ctx.user).toBeNull();
  });

  it("returns null user when Authorization header is empty", async () => {
    const ctx = await createContext(makeOpts(""));
    expect(ctx.user).toBeNull();
  });

  it("returns null user when Bearer prefix has no token", async () => {
    const ctx = await createContext(makeOpts("Bearer "));
    expect(ctx.user).toBeNull();
  });

  it("returns correct role from existing Firestore user document", async () => {
    mockAuth.verifyIdToken.mockResolvedValue({
      uid: "user-123",
      email: "test@1x.tech",
      name: "Test User",
    } as any);

    mockFirestoreDoc(true, {
      role: "admin",
      email: "test@1x.tech",
      displayName: "Test User",
    });

    const ctx = await createContext(makeOpts("Bearer valid-token"));

    expect(ctx.user).toEqual({
      uid: "user-123",
      email: "test@1x.tech",
      name: "Test User",
      role: "admin",
      locationId: "",
    });
    expect(mockAuth.verifyIdToken).toHaveBeenCalledWith("valid-token");
  });

  it("lazily creates pending profile when Firestore document is missing", async () => {
    mockAuth.verifyIdToken.mockResolvedValue({
      uid: "new-user",
      email: "new@1x.tech",
      name: "New User",
    } as any);

    const mockCreate = vi.fn().mockResolvedValue(undefined);
    let callCount = 0;
    const mockGet = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({ exists: false, data: () => undefined });
      }
      return Promise.resolve({
        exists: true,
        data: () => ({
          role: null,
          email: "new@1x.tech",
          displayName: "New User",
        }),
      });
    });
    const mockDocRef = { get: mockGet, create: mockCreate };
    mockDb.collection = vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue(mockDocRef),
    }) as any;

    const ctx = await createContext(makeOpts("Bearer token-new"));

    expect(ctx.user).toEqual({
      uid: "new-user",
      email: "new@1x.tech",
      name: "New User",
      role: null,
      locationId: "",
    });
    expect(mockCreate).toHaveBeenCalledOnce();
    expect(mockCreate.mock.calls[0][0]).toMatchObject({ role: null });
  });

  it("handles race condition when another writer creates the doc between get and create", async () => {
    mockAuth.verifyIdToken.mockResolvedValue({
      uid: "race-user",
      email: "race@1x.tech",
      name: "Race User",
    } as any);

    const alreadyExistsErr = new Error("ALREADY_EXISTS");
    (alreadyExistsErr as any).code = 6;

    const mockCreate = vi.fn().mockRejectedValue(alreadyExistsErr);
    let callCount = 0;
    const mockGet = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({ exists: false, data: () => undefined });
      }
      return Promise.resolve({
        exists: true,
        data: () => ({
          role: "admin",
          email: "race@1x.tech",
          displayName: "Race User",
        }),
      });
    });
    const mockDocRef = { get: mockGet, create: mockCreate };
    mockDb.collection = vi.fn().mockReturnValue({
      doc: vi.fn().mockReturnValue(mockDocRef),
    }) as any;

    const ctx = await createContext(makeOpts("Bearer token-race"));

    expect(ctx.user?.role).toBe("admin");
    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  it("returns null user when verifyIdToken fails", async () => {
    mockAuth.verifyIdToken.mockRejectedValue(new Error("auth/id-token-expired"));

    const ctx = await createContext(makeOpts("Bearer expired-token"));
    expect(ctx.user).toBeNull();
  });
});
