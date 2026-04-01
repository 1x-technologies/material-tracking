import { directoryRouter } from "./routers/directory";
import { healthRouter } from "./routers/health";
import { locationsRouter } from "./routers/locations";
import { scanRouter } from "./routers/scan";
import { shipmentRouter } from "./routers/shipment";
import { userRouter } from "./routers/user";
import { router } from "./trpc";

export const appRouter = router({
  directory: directoryRouter,
  health: healthRouter,
  locations: locationsRouter,
  scan: scanRouter,
  shipment: shipmentRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
