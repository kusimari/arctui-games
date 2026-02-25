// Browser memory — typed key-value store backed by store2 (localStorage).

import store from "store2";
import { ok, err, type Result } from "neverthrow";

export type { Result };

/** A keyed memory interface. Each key names one game's storage object. */
export interface BrowserMemory {
  get<T extends object>(key: string): Result<T, Error>;
  set<T extends object>(key: string, value: T): Result<void, Error>;
  update<T extends object>(key: string, partial: Partial<T>): Result<void, Error>;
  delete(key: string): Result<void, Error>;
  clearAll(): Result<void, Error>;
}

let _instance: BrowserMemory | undefined;

/** Returns (or creates) the singleton BrowserMemory. */
export function getMemory(): BrowserMemory {
  if (!_instance) {
    const impl: BrowserMemory = {
      get<T extends object>(key: string): Result<T, Error> {
        try {
          return ok((store.get(key) as T | null) ?? ({} as T));
        } catch (e) {
          return err(e instanceof Error ? e : new Error(String(e)));
        }
      },
      set<T extends object>(key: string, value: T): Result<void, Error> {
        try {
          store.set(key, value);
          return ok(undefined);
        } catch (e) {
          return err(e instanceof Error ? e : new Error(String(e)));
        }
      },
      update<T extends object>(key: string, partial: Partial<T>): Result<void, Error> {
        return impl.get<T>(key).andThen(existing =>
          impl.set(key, { ...existing, ...partial } as T)
        );
      },
      delete(key: string): Result<void, Error> {
        try {
          store.remove(key);
          return ok(undefined);
        } catch (e) {
          return err(e instanceof Error ? e : new Error(String(e)));
        }
      },
      clearAll(): Result<void, Error> {
        try {
          store.clearAll();
          return ok(undefined);
        } catch (e) {
          return err(e instanceof Error ? e : new Error(String(e)));
        }
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
