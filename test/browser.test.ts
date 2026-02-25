import { test, expect, beforeAll, afterAll } from "bun:test";
import puppeteer, { type Browser, type Page } from "puppeteer";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const htmlPath = join(root, "build", "index.html");

/**
 * Locate a Chrome/Chromium binary.
 * Respects PUPPETEER_EXECUTABLE_PATH (set by CI or the developer) then
 * falls back to common system locations on Linux and macOS.
 */
function findChrome(): string | null {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    process.env.CHROME_PATH,
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/snap/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].filter(Boolean) as string[];
  return candidates.find((p) => existsSync(p)) ?? null;
}

const chromePath = findChrome();
const hasChrome = chromePath !== null;

let browser: Browser;
let page: Page;
const consoleErrors: string[] = [];
const pageErrors: Error[] = [];

beforeAll(async () => {
  // Ensure build/index.html is up to date.
  const result = Bun.spawnSync(["bun", "run", "build"], { cwd: root });
  if (result.exitCode !== 0) {
    throw new Error(`Build failed:\n${result.stderr.toString()}`);
  }

  if (!hasChrome) return;

  browser = await puppeteer.launch({
    executablePath: chromePath!,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    headless: true,
  });

  page = await browser.newPage();
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => pageErrors.push(err));

  await page.goto(`file://${htmlPath}`);
  // Wait for React to mount the header before running assertions.
  await page.waitForSelector("header", { timeout: 5000 });
}, 30_000);

afterAll(async () => {
  if (!hasChrome) return;
  await page?.close();
  await browser?.close();
});

test("page loads without JS console errors", () => {
  if (!hasChrome) {
    console.log("[browser] skipped — no Chrome found; set PUPPETEER_EXECUTABLE_PATH to enable");
    return;
  }
  expect(consoleErrors).toEqual([]);
});

test("page has no uncaught page errors", () => {
  if (!hasChrome) return;
  expect(pageErrors).toEqual([]);
});

test("header is rendered in the DOM", async () => {
  if (!hasChrome) return;
  const header = await page.$("header");
  expect(header).not.toBeNull();
});
