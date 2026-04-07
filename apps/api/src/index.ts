import * as trpcExpress from "@trpc/server/adapters/express";
import cors from "cors";
import express from "express";
import { createContext } from "./context";
import { appRouter } from "./router";

export type { AppRouter } from "./router";

const app = express();

// CORS origins are loaded from the CORS_ORIGINS env var (comma-separated) so
// that each deployment can whitelist only its own frontend domain.  The
// hardcoded list below is the fallback for local development.
const DEFAULT_CORS_ORIGINS = [
  "https://1xtech-material-tracking-dev.web.app",
  "https://1xtech-material-tracking-staging.web.app",
  "https://1xtech-material-tracking-prod.web.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5000",
];

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
  : DEFAULT_CORS_ORIGINS;

app.use(
  cors({
    origin: corsOrigins,
  }),
);

const healthHandler: express.RequestHandler = (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
};
app.get("/health", healthHandler);
app.get("/api/health", healthHandler);

const trpcMiddleware = trpcExpress.createExpressMiddleware({
  router: appRouter,
  createContext,
});

// Firebase Hosting rewrites /api/** to Cloud Run preserving the path prefix
app.use("/api/trpc", trpcMiddleware);
// Local dev uses direct URL without /api prefix
app.use("/trpc", trpcMiddleware);

const port = Number(process.env.PORT) || 8080;
app.listen(port, () => {
  console.log(`tRPC API server listening on port ${port}`);
});
