import 'dotenv/config';

(BigInt.prototype as unknown as { toJSON?(this: bigint): string }).toJSON =
  function (this: bigint) {
    return this.toString();
  };

import { LogLevel, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  ExpressAdapter,
  NestExpressApplication,
} from '@nestjs/platform-express';
import type { Express, Request, Response, NextFunction } from 'express';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module.js';
import { AUTH_INSTANCE } from './modules/auth/auth.guard.js';

const BODY_LIMIT = process.env.BODY_SIZE_LIMIT ?? '15mb';

const TRUSTED_ORIGINS = (
  process.env.TRUSTED_ORIGINS ?? 'http://localhost:3000'
).split(',');

const LOG_LEVELS: LogLevel[] = [
  'error',
  'warn',
  'fatal',
  'verbose',
  'debug',
  'log',
];

function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  if (origin && TRUSTED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    );
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Expose-Headers', 'set-auth-token');
  }
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
}

export async function createApp(expressInstance?: Express) {
  const app = expressInstance
    ? await NestFactory.create<NestExpressApplication>(
        AppModule,
        new ExpressAdapter(expressInstance),
        { bodyParser: false, logger: LOG_LEVELS, bufferLogs: false },
      )
    : await NestFactory.create<NestExpressApplication>(AppModule, {
        bodyParser: false,
        logger: LOG_LEVELS,
        bufferLogs: false,
      });

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use(corsMiddleware);

  const { toNodeHandler } = await import('better-auth/node');
  const auth: unknown = app.get(AUTH_INSTANCE);
  expressApp.all(
    '/api/auth/{*any}',
    toNodeHandler(auth as Parameters<typeof toNodeHandler>[0]),
  );

  app.use(json({ limit: BODY_LIMIT }));
  app.use(urlencoded({ extended: true, limit: BODY_LIMIT }));

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      disableErrorMessages: false,
    }),
  );

  return app;
}
