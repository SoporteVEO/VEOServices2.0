import 'dotenv/config';

(BigInt.prototype as unknown as { toJSON?(this: bigint): string }).toJSON =
  function (this: bigint) {
    return this.toString();
  };

import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import type { Request, Response, NextFunction } from 'express';
import { json, urlencoded } from 'express';
import { AppModule } from 'src/app.module';
import { AUTH_INSTANCE } from './modules/auth/auth.guard.js';

const logger = new Logger('Bootstrap');
const port = process.env.PORT || 4000;

/** JSON body limit (base64 images on digital-billboards exceed default 100kb). */
const BODY_LIMIT = process.env.BODY_SIZE_LIMIT ?? '15mb';

const TRUSTED_ORIGINS = (
  process.env.TRUSTED_ORIGINS ?? 'http://localhost:3000'
).split(',');

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

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
    logger: ['error', 'warn', 'fatal', 'verbose', 'debug', 'log'],
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

  await app.listen(port);
  if (process.env.NODE_ENV === 'development') {
    logger.log(`Server is running on http://localhost:${port}/api`);
  }
}

bootstrap().catch((err: unknown) => {
  const message =
    err instanceof Error ? (err.stack ?? err.message) : String(err);
  console.error('Failed to start application:', message);
  logger.fatal('Failed to start application', message);
  process.exit(1);
});
