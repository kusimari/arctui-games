// Browser memory — typed key-value store backed by store2 (localStorage).
// `getMemory()` is the singleton accessor for app code.

import store from "store2";

/** A keyed memory interface. Each key names one game's storage object. */
export interface BrowserMemory {
  /** Returns the stored object for key, or {} if none exists. */
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

let _instance: BrowserMemory | undefined;

/** Returns (or creates) the singleton BrowserMemory. */
export function getMemory(): BrowserMemory {
  if (!_instance) {
    _instance = {
      get<T extends object = Record<string, never>>(key: string): T {
        return (store.get(key) as T | null) ?? ({} as T);
      },
      set<T extends object>(key: string, value: T): void {
        store.set(key, value);
      },
      update<T extends object>(key: string, partial: Partial<T>): void {
        const existing = this.get<T>(key);
        this.set(key, { ...existing, ...partial });
      },
      delete(key: string): void {
        store.remove(key);
      },
      clearAll(): void {
        store.clearAll();
      },
    };
  }
  return _instance;
}

/** Resets the singleton. Call this in `beforeEach` in tests. */
export function _resetMemory(): void {
  _instance = undefined;
}
