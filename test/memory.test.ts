import { describe, test, expect, beforeEach } from "bun:test";
import { createMemory, getMemory, _resetMemory, type StorageLike } from "../src/memory";

// ─── Test double for browser localStorage ────────────────────────────────────

function makeStorageDouble(): StorageLike & { _data: Record<string, string> } {
  const _data: Record<string, string> = {};
  return {
    _data,
    getItem: (key) => _data[key] ?? null,
    setItem: (key, value) => { _data[key] = value; },
    removeItem: (key) => { delete _data[key]; },
  };
}

// ─── createMemory factory ─────────────────────────────────────────────────────

describe("createMemory", () => {
  describe("creation / loading", () => {
    test("get returns {} when storage has no data for key", () => {
      const mem = createMemory(makeStorageDouble());
      expect(mem.get("snake")).toEqual({});
    });

    test("get returns the existing stored object when one was previously saved", () => {
      const s = makeStorageDouble();
      s.setItem("snake", JSON.stringify({ highScore: 42 }));
      const mem = createMemory(s);
      expect(mem.get("snake")).toEqual({ highScore: 42 });
    });

    test("get returns {} when stored data is corrupt JSON", () => {
      const s = makeStorageDouble();
      s.setItem("snake", "{ not valid json }}}");
      const mem = createMemory(s);
      expect(mem.get("snake")).toEqual({});
    });
  });

  describe("set", () => {
    test("stores the object and get retrieves it", () => {
      const mem = createMemory(makeStorageDouble());
      mem.set("snake", { highScore: 100 });
      expect(mem.get("snake")).toEqual({ highScore: 100 });
    });

    test("overwrites a previously stored object", () => {
      const mem = createMemory(makeStorageDouble());
      mem.set("snake", { highScore: 100 });
      mem.set("snake", { highScore: 200 });
      expect(mem.get("snake")).toEqual({ highScore: 200 });
    });
  });

  describe("update", () => {
    test("merges partial into an existing stored object", () => {
      const mem = createMemory(makeStorageDouble());
      mem.set("snake", { highScore: 100, lives: 3 });
      mem.update("snake", { highScore: 200 });
      expect(mem.get("snake")).toEqual({ highScore: 200, lives: 3 });
    });

    test("creates from partial when no object exists for the key yet", () => {
      const mem = createMemory(makeStorageDouble());
      mem.update("snake", { highScore: 50 });
      expect(mem.get("snake")).toEqual({ highScore: 50 });
    });
  });

  describe("delete", () => {
    test("removes the stored object so get returns {}", () => {
      const mem = createMemory(makeStorageDouble());
      mem.set("snake", { highScore: 100 });
      mem.delete("snake");
      expect(mem.get("snake")).toEqual({});
    });

    test("is a no-op when the key does not exist", () => {
      const mem = createMemory(makeStorageDouble());
      expect(() => mem.delete("nonexistent")).not.toThrow();
    });
  });

  test("keys are stored independently — one game does not affect another", () => {
    const mem = createMemory(makeStorageDouble());
    mem.set("snake", { highScore: 100 });
    mem.set("tetris", { highScore: 999 });
    expect(mem.get("snake")).toEqual({ highScore: 100 });
    expect(mem.get("tetris")).toEqual({ highScore: 999 });
  });
});

// ─── getMemory singleton ──────────────────────────────────────────────────────

describe("getMemory singleton", () => {
  beforeEach(() => {
    _resetMemory();
  });

  test("returns the same instance on repeated calls", () => {
    const s = makeStorageDouble();
    const m1 = getMemory(s);
    const m2 = getMemory(s);
    expect(m1).toBe(m2);
  });

  test("first call with injected storage creates instance backed by that storage", () => {
    const s = makeStorageDouble();
    s.setItem("snake", JSON.stringify({ highScore: 77 }));
    expect(getMemory(s).get("snake")).toEqual({ highScore: 77 });
  });

  test("subsequent calls ignore the storage argument — first-call storage wins", () => {
    const s1 = makeStorageDouble();
    const s2 = makeStorageDouble();
    s1.setItem("snake", JSON.stringify({ highScore: 1 }));
    s2.setItem("snake", JSON.stringify({ highScore: 2 }));
    getMemory(s1);                   // first call: s1 is used
    const mem = getMemory(s2);       // second call: s1 still used
    expect(mem.get("snake")).toEqual({ highScore: 1 });
  });

  test("_resetMemory clears the singleton so the next call creates a fresh instance", () => {
    const m1 = getMemory(makeStorageDouble());
    _resetMemory();
    const m2 = getMemory(makeStorageDouble());
    expect(m1).not.toBe(m2);
  });

  test("data written through singleton is visible via a new instance using the same storage", () => {
    const s = makeStorageDouble();
    getMemory(s).set("snake", { highScore: 55 });
    _resetMemory();
    expect(getMemory(s).get("snake")).toEqual({ highScore: 55 });
  });
});
