/**
 * Puppeteer smoke-test for the built HTML.
 * Loads build/index.html in a headless browser and asserts that React
 * actually mounted something into #root (i.e. the bundle executed).
 */
import puppeteer from "puppeteer";
import { join } from "path";

const htmlPath = join(import.meta.dir, "..", "build", "index.html");
const url = `file://${htmlPath}`;

console.log("validate-build: loading", url);

const browser = await puppeteer.launch({
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

let exitCode = 0;

try {
  const page = await browser.newPage();

  const pageErrors: string[] = [];
  page.on("pageerror", (err) => pageErrors.push(err.message));

  const response = await page.goto(url, { waitUntil: "domcontentloaded" });
  if (!response?.ok() && response !== null) {
    // file:// URLs return null for response; any non-null non-ok is a problem
    console.error("FAIL: page load returned status", response?.status());
    exitCode = 1;
  } else {
    // Wait up to 5 s for React to mount at least one child into #root
    await page.waitForSelector("#root > *", { timeout: 5000 });

    const preview = await page.$eval("#root", (el) =>
      el.innerHTML.slice(0, 300)
    );
    console.log("PASS: React rendered into #root");
    console.log("      preview:", preview);

    if (pageErrors.length) {
      console.error("FAIL: uncaught page errors:");
      for (const e of pageErrors) console.error("  ", e);
      exitCode = 1;
    } else {
      console.log("validate-build: OK");
    }
  }
} catch (err) {
  console.error("FAIL:", err);
  exitCode = 1;
} finally {
  await browser.close();
}

process.exit(exitCode);
