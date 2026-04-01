import { driverProcedure, protectedProcedure, staffProcedure } from "../middleware/auth";
import { router } from "../trpc";

export const userRouter = router({
  me: protectedProcedure.query(({ ctx }) => {
    return {
      uid: ctx.user.uid,
      email: ctx.user.email,
      role: ctx.user.role,
      name: ctx.user.name,
      locationId: ctx.user.locationId,
    };
  }),
  pingStaff: staffProcedure.query(() => {
    return { ok: true as const, scope: "staff" as const };
  }),
  pingDriver: driverProcedure.query(() => {
    return { ok: true as const, scope: "driver" as const };
  }),
});
