import { test, expect, beforeAll } from "bun:test";
import { existsSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const buildDir = join(root, "build");

beforeAll(() => {
  // Start from a clean slate so the test is not affected by prior builds
  if (existsSync(buildDir)) rmSync(buildDir, { recursive: true });

  const result = Bun.spawnSync(["bun", "run", "build"], { cwd: root });
  if (result.exitCode !== 0) {
    throw new Error(`Build failed:\n${result.stderr.toString()}`);
  }
});

test("build/index.html is produced", () => {
  expect(existsSync(join(buildDir, "index.html"))).toBe(true);
});

test("build/ contains only index.html (CSS and JS are inlined, not separate files)", () => {
  const files = readdirSync(buildDir);
  expect(files).toEqual(["index.html"]);
});

test("build/index.html has CSS inlined as <style>", () => {
  const html = readFileSync(join(buildDir, "index.html"), "utf8");
  // Parse as DOM to check actual elements, not raw text — avoids false positives
  // from JS bundle content (e.g. React 19's internal stylesheet preloading API
  // strings like "link[rel=stylesheet]" that appear inside the inlined script).
  const doc = new DOMParser().parseFromString(html, "text/html");
  expect(doc.querySelector("style")).not.toBeNull();
  expect(doc.querySelector('link[rel="stylesheet"]')).toBeNull();
});

test("build/index.html has JS inlined (no external script src)", () => {
  const html = readFileSync(join(buildDir, "index.html"), "utf8");
  expect(html).toMatch(/<script/);
  expect(html).not.toMatch(/<script[^>]+src=/);
});
