# Feature: initial-setup

## Git

- Branch: `claude/initial-setup-yfjWv`
- Base: `master`
- Strategy: feature branch

## Requirements

### Problem
The repository is empty (LICENSE + README only). Before any game can be built, a coherent project scaffold must exist: directory structure, module conventions, a working renderer, input handling, and an HTML shell that loads everything.

### User interactions
- Developer clones the repo and runs `npx serve public/` (or any static server) to see the TUI shell in the browser.
- Keyboard input is already wired through `src/input.js`.
- The renderer draws a character grid to the DOM; individual games will call its API.

### Success metrics
- `public/index.html` loads without errors in a modern browser.
- `src/renderer.js` can `put()`, `clear()`, and `flush()` a character grid.
- `src/input.js` emits keyboard events that games can subscribe to.
- `src/games/index.js` exports an empty game registry ready for entries.
- `src/index.js` bootstraps the renderer, registers games, and starts the loop.

### Constraints
- No build step for MVP — plain ES modules, no bundler.
- No external runtime dependencies.
- Must work in Chromium and Firefox latest.

## Design

### Integration
Standalone browser app. No backend. Files served statically.

### Technology
Vanilla ES modules. CSS custom properties for theming. `requestAnimationFrame` game loop.

### Renderer approach
A `<pre>` element containing a flat array of `<span>` elements, one per cell. `put(x, y, char, fg, bg)` stages a cell update; `flush()` writes all staged changes to the DOM in one pass to minimise reflow.

### Data structures
- `cells[y][x] = { char, fg, bg }` — current frame buffer
- `dirty` — Set of `"x,y"` keys changed since last flush

### No alternatives considered for MVP — simplicity wins.

## Testing

- Manual: open `public/index.html`, verify grid renders and keyboard events log to console.
- Unit tests deferred to later features; test harness will be set up in a dedicated `testing-setup` feature.

## Implementation Plan

| # | Task | Status |
|---|------|--------|
| 1 | Create `.kdevkit/` context files | done |
| 2 | `package.json` with name, version, scripts | done |
| 3 | `public/index.html` shell | done |
| 4 | `public/style.css` terminal theme | done |
| 5 | `src/renderer.js` character-grid renderer | done |
| 6 | `src/input.js` keyboard abstraction | done |
| 7 | `src/games/index.js` empty registry | done |
| 8 | `src/index.js` bootstrap | done |
| 9 | Commit + push | in-progress |

## Session log

- 2026-02-24: Feature file created; scaffold implementation complete.
