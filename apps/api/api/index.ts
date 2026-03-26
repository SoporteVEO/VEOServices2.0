import express from 'express';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from '../src/app.setup.js';

const server = express();

const appPromise = createApp(server).then((app) => app.init());

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  await appPromise;
  server(req as any, res as any);
}
