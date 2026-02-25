import { test, expect, beforeAll, afterAll } from "bun:test";
import puppeteer, { type Browser, type Page } from "puppeteer";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const htmlPath = join(root, "build", "index.html");

/**
 * Locate a Chrome/Chromium binary.
 * Priority:
 *  1. PUPPETEER_EXECUTABLE_PATH / CHROME_PATH env vars
 *  2. Common system paths
 *  3. Playwright's local cache (populated by `npx playwright install chromium`)
 */
function findChrome(): string | null {
  const explicit = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_PATH,
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/snap/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter(Boolean) as string[];

  for (const p of explicit) {
    if (existsSync(p)) return p;
  }

  // Fall back to whatever playwright downloaded into ~/.cache/ms-playwright
  const playwrightCache = join(
    process.env.HOME ?? process.env.USERPROFILE ?? "/root",
    ".cache",
    "ms-playwright"
  );
  if (existsSync(playwrightCache)) {
    // Sort descending so the newest chromium version wins
    const entries = readdirSync(playwrightCache).sort().reverse();
    for (const entry of entries) {
      const candidates = [
        join(playwrightCache, entry, "chrome-linux", "chrome"),
        join(playwrightCache, entry, "chrome-mac", "Chromium.app", "Contents", "MacOS", "Chromium"),
        join(playwrightCache, entry, "chrome-win", "chrome.exe"),
      ];
      for (const p of candidates) {
        if (existsSync(p)) return p;
      }
    }
  }

  return null;
}

const chromePath = findChrome();
if (!chromePath) throw new Error(
  "No Chrome/Chromium found. Run `npx playwright install chromium` or set PUPPETEER_EXECUTABLE_PATH."
);

let browser: Browser;
let page: Page;
const consoleErrors: string[] = [];
const pageErrors: Error[] = [];

beforeAll(async () => {
  // Ensure the build is up to date before loading it in the browser.
  const result = Bun.spawnSync(["bun", "run", "build"], { cwd: root });
  if (result.exitCode !== 0) {
    throw new Error(`Build failed:\n${result.stderr.toString()}`);
  }

  browser = await puppeteer.launch({
    executablePath: chromePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    headless: true,
  });

  page = await browser.newPage();

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(err));

  await page.goto(`file://${htmlPath}`);
  // Wait until React has mounted the header.
  await page.waitForSelector("header", { timeout: 5000 });
}, 30_000);

afterAll(async () => {
  await page?.close();
  await browser?.close();
});

test("no JS console errors on load", () => {
  expect(consoleErrors).toEqual([]);
});

test("no uncaught page errors on load", () => {
  expect(pageErrors).toEqual([]);
});

test('page <title> is "arctui"', async () => {
  const title = await page.title();
  expect(title).toBe("arctui");
});

test("<header> is present in the DOM", async () => {
  const header = await page.$("header");
  expect(header).not.toBeNull();
});

test("header contains the app label", async () => {
  const text = await page.$eval("header", (el) => el.textContent ?? "");
  expect(text).toContain("arctui by kusimari");
});

test("username input is rendered when no name is stored", async () => {
  const input = await page.$('input[aria-label="username"]');
  expect(input).not.toBeNull();
});

test("all scripts are inlined — no external src= on <script> tags", async () => {
  const external = await page.$$eval("script[src]", (els) => els.map((el) => el.getAttribute("src")));
  expect(external).toEqual([]);
});

test("all styles are inlined — no external <link rel=stylesheet>", async () => {
  const links = await page.$$eval('link[rel="stylesheet"]', (els) => els.map((el) => el.getAttribute("href")));
  expect(links).toEqual([]);
});
