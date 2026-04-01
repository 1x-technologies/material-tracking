import type { UserRole } from "@material-tracking/shared";
import { TRPCError } from "@trpc/server";
import { middleware, publicProcedure } from "../trpc";

const isAuthed = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Authentication required" });
  }
  return next({ ctx: { user: ctx.user } });
});

const requireRole = (allowed: UserRole[]) =>
  middleware(({ ctx, next }) => {
    if (!ctx.user || !allowed.includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
    }
    return next({ ctx: { user: ctx.user } });
  });

export const protectedProcedure = publicProcedure.use(isAuthed);
export const adminProcedure = publicProcedure.use(isAuthed).use(requireRole(["admin"]));
export const staffProcedure = publicProcedure.use(isAuthed).use(requireRole(["staff", "admin"]));
export const driverProcedure = publicProcedure.use(isAuthed).use(requireRole(["driver", "admin"]));
