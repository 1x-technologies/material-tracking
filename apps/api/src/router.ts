import { adminRouter } from "./routers/admin";
import { directoryRouter } from "./routers/directory";
import { healthRouter } from "./routers/health";
import { locationsRouter } from "./routers/locations";
import { printerRouter } from "./routers/printer";
import { scanRouter } from "./routers/scan";
import { shipmentRouter } from "./routers/shipment";
import { userRouter } from "./routers/user";
import { router } from "./trpc";

export const appRouter = router({
  admin: adminRouter,
  directory: directoryRouter,
  health: healthRouter,
  locations: locationsRouter,
  printer: printerRouter,
  scan: scanRouter,
  shipment: shipmentRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
