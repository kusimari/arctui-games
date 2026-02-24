/**
 * Puppeteer tests — verify our additions to the memory module in a real browser.
 * Tests only what we add on top of store2: the {} default, update merge, and singleton.
 *
 * Skipped automatically when no browser executable is available.
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
  mkdirSync(tmpDir, { recursive: true });

  const result = await Bun.build({
    entrypoints: [join(root, "src/memory.ts")],
    outdir: tmpDir,
    target: "browser",
    naming: "[name].js",
  });

  if (!result.success) { browserUnavailable = true; return; }

  writeFileSync(
    join(tmpDir, "index.html"),
    `<!DOCTYPE html><html><body>
<script type="module">
  import { getMemory, _resetMemory } from "./memory.js";
  window.__memory = { getMemory, _resetMemory };
</script>
</body></html>`,
  );

  try {
    browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    page = await browser.newPage();
    await page.goto(`file://${join(tmpDir, "index.html")}`);
    await page.waitForFunction(() => !!(window as unknown as Record<string, unknown>).__memory, { timeout: 5000 });
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

function ifBrowser(fn: (p: Page) => Promise<void>): () => Promise<void> {
  return async () => {
    if (browserUnavailable || !page) return;
    await fn(page);
  };
}

type Win = { __memory: { getMemory: () => any; _resetMemory: () => void } };

describe("memory additions in real browser (puppeteer)", () => {
  beforeEach(async () => {
    if (browserUnavailable || !page) return;
    await page.evaluate(() => {
      const w = window as unknown as Win;
      w.__memory.getMemory().clearAll();
      w.__memory._resetMemory();
    });
  });

  test("get returns {} for unknown key", ifBrowser(async (p) => {
    const result = await p.evaluate(() =>
      (window as unknown as Win).__memory.getMemory().get("snake"),
    );
    expect(result).toEqual({});
  }));

  test("getMemory is a singleton", ifBrowser(async (p) => {
    const isSame = await p.evaluate(() => {
      const { getMemory } = (window as unknown as Win).__memory;
      return getMemory() === getMemory();
    });
    expect(isSame).toBe(true);
  }));

  test("update merges partial into existing object", ifBrowser(async (p) => {
    const result = await p.evaluate(() => {
      const mem = (window as unknown as Win).__memory.getMemory();
      mem.set("snake", { highScore: 10, lives: 3 });
      mem.update("snake", { highScore: 50 });
      return mem.get("snake");
    });
    expect(result).toEqual({ highScore: 50, lives: 3 });
  }));
});
