import { HttpException, HttpStatus } from '@nestjs/common';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = Number(process.env.AGENT_RATE_LIMIT_PER_MINUTE) || 15;

const hits = new Map<string, number[]>();

/**
 * Per-instance sliding window. On serverless each instance keeps its own
 * window, which is enough to stop a runaway client from burning tokens.
 */
export function assertWithinRateLimit(userId: string, now = Date.now()) {
  const recent = (hits.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    throw new HttpException(
      'Demasiadas solicitudes a Nexo. Espera un momento e intenta de nuevo.',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
  recent.push(now);
  hits.set(userId, recent);
}
