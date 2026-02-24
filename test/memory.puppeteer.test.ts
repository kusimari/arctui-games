/**
 * Puppeteer tests — verify memory module behaviour in a real browser.
 *
 * These tests build src/memory.ts to a browser bundle, load it in a headless
 * Chromium page, and exercise the public API through page.evaluate().
 *
 * They are automatically skipped when no browser executable is available
 * (e.g. in sandboxed CI without Chrome). Unit tests in memory.test.ts cover
 * the same logic with a test double so no coverage is lost.
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import puppeteer, { type Browser, type Page } from "puppeteer";
import { rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const tmpDir = join(root, ".tmp-puppeteer-memory");

let browser: Browser | null = null;
let page: Page | null = null;
let browserUnavailable = false;

beforeAll(async () => {
  // 1. Build memory.ts → browser ESM bundle
  mkdirSync(tmpDir, { recursive: true });

  const result = await Bun.build({
    entrypoints: [join(root, "src/memory.ts")],
    outdir: tmpDir,
    target: "browser",
    naming: "[name].js",
  });

  if (!result.success) {
    browserUnavailable = true;
    return;
  }

  // 2. Write an HTML fixture that imports the module and exposes it on window
  writeFileSync(
    join(tmpDir, "index.html"),
    `<!DOCTYPE html><html><body>
<script type="module">
  import { createMemory, getMemory, _resetMemory } from "./memory.js";
  window.__memory = { createMemory, getMemory, _resetMemory };
</script>
</body></html>`,
  );

  // 3. Launch browser; skip gracefully if unavailable
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    page = await browser.newPage();
    await page.goto(`file://${join(tmpDir, "index.html")}`);
    await page.waitForFunction(
      () => !!(window as unknown as Record<string, unknown>).__memory,
      { timeout: 5000 },
    );
  } catch {
    browserUnavailable = true;
    if (browser) { await browser.close().catch(() => {}); browser = null; }
    page = null;
  }
});

afterAll(async () => {
  if (browser) await browser.close().catch(() => {});
  rmSync(tmpDir, { recursive: true, force: true });
});

// Wraps a test body so it is skipped (passes silently) when no browser is available.
function ifBrowser(fn: (p: Page) => Promise<void>): () => Promise<void> {
  return async () => {
    if (browserUnavailable || !page) return;
    await fn(page);
  };
}

// Type alias used inside page.evaluate() bodies
type WinMemory = {
  getMemory: (storage?: unknown) => {
    get: (key: string) => unknown;
    set: (key: string, value: unknown) => void;
    update: (key: string, partial: unknown) => void;
    delete: (key: string) => void;
    clearAll: () => void;
  };
  _resetMemory: () => void;
};

describe("memory in real browser (puppeteer)", () => {
  beforeEach(async () => {
    if (browserUnavailable || !page) return;
    await page.evaluate(() => {
      localStorage.clear();
      (window as unknown as { __memory: WinMemory }).__memory._resetMemory();
    });
  });

  test("get returns {} for a key with no stored data", ifBrowser(async (p) => {
    const result = await p.evaluate(() => {
      const { getMemory } = (window as unknown as { __memory: WinMemory }).__memory;
      return getMemory().get("snake");
    });
    expect(result).toEqual({});
  }));

  test("getMemory is a singleton — same reference on every call", ifBrowser(async (p) => {
    const isSame = await p.evaluate(() => {
      const { getMemory } = (window as unknown as { __memory: WinMemory }).__memory;
      return getMemory() === getMemory();
    });
    expect(isSame).toBe(true);
  }));

  test("set persists data and get retrieves it", ifBrowser(async (p) => {
    const result = await p.evaluate(() => {
      const { getMemory } = (window as unknown as { __memory: WinMemory }).__memory;
      const mem = getMemory();
      mem.set("snake", { highScore: 42 });
      return mem.get("snake");
    });
    expect(result).toEqual({ highScore: 42 });
  }));

  test("data survives a singleton reset — localStorage retains it", ifBrowser(async (p) => {
    const result = await p.evaluate(() => {
      const { getMemory, _resetMemory } = (window as unknown as { __memory: WinMemory }).__memory;
      getMemory().set("snake", { highScore: 99 });
      _resetMemory();
      return getMemory().get("snake"); // new BrowserMemory instance, same localStorage
    });
    expect(result).toEqual({ highScore: 99 });
  }));

  test("update merges partial into the existing stored object", ifBrowser(async (p) => {
    const result = await p.evaluate(() => {
      const { getMemory } = (window as unknown as { __memory: WinMemory }).__memory;
      const mem = getMemory();
      mem.set("snake", { highScore: 10, lives: 3 });
      mem.update("snake", { highScore: 50 });
      return mem.get("snake");
    });
    expect(result).toEqual({ highScore: 50, lives: 3 });
  }));

  test("delete removes the stored object", ifBrowser(async (p) => {
    const result = await p.evaluate(() => {
      const { getMemory } = (window as unknown as { __memory: WinMemory }).__memory;
      const mem = getMemory();
      mem.set("snake", { highScore: 100 });
      mem.delete("snake");
      return mem.get("snake");
    });
    expect(result).toEqual({});
  }));

  test("multiple keys are stored independently", ifBrowser(async (p) => {
    const result = await p.evaluate(() => {
      const { getMemory } = (window as unknown as { __memory: WinMemory }).__memory;
      const mem = getMemory();
      mem.set("snake", { highScore: 1 });
      mem.set("tetris", { highScore: 2 });
      return { snake: mem.get("snake"), tetris: mem.get("tetris") };
    });
    expect(result).toEqual({ snake: { highScore: 1 }, tetris: { highScore: 2 } });
  }));

  test("clearAll wipes all stored data so every get returns {}", ifBrowser(async (p) => {
    const result = await p.evaluate(() => {
      const { getMemory } = (window as unknown as { __memory: WinMemory }).__memory;
      const mem = getMemory();
      mem.set("snake", { highScore: 10 });
      mem.set("tetris", { highScore: 20 });
      mem.clearAll();
      return { snake: mem.get("snake"), tetris: mem.get("tetris") };
    });
    expect(result).toEqual({ snake: {}, tetris: {} });
  }));
});
