import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  private getClient(): Redis | null {
    if (this.client) return this.client;

    const url = process.env.REDIS_URL;
    if (!url) {
      this.logger.warn('REDIS_URL not set – Redis caching disabled');
      return null;
    }

    try {
      this.client = new Redis(url, { maxRetriesPerRequest: 1 });

      this.client.on('error', (err) => {
        this.logger.warn(`Redis error: ${err.message}`);
      });

      this.logger.log('Redis connected');
      return this.client;
    } catch {
      this.logger.warn('Failed to connect to Redis – caching disabled');
      return null;
    }
  }

  get available(): boolean {
    return this.getClient() !== null;
  }

  async get(key: string): Promise<string | null> {
    const client = this.getClient();
    if (!client) return null;
    try {
      return await client.get(key);
    } catch {
      return null;
    }
  }

  async getBuffer(key: string): Promise<Buffer | null> {
    const client = this.getClient();
    if (!client) return null;
    try {
      return await client.getBuffer(key);
    } catch {
      return null;
    }
  }

  async setex(
    key: string,
    ttlSeconds: number,
    value: string | Buffer,
  ): Promise<void> {
    const client = this.getClient();
    if (!client) return;
    try {
      await client.setex(key, ttlSeconds, value);
    } catch {
      /* best-effort caching */
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch (err) {
        this.logger.warn('Error closing Redis connection', err);
      }
    }
  }
}
