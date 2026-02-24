# Feature: setup-browser-memory

## Git

- Branch: `claude/setup-browser-memory-eBSQq`
- Base: `master`
- Strategy: feature branch

## Requirements

### Problem

Games need a way to persist data (high scores, settings) across browser sessions.
No storage layer exists yet; each page load starts completely fresh.

### Decisions

- Wrap `localStorage` in a typed module (`src/memory.ts`) rather than calling it directly from games
- Accept an injectable `Storage`-like interface so tests can supply a mock without touching real `localStorage`
- Key stored under `"arctui-games"` as a single JSON blob keyed by game name
- Only the high-score primitive is needed now; the shape can be extended per-game later
- No external dependencies; pure TypeScript using the DOM lib already in `tsconfig.json`

### Success metrics

- `src/memory.ts` exports `createMemory(storage?)` factory and a default `memory` singleton
- `test/memory.test.ts` covers get/set/clear and multi-game isolation using a mock storage
- `bun test` passes (all new tests green, existing build tests still pass)
- `bun run typecheck` passes (strict mode, no errors)

## Implementation Plan

| # | Task | Status |
|---|------|--------|
| 1 | Create `src/memory.ts` with `createMemory` factory + `memory` singleton | done |
| 2 | Create `test/memory.test.ts` with mock-storage unit tests | done |
| 3 | Verify `bun test` and `bun run typecheck` pass | done |
| 4 | Update this feature file | done |
| 5 | Commit + push | in-progress |

## Session log

- 2026-02-24: Feature scaffolded. `src/memory.ts` and `test/memory.test.ts` created; all tests pass.
