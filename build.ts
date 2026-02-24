import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const outDir = "build";

// 1. Bundle with Bun's HTML bundler
const result = await Bun.build({
  entrypoints: ["src/index.html"],
  outdir: outDir,
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

// 2. Read the bundled HTML
const htmlPath = join(outDir, "index.html");
let html = readFileSync(htmlPath, "utf8");

// 3. Inline linked stylesheets — replace <link rel="stylesheet" href="..."> with <style>...</style>
html = html.replace(/<link\b([^>]*)>/gi, (tag, attrs: string) => {
  if (!/rel=["']stylesheet["']/i.test(attrs)) return tag;
  const m = attrs.match(/href=["']([^"']+)["']/i);
  if (!m) return tag;
  const filePath = join(outDir, m[1].replace(/^\.\//, ""));
  const css = readFileSync(filePath, "utf8");
  rmSync(filePath);
  return `<style>${css}</style>`;
});

// 4. Inline external scripts — replace <script src="..."></script> with <script>...</script>
html = html.replace(/<script\b([^>]*)><\/script>/gi, (_, attrs: string) => {
  const m = attrs.match(/src=["']([^"']+)["']/i);
  if (!m) return _;
  const filePath = join(outDir, m[1].replace(/^\.\//, ""));
  const js = readFileSync(filePath, "utf8");
  rmSync(filePath);
  const newAttrs = attrs.replace(/\s*src=["'][^"']*["']/, "").trim();
  return `<script${newAttrs ? ` ${newAttrs}` : ""}>${js}</script>`;
});

// 5. Write the final single-file HTML back
writeFileSync(htmlPath, html);
console.log("build complete → build/index.html (CSS and JS inlined)");
