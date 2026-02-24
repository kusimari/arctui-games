import { describe, test, expect, beforeEach } from "bun:test";
import store from "store2";
import { getMemory, _resetMemory } from "../src/memory";

beforeEach(() => {
  store.clearAll();   // reset store2's in-memory fallback between tests
  _resetMemory();     // reset our singleton
});

describe("singleton", () => {
  test("getMemory returns the same instance on every call", () => {
    expect(getMemory()).toBe(getMemory());
  });

  test("_resetMemory causes the next call to return a new instance", () => {
    const m1 = getMemory();
    _resetMemory();
    const m2 = getMemory();
    expect(m1).not.toBe(m2);
  });
});

describe("get default", () => {
  test("returns {} for a key with no stored data", () => {
    expect(getMemory().get("snake")).toEqual({});
  });
});

describe("update", () => {
  test("merges partial into an existing stored object", () => {
    const mem = getMemory();
    mem.set("snake", { highScore: 10, lives: 3 });
    mem.update("snake", { highScore: 50 });
    expect(mem.get("snake")).toEqual({ highScore: 50, lives: 3 });
  });

  test("creates from partial when no object exists for the key", () => {
    getMemory().update("snake", { highScore: 50 });
    expect(getMemory().get("snake")).toEqual({ highScore: 50 });
  });
});
