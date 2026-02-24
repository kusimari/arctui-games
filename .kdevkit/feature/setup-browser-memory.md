# Feature: setup-browser-memory

## Git

- Branch: `claude/setup-browser-memory-eBSQq`
- Base: `master`
- Strategy: feature branch

## Requirements

### Problem

Games need a way to persist data (high scores, settings) across browser sessions.
No storage layer exists yet; each page load starts completely fresh.

### Interface

- `getMemory(storage?)` — singleton factory; returns same `BrowserMemory` instance on every call.
  On first call it creates the instance (using `localStorage` by default or an injected `StorageLike`).
  Subsequent calls return the cached instance regardless of argument.
- `BrowserMemory` interface:
  - `get<T>(key)` — returns the stored object for key, or `{}` if none exists
  - `set<T>(key, value)` — stores value under key (replaces existing)
  - `update<T>(key, partial)` — merges partial into existing object (creates `{}` base if absent)
  - `delete(key)` — removes the stored object for key
- Each game defines its own storage object shape; the default is `{}` (empty object)
- `createMemory(storage)` — factory with explicit storage injection, used by test doubles
- `_resetMemory()` — clears the singleton; test-only helper

### Decisions

- Wrap `localStorage` in a typed module rather than calling it directly from games
- `StorageLike` interface makes the storage injectable — tests supply a mock, no real `localStorage` needed
- `puppeteer` is added as a devDependency for real-browser integration tests; unit tests use a test double
- Puppeteer tests skip gracefully when no browser executable is available

### Success metrics

- `src/memory.ts` exports `BrowserMemory`, `StorageLike`, `createMemory`, `getMemory`, `_resetMemory`
- `test/memory.test.ts` covers full behaviour with a `makeStorageDouble()` test double
- `test/memory.puppeteer.test.ts` runs the same scenarios in real Chromium (skips if unavailable)
- `bun test` — all 26 tests pass
- `bun run typecheck` — clean (strict mode, no errors)

## Implementation Plan

| # | Task | Status |
|---|------|--------|
| 1 | Design `BrowserMemory` interface and `createMemory` / `getMemory` factory | done |
| 2 | Implement `src/memory.ts` | done |
| 3 | Rewrite `test/memory.test.ts` with `makeStorageDouble()` test double | done |
| 4 | Add `puppeteer` devDependency | done |
| 5 | Create `test/memory.puppeteer.test.ts` (skip-safe when no browser) | done |
| 6 | Verify `bun test` (26 pass) and `bun run typecheck` (clean) | done |
| 7 | Commit + push | done |

## Session log

- 2026-02-24 (init): Feature scaffolded with initial `getHighScore`/`setHighScore` API.
- 2026-02-24 (revision): Redesigned to generic `get`/`set`/`update`/`delete` interface with singleton
  `getMemory()`, injectable storage double, and puppeteer integration tests.
