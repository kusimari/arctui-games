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

- Use `store2` as the storage backend — it handles cross-browser compat, JSON serialisation, and falls back to in-memory storage in non-browser environments (e.g. Bun test runner)
- `memory.ts` is a thin typed wrapper; we only write and test what store2 does not give us: the `{}` default, `update` merge logic, and the singleton
- `puppeteer` covers our additions in a real browser; unit tests cover them in Bun via store2's in-memory fallback
- If we adopt React later, the `BrowserMemory` interface stays the same; store2 is swapped for a reactive solution (e.g. zustand/persist) inside `memory.ts` only

### Success metrics

- `src/memory.ts` exports `BrowserMemory`, `getMemory`, `_resetMemory` (backed by store2)
- `test/memory.test.ts` tests only our additions (5 tests)
- `test/memory.puppeteer.test.ts` tests our additions in real Chromium (skips if unavailable)
- `bun test` — all 12 tests pass
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
- 2026-02-24 (store2): Replaced hand-rolled localStorage wrapper with store2. Removed StorageLike,
  createMemory, and makeStorageDouble. Tests now cover only our additions (singleton, {} default,
  update merge). store2's in-memory fallback means unit tests run in Bun without a test double.
