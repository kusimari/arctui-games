/**
 * arctui-games — bootstrap
 *
 * 1. Creates the Renderer and sizes it to fit the viewport.
 * 2. Creates the Input handler.
 * 3. Draws a splash screen with the game list.
 * 4. Starts the rAF game loop.
 */

import { Renderer } from './renderer.js';
import { Input } from './input.js';
import { games } from './games/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Compute how many columns and rows fit in the viewport. */
function viewportCells() {
  const cellW = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell-width')) || 9.6;
  const cellH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell-height')) || 19.2;
  return {
    cols: Math.floor(window.innerWidth / cellW),
    rows: Math.floor(window.innerHeight / cellH),
  };
}

/** Centre-align a string within `width` using padding. */
function centre(str, width) {
  const pad = Math.max(0, Math.floor((width - str.length) / 2));
  return ' '.repeat(pad) + str;
}

/** Write a string into the renderer at (x, y). */
function writeStr(renderer, x, y, str, fg, bg) {
  for (let i = 0; i < str.length; i++) {
    renderer.put(x + i, y, str[i], fg, bg);
  }
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const renderer = new Renderer('grid');
const input = new Input();

let activeGame = null;
let selectedIndex = 0;

// ---------------------------------------------------------------------------
// Splash / menu
// ---------------------------------------------------------------------------

function drawMenu() {
  const { cols, rows } = renderer;
  const FG = 'var(--color-fg)';
  const BG = 'var(--color-bg)';
  const ACCENT = 'var(--color-accent)';
  const DIM = 'var(--color-dim)';

  renderer.clear();

  const title = 'A R C T U I  G A M E S';
  writeStr(renderer, 0, 1, centre(title, cols), ACCENT, BG);

  const subtitle = 'arcade games — terminal style';
  writeStr(renderer, 0, 2, centre(subtitle, cols), DIM, BG);

  // horizontal rule
  const rule = '─'.repeat(cols);
  writeStr(renderer, 0, 4, rule, DIM, BG);

  if (games.length === 0) {
    const msg = '(no games registered yet)';
    writeStr(renderer, 0, 6, centre(msg, cols), DIM, BG);
  } else {
    games.forEach((game, i) => {
      const prefix = i === selectedIndex ? '▶ ' : '  ';
      const line = prefix + game.name;
      const fg = i === selectedIndex ? ACCENT : FG;
      writeStr(renderer, 0, 6 + i, centre(line, cols), fg, BG);
    });

    writeStr(renderer, 0, rows - 2, centre('↑ ↓  navigate    Enter  select', cols), DIM, BG);
  }

  renderer.flush();
}

// ---------------------------------------------------------------------------
// Game loop
// ---------------------------------------------------------------------------

let lastTime = 0;

function loop(timestamp) {
  const dt = timestamp - lastTime;
  lastTime = timestamp;

  if (activeGame) {
    activeGame.update(dt);
    activeGame.render(renderer);
    renderer.flush();
  } else {
    drawMenu();
  }

  requestAnimationFrame(loop);
}

// ---------------------------------------------------------------------------
// Input wiring
// ---------------------------------------------------------------------------

input.on('ArrowUp', () => {
  if (!activeGame && games.length > 0) {
    selectedIndex = (selectedIndex - 1 + games.length) % games.length;
  }
});

input.on('ArrowDown', () => {
  if (!activeGame && games.length > 0) {
    selectedIndex = (selectedIndex + 1) % games.length;
  }
});

input.on('Enter', async () => {
  if (!activeGame && games.length > 0) {
    const entry = games[selectedIndex];
    const { Game } = await entry.load();
    activeGame = new Game();
    activeGame.init(renderer, input);
  }
});

input.on('Escape', () => {
  if (activeGame) {
    activeGame.destroy();
    activeGame = null;
    renderer.clear();
  }
});

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

function init() {
  const { cols, rows } = viewportCells();
  renderer.resize(cols, rows);
  requestAnimationFrame(loop);
}

window.addEventListener('resize', () => {
  const { cols, rows } = viewportCells();
  renderer.resize(cols, rows);
  if (!activeGame) drawMenu();
});

init();
