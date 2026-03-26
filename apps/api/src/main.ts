import { Logger } from '@nestjs/common';
import { createApp } from './app.setup.js';

const logger = new Logger('Bootstrap');
const port = process.env.PORT || 4000;

async function bootstrap() {
  const app = await createApp();

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
