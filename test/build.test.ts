import { test, expect, beforeAll } from "bun:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const buildDir = join(root, "build");

beforeAll(() => {
  const result = Bun.spawnSync(["bun", "run", "build"], { cwd: root });
  if (result.exitCode !== 0) {
    throw new Error(`Build failed:\n${result.stderr.toString()}`);
  }
});

test("build/index.html is produced", () => {
  expect(existsSync(join(buildDir, "index.html"))).toBe(true);
});

test("build/ contains a bundled CSS file", () => {
  const files = readdirSync(buildDir);
  expect(files.some((f) => f.endsWith(".css"))).toBe(true);
});

test("build/ contains a bundled JS file", () => {
  const files = readdirSync(buildDir);
  expect(files.some((f) => f.endsWith(".js"))).toBe(true);
});

test("build/index.html links the bundled CSS", () => {
  const html = readFileSync(join(buildDir, "index.html"), "utf8");
  expect(html).toMatch(/<link[^>]+rel="stylesheet"/);
});

test("build/index.html includes a module script", () => {
  const html = readFileSync(join(buildDir, "index.html"), "utf8");
  expect(html).toMatch(/<script[^>]+type="module"/);
});
