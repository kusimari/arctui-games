# arctui-games — Project Context

## Purpose

A collection of classic arcade games rendered in the browser using a TUI (text user interface) aesthetic — monospace fonts, ASCII art, and keyboard-driven controls. "Web as TUI" means the browser is the delivery mechanism but the experience mimics a terminal.

## Stack

- **Runtime**: Browser (vanilla JS, no framework)
- **Renderer**: DOM-based TUI cells (character grid, CSS terminal styling)
- **Entry point**: `public/index.html` → `src/index.js`
- **Build**: none for MVP; plain ES modules via `<script type="module">`
- **Package management**: npm (dev tooling only)

## Directory Layout

```
arctui-games/
├── .kdevkit/
│   ├── project.md          ← this file
│   └── feature/            ← one .md per feature
├── public/
│   ├── index.html          ← shell page
│   └── style.css           ← terminal theme
├── src/
│   ├── index.js            ← bootstraps renderer + game loop
│   ├── renderer.js         ← draws a character-grid to the DOM
│   ├── input.js            ← keyboard event abstraction
│   └── games/
│       └── index.js        ← game registry / router
├── package.json
└── README.md
```

## Conventions

- ES modules throughout; no CommonJS
- Each game lives in `src/games/<name>/index.js` and exports a `Game` class
- `Game` interface: `{ init(renderer), update(dt), render(renderer), destroy() }`
- Renderer exposes: `put(x, y, char, fg, bg)`, `clear()`, `flush()`
- Colours are named CSS custom properties (`--color-fg`, `--color-bg`, `--color-accent`)
- No external runtime dependencies for MVP

## Status

Initial scaffold in progress (feature: initial-setup).
