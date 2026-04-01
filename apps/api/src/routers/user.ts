import { driverProcedure, staffProcedure } from "../middleware/auth";
import { router } from "../trpc";

export const userRouter = router({
  pingStaff: staffProcedure.query(() => {
    return { ok: true as const, scope: "staff" as const };
  }),
  pingDriver: driverProcedure.query(() => {
    return { ok: true as const, scope: "driver" as const };
  }),
});
