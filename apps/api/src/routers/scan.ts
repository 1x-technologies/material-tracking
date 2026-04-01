import { processScanSchema } from "@material-tracking/shared";
import { db } from "../lib/firebase";
import { processOneScan } from "../lib/scan-process";
import { protectedProcedure } from "../middleware/auth";
import { router } from "../trpc";

export const scanRouter = router({
  process: protectedProcedure
    .input(processScanSchema)
    .mutation(async ({ ctx, input }) => {
      return processOneScan(
        db,
        { uid: ctx.user.uid, email: ctx.user.email, name: ctx.user.name ?? ctx.user.email ?? "" },
        input,
      );
    }),
});
