import { TRPCError, initTRPC } from "@trpc/server";
import { describe, expect, it } from "vitest";
import type { AuthUser, Context } from "../src/context";

const t = initTRPC.context<Context>().create();

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" });
  }
  return next({ ctx: { user: ctx.user } });
});

const requireRole = (allowed: string[]) =>
  t.middleware(({ ctx, next }) => {
    if (!ctx.user || !allowed.includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
    }
    return next({ ctx: { user: ctx.user } });
  });

const publicProcedure = t.procedure;
const protectedProcedure = publicProcedure.use(isAuthed);
const adminProcedure = publicProcedure.use(isAuthed).use(requireRole(["admin"]));
const staffProcedure = publicProcedure.use(isAuthed).use(requireRole(["staff", "admin"]));
const driverProcedure = publicProcedure.use(isAuthed).use(requireRole(["driver", "admin"]));

const testRouter = t.router({
  protectedRoute: protectedProcedure.query(() => "ok"),
  adminRoute: adminProcedure.query(() => "admin-ok"),
  staffRoute: staffProcedure.query(() => "staff-ok"),
  driverRoute: driverProcedure.query(() => "driver-ok"),
});

const caller = t.createCallerFactory(testRouter);

function makeUser(role: "admin" | "driver" | "staff"): AuthUser {
  return { uid: "test-uid", email: "test@1x.tech", name: "Test", role, locationId: "HA" };
}

describe("protectedProcedure", () => {
  it("allows any authenticated user", async () => {
    const result = await caller({ user: makeUser("staff") }).protectedRoute();
    expect(result).toBe("ok");
  });

  it("throws UNAUTHORIZED when user is null", async () => {
    await expect(caller({ user: null }).protectedRoute()).rejects.toThrow(
      expect.objectContaining({ code: "UNAUTHORIZED" }),
    );
  });
});

describe("adminProcedure", () => {
  it("allows admin users", async () => {
    const result = await caller({ user: makeUser("admin") }).adminRoute();
    expect(result).toBe("admin-ok");
  });

  it("throws FORBIDDEN for staff users", async () => {
    await expect(caller({ user: makeUser("staff") }).adminRoute()).rejects.toThrow(
      expect.objectContaining({ code: "FORBIDDEN" }),
    );
  });

  it("throws FORBIDDEN for driver users", async () => {
    await expect(caller({ user: makeUser("driver") }).adminRoute()).rejects.toThrow(
      expect.objectContaining({ code: "FORBIDDEN" }),
    );
  });

  it("throws UNAUTHORIZED when user is null", async () => {
    await expect(caller({ user: null }).adminRoute()).rejects.toThrow(
      expect.objectContaining({ code: "UNAUTHORIZED" }),
    );
  });
});

describe("staffProcedure", () => {
  it("allows staff users", async () => {
    const result = await caller({ user: makeUser("staff") }).staffRoute();
    expect(result).toBe("staff-ok");
  });

  it("allows admin users", async () => {
    const result = await caller({ user: makeUser("admin") }).staffRoute();
    expect(result).toBe("staff-ok");
  });

  it("throws FORBIDDEN for driver users", async () => {
    await expect(caller({ user: makeUser("driver") }).staffRoute()).rejects.toThrow(
      expect.objectContaining({ code: "FORBIDDEN" }),
    );
  });
});

describe("driverProcedure", () => {
  it("allows driver users", async () => {
    const result = await caller({ user: makeUser("driver") }).driverRoute();
    expect(result).toBe("driver-ok");
  });

  it("allows admin users", async () => {
    const result = await caller({ user: makeUser("admin") }).driverRoute();
    expect(result).toBe("driver-ok");
  });

  it("throws FORBIDDEN for staff users", async () => {
    await expect(caller({ user: makeUser("staff") }).driverRoute()).rejects.toThrow(
      expect.objectContaining({ code: "FORBIDDEN" }),
    );
  });
});
