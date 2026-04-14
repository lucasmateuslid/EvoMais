interface CachedValue<T> {
  value: T;
  expiresAt: number;
}

export class MemoryCache<T> {
  private readonly store = new Map<string, CachedValue<T>>();

  get(key: string): T | undefined {
    const entry = this.store.get(key);

    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }
}

export const responseCache = new MemoryCache<string>();