import { describe, test, expect } from "bun:test";
import { createMemory, type StorageLike } from "../src/memory";

function mockStorage(): StorageLike {
  const store: Record<string, string> = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = value; },
    removeItem: (key) => { delete store[key]; },
  };
}

describe("memory", () => {
  test("getHighScore returns 0 for an unknown game", () => {
    const mem = createMemory(mockStorage());
    expect(mem.getHighScore("snake")).toBe(0);
  });

  test("setHighScore persists the score", () => {
    const mem = createMemory(mockStorage());
    mem.setHighScore("snake", 100);
    expect(mem.getHighScore("snake")).toBe(100);
  });

  test("setHighScore does not replace a higher existing score", () => {
    const mem = createMemory(mockStorage());
    mem.setHighScore("snake", 200);
    mem.setHighScore("snake", 100);
    expect(mem.getHighScore("snake")).toBe(200);
  });

  test("setHighScore replaces when the new score is strictly higher", () => {
    const mem = createMemory(mockStorage());
    mem.setHighScore("snake", 100);
    mem.setHighScore("snake", 150);
    expect(mem.getHighScore("snake")).toBe(150);
  });

  test("clearAll resets all stored data", () => {
    const mem = createMemory(mockStorage());
    mem.setHighScore("snake", 300);
    mem.clearAll();
    expect(mem.getHighScore("snake")).toBe(0);
  });

  test("multiple games are stored independently", () => {
    const mem = createMemory(mockStorage());
    mem.setHighScore("snake", 100);
    mem.setHighScore("tetris", 999);
    expect(mem.getHighScore("snake")).toBe(100);
    expect(mem.getHighScore("tetris")).toBe(999);
  });

  test("corrupt storage data is handled gracefully", () => {
    const s = mockStorage();
    s.setItem("arctui-games", "not valid json{{");
    const mem = createMemory(s);
    expect(mem.getHighScore("snake")).toBe(0);
  });
});
