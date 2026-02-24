# Feature: initial-setup

## Git

- Branch: `claude/initial-setup-yfjWv`
- Base: `master`
- Strategy: feature branch

## Requirements

### Problem
The repository is empty. We need a working build pipeline and a minimal page before any game work can begin.

### Decisions
- TypeScript throughout; Bun handles transpilation at bundle time
- `src/` for source, `test/` for tests — standard Node project layout
- `bun build src/index.html --outdir build` produces a self-contained SPA
- CSS and JS are bundled into the output by Bun's HTML entry-point support
- `build/` is gitignored; the GitHub Action is the only thing that publishes it
- GitHub Pages deployment: push to `main` → build → upload `build/` directory

### Success metrics
- `bun run build` produces a working `build/index.html` with inlined assets
- Page shows: header "arctui by kusimari", blank body, footer linking to GitHub
- GitHub Action deploys to Pages on every push to `main`
- `bun test` runs (zero tests is fine at this stage)
- `bun run typecheck` passes

## Implementation Plan

| # | Task | Status |
|---|------|--------|
| 1 | Remove old JS scaffold (public/, src/*.js) | done |
| 2 | `src/index.html` — header / blank / footer | done |
| 3 | `src/style.css` — terminal theme | done |
| 4 | `src/index.ts` — placeholder entry | done |
| 5 | `tsconfig.json` | done |
| 6 | `package.json` — bun build + test scripts | done |
| 7 | `test/.gitkeep` — test directory | done |
| 8 | `.gitignore` — exclude `build/` | done |
| 9 | `.github/workflows/publish.yml` — Pages action | done |
| 10 | Update `.kdevkit/` context files | done |
| 11 | Commit + push | in-progress |

## Session log

- 2026-02-24: Initial scaffold committed (renderer/input/games JS, plain HTML).
- 2026-02-24: Restructured — TypeScript, Bun bundler, simplified page, GitHub Action.
