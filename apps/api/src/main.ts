import 'dotenv/config';

(BigInt.prototype as unknown as { toJSON?(this: bigint): string }).toJSON =
  function (this: bigint) {
    return this.toString();
  };

import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import { AppModule } from 'src/app.module';

const logger = new Logger('Bootstrap');
const port = process.env.PORT || 4000;

/** JSON body limit (base64 images on digital-billboards exceed default 100kb). */
const BODY_LIMIT = process.env.BODY_SIZE_LIMIT ?? '15mb';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
    logger: ['error', 'warn', 'fatal', 'verbose', 'debug', 'log'],
    bufferLogs: false,
  });

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
