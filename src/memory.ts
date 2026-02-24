// Browser memory — typed localStorage wrapper for game state persistence.
// Use the `memory` singleton in game code. Use `createMemory(mockStorage)` in tests.

export interface GameRecord {
  highScore: number;
}

export interface MemoryStore {
  [game: string]: GameRecord;
}

/** Minimal storage interface — compatible with `localStorage` and test mocks. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const STORAGE_KEY = "arctui-games";

export function createMemory(storage?: StorageLike) {
  // Access localStorage lazily (at call time) so the module can be imported
  // in non-browser environments (e.g. Bun test runner) without errors.
  function getStorage(): StorageLike {
    return storage ?? localStorage;
  }

  function load(): MemoryStore {
    try {
      const raw = getStorage().getItem(STORAGE_KEY);
      if (!raw) return {};
      return JSON.parse(raw) as MemoryStore;
    } catch {
      return {};
    }
  }

  function save(store: MemoryStore): void {
    getStorage().setItem(STORAGE_KEY, JSON.stringify(store));
  }

  return {
    getHighScore(game: string): number {
      return load()[game]?.highScore ?? 0;
    },

    setHighScore(game: string, score: number): void {
      const store = load();
      const best = store[game]?.highScore ?? 0;
      if (score > best) {
        store[game] = { ...store[game], highScore: score };
        save(store);
      }
    },

    clearAll(): void {
      getStorage().removeItem(STORAGE_KEY);
    },
  };
}

/** Default singleton — uses real browser localStorage. */
export const memory = createMemory();
