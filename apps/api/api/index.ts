import express from 'express';
import type { IncomingMessage, ServerResponse } from 'node:http';
// Import from `dist/` (produced by `nest build` during `vercel-build`) instead
// of `src/`. `@vercel/node` does not compile `.tsx` files when tracing the
// serverless function entrypoint, so importing source `.tsx` files (e.g. the
// react-pdf templates under `src/modules/absences` and `src/components/pdfx`)
// causes "Cannot find module" errors in production.
import { createApp } from '../dist/src/app.setup.js';

const server = express();

const appPromise = createApp(server).then((app) => app.init());

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  await appPromise;
  server(req as any, res as any);
}
