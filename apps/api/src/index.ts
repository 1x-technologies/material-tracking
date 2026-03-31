import cors from 'cors';
import express from 'express';
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from './router';
import { createContext } from './context';

const app = express();

app.use(
  cors({
    origin: [
      'https://1xtech-material-tracking-dev.web.app',
      'https://1xtech-material-tracking-staging.web.app',
      'https://1xtech-material-tracking-prod.web.app',
      'http://localhost:5173',
      'http://localhost:5000',
    ],
  }),
);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

const port = Number(process.env.PORT) || 8080;
app.listen(port, () => {
  console.log(`tRPC API server listening on port ${port}`);
});
