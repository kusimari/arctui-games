// Browser memory — typed localStorage wrapper.
// `getMemory()` is the singleton accessor for app code.
// `createMemory(storage)` is the factory for use with injected test doubles.

/** Minimal storage interface — compatible with `localStorage` and test doubles. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

/** A keyed memory interface. Each key names one game's storage object. */
export interface BrowserMemory {
  /** Returns the stored object for key, or {} if no data exists yet. */
  get<T extends object = Record<string, never>>(key: string): T;
  /** Stores value under key, replacing any existing value. */
  set<T extends object>(key: string, value: T): void;
  /** Merges partial into the existing object (creates {} base if none exists). */
  update<T extends object>(key: string, partial: Partial<T>): void;
  /** Removes the stored object for key. */
  delete(key: string): void;
  /** Wipes all stored data — clean slate for the user. */
  clearAll(): void;
}

export function createMemory(storage: StorageLike): BrowserMemory {
  return {
    get<T extends object = Record<string, never>>(key: string): T {
      try {
        const raw = storage.getItem(key);
        if (!raw) return {} as T;
        return JSON.parse(raw) as T;
      } catch {
        return {} as T;
      }
    },

    set<T extends object>(key: string, value: T): void {
      storage.setItem(key, JSON.stringify(value));
    },

    update<T extends object>(key: string, partial: Partial<T>): void {
      const existing = this.get<T>(key);
      this.set(key, { ...existing, ...partial });
    },

    delete(key: string): void {
      storage.removeItem(key);
    },

    clearAll(): void {
      storage.clear();
    },
  };
}

// Singleton backed by real browser localStorage.
let _instance: BrowserMemory | undefined;

/**
 * Returns (or creates) the singleton BrowserMemory backed by localStorage.
 * Pass `storage` only on the very first call — subsequent calls return the
 * cached instance regardless of the argument. Tests use this to inject a mock.
 */
export function getMemory(storage?: StorageLike): BrowserMemory {
  if (!_instance) {
    _instance = createMemory(storage ?? localStorage);
  }
  return _instance;
}

/** Resets the singleton. Call this in `beforeEach` in tests. */
export function _resetMemory(): void {
  _instance = undefined;
}
