/**
 * Simple in-memory TTL cache with request coalescing.
 *
 * - Entries expire after `ttlMs`.
 * - Concurrent calls with the same key share a single in-flight promise
 *   (avoids duplicate DB round-trips).
 */
export class TtlCache<T> {
  private entries = new Map<string, { data: T; expiresAt: number }>();
  private pending = new Map<string, Promise<T>>();

  constructor(private readonly ttlMs: number) {}

  async getOrFetch(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.entries.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    const inflight = this.pending.get(key);
    if (inflight) return inflight;

    const promise = fetcher()
      .then((data) => {
        this.entries.set(key, { data, expiresAt: Date.now() + this.ttlMs });
        this.pending.delete(key);
        return data;
      })
      .catch((err) => {
        this.pending.delete(key);
        throw err;
      });

    this.pending.set(key, promise);
    return promise;
  }

  invalidate(key: string): void {
    this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
    this.pending.clear();
  }
}
