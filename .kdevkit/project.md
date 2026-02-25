# arctui-games — Project Context

## Purpose

A collection of classic arcade games rendered in the browser using a TUI (text user interface) aesthetic — monospace fonts, ASCII art, and keyboard-driven controls. "Web as TUI" means the browser is the delivery mechanism but the experience mimics a terminal.

## Stack

- **Language**: TypeScript (transpiled by Bun at build time)
- **Runtime**: Browser (no framework)
- **Bundler**: Bun — `bun build src/index.html --outdir build`
- **Tests**: `bun test` (files in `test/`, named `*.test.ts`)
- **Deploy**: GitHub Actions → GitHub Pages on push to `main`

## Directory Layout

```
arctui-games/
├── .github/
│   └── workflows/
│       └── publish.yml       ← builds + deploys to GitHub Pages
├── .kdevkit/
│   ├── project.md            ← this file
│   └── feature/              ← one .md per feature
├── src/
│   ├── index.html            ← bundler entry point (references .ts + .css)
│   ├── style.css             ← global styles
│   └── index.ts              ← TypeScript entry point
├── test/                     ← test files (*.test.ts), mirrors src/ structure
├── build/                    ← GITIGNORED — output of `bun run build`
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Build

```sh
bun run build      # bundle src/index.html → build/
bun run dev        # same with --watch
bun run typecheck  # tsc --noEmit
bun test           # run tests
```

The `build/` directory is **never committed**. The GitHub Action runs `bun run build` on every push to `main` and publishes the output to GitHub Pages.

## Conventions

- TypeScript strict mode throughout
- Source files in `src/`, test files in `test/`
- Each game will live in `src/games/<name>/index.ts` and export a `Game` class
- No external runtime dependencies (dev deps only)
- CSS custom properties for theming (`--color-fg`, `--color-bg`, `--color-accent`)
- **No try-catch**: do not use try-catch blocks. Functions return typed values directly. APIs and libraries that can throw should be wrapped at the boundary in a way that never surfaces exceptions — prefer libraries (like store2) whose sync API does not throw under normal operation.

## Status

Initial scaffold complete (feature: initial-setup). Page renders with header, blank body, and GitHub footer.
