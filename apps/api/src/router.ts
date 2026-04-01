import { healthRouter } from "./routers/health";
import { userRouter } from "./routers/user";
import { router } from "./trpc";

export const appRouter = router({
  health: healthRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
