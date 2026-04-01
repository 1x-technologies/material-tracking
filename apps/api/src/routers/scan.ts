import { batchScanSchema, processScanSchema } from "@material-tracking/shared";
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

  processBatch: protectedProcedure
    .input(batchScanSchema)
    .mutation(async ({ ctx, input }) => {
      const user = {
        uid: ctx.user.uid,
        email: ctx.user.email,
        name: ctx.user.name ?? ctx.user.email ?? "",
      };

      const settled = await Promise.allSettled(
        input.scans.map((scan) => processOneScan(db, user, scan)),
      );

      return settled.map((s, index) => {
        if (s.status === "fulfilled") {
          return { index, ok: true as const, data: s.value };
        }
        const msg = s.reason instanceof Error ? s.reason.message : String(s.reason);
        return { index, ok: false as const, error: msg };
      });
    }),
});
