import { initTRPC } from "@trpc/server";
import { describe, expect, it, vi } from "vitest";
import type { AuthUser, Context } from "../src/context";

vi.mock("../src/lib/firebase", () => ({
  auth: { verifyIdToken: vi.fn() },
  db: {
    collection: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        get: vi.fn().mockResolvedValue({
          docs: [
            {
              id: "HA",
              data: () => ({
                name: "HA",
                fullName: "Hayward",
                address: "Hayward, CA",
                active: true,
                printers: [],
                createdAt: { toDate: () => new Date("2026-01-01T00:00:00Z") },
              }),
            },
            {
              id: "SC",
              data: () => ({
                name: "SC",
                fullName: "San Carlos",
                address: "San Carlos, CA",
                active: true,
                printers: [],
                createdAt: { toDate: () => new Date("2026-01-01T00:00:00Z") },
              }),
            },
          ],
        }),
      }),
    }),
  },
}));

import { locationsRouter } from "../src/routers/locations";

const t = initTRPC.context<Context>().create();
const caller = t.createCallerFactory(
  t.router({ locations: locationsRouter }),
);

function staffCtx(): Context {
  return {
    user: {
      uid: "u1",
      email: "staff@1x.tech",
      name: "Staff",
      role: "staff",
      locationId: "HA",
    } satisfies AuthUser,
  };
}

describe("locations.list", () => {
  it("returns mapped active location documents", async () => {
    const result = await caller(staffCtx()).locations.list();
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: "HA", name: "HA", fullName: "Hayward" });
    expect(result[1]).toMatchObject({ id: "SC", name: "SC", fullName: "San Carlos" });
  });

  it("serializes createdAt as ISO string", async () => {
    const result = await caller(staffCtx()).locations.list();
    expect(result[0].createdAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("rejects unauthenticated calls", async () => {
    await expect(caller({ user: null }).locations.list()).rejects.toThrow(
      expect.objectContaining({ code: "UNAUTHORIZED" }),
    );
  });
});
