// Browser memory — typed key-value store backed by store2 (localStorage).

import store from "store2";

export type Result<T> = { ok: true; value: T } | { ok: false; error: Error };

// Module-private helpers for constructing Result values.
function ok<T>(value: T): Result<T> { return { ok: true, value }; }
function okVoid(): Result<void>      { return { ok: true, value: undefined }; }
function fail(e: unknown): { ok: false; error: Error } {
  return { ok: false, error: e instanceof Error ? e : new Error(String(e)) };
}

/** A keyed memory interface. Each key names one game's storage object. */
export interface BrowserMemory {
  get<T extends object>(key: string): Result<T>;
  set<T extends object>(key: string, value: T): Result<void>;
  update<T extends object>(key: string, partial: Partial<T>): Result<void>;
  delete(key: string): Result<void>;
  clearAll(): Result<void>;
}

let _instance: BrowserMemory | undefined;

/** Returns (or creates) the singleton BrowserMemory. */
export function getMemory(): BrowserMemory {
  if (!_instance) {
    // Use `impl` in method bodies instead of `this` to avoid binding issues.
    const impl: BrowserMemory = {
      get<T extends object>(key: string): Result<T> {
        try {
          return ok((store.get(key) as T | null) ?? ({} as T));
        } catch (e) {
          return fail(e);
        }
      },
      set<T extends object>(key: string, value: T): Result<void> {
        try {
          store.set(key, value);
          return okVoid();
        } catch (e) {
          return fail(e);
        }
      },
      update<T extends object>(key: string, partial: Partial<T>): Result<void> {
        const r = impl.get<T>(key);
        if (!r.ok) return r;
        return impl.set(key, { ...r.value, ...partial });
      },
      delete(key: string): Result<void> {
        try {
          store.remove(key);
          return okVoid();
        } catch (e) {
          return fail(e);
        }
      },
      clearAll(): Result<void> {
        try {
          store.clearAll();
          return okVoid();
        } catch (e) {
          return fail(e);
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
