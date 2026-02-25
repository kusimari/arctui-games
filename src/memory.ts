// Browser memory — typed key-value store backed by store2 (localStorage).

import store from "store2";

/** A keyed memory interface. Each key names one game's storage object. */
export interface BrowserMemory {
  get<T extends object>(key: string): T;
  set<T extends object>(key: string, value: T): void;
  update<T extends object>(key: string, partial: Partial<T>): void;
  delete(key: string): void;
  clearAll(): void;
}

let _instance: BrowserMemory | undefined;

/** Returns (or creates) the singleton BrowserMemory. */
export function getMemory(): BrowserMemory {
  if (!_instance) {
    const impl: BrowserMemory = {
      get<T extends object>(key: string): T {
        return (store.get(key) as T | null) ?? ({} as T);
      },
      set<T extends object>(key: string, value: T): void {
        store.set(key, value);
      },
      update<T extends object>(key: string, partial: Partial<T>): void {
        impl.set(key, { ...impl.get<T>(key), ...partial } as T);
      },
      delete(key: string): void {
        store.remove(key);
      },
      clearAll(): void {
        store.clearAll();
      },
    };
    _instance = impl;
  }
  return _instance;
}

/** Resets the singleton. Call this in `beforeEach` in tests. */
export function _resetMemory(): void {
  _instance = undefined;
}
