import { healthRouter } from "./routers/health";
import { locationsRouter } from "./routers/locations";
import { userRouter } from "./routers/user";
import { router } from "./trpc";

export const appRouter = router({
  health: healthRouter,
  locations: locationsRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
