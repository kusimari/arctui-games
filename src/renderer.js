/**
 * DOM-based character-grid renderer.
 *
 * The grid is a <pre id="grid"> element. Each cell is a <span> whose
 * text content is a single character. Colours are applied as inline styles.
 *
 * API
 *   put(x, y, char, fg?, bg?)  — stage a cell update
 *   clear(fg?, bg?)            — stage a full-grid blank
 *   flush()                    — write all staged changes to the DOM
 *   resize(cols, rows)         — rebuild the grid at the new dimensions
 */

const DEFAULT_FG = 'var(--color-fg)';
const DEFAULT_BG = 'var(--color-bg)';
const BLANK = ' ';

export class Renderer {
  constructor(elementId = 'grid') {
    this._el = document.getElementById(elementId);
    if (!this._el) throw new Error(`Renderer: element #${elementId} not found`);

    this._cols = 0;
    this._rows = 0;
    this._cells = [];   // _cells[y][x] = { el, char, fg, bg }
    this._dirty = new Set();
  }

  /** Rebuild the DOM grid to cols × rows. */
  resize(cols, rows) {
    this._cols = cols;
    this._rows = rows;
    this._cells = [];
    this._dirty.clear();

    const fragment = document.createDocumentFragment();

    for (let y = 0; y < rows; y++) {
      const row = [];
      for (let x = 0; x < cols; x++) {
        const span = document.createElement('span');
        span.textContent = BLANK;
        fragment.appendChild(span);
        row.push({ el: span, char: BLANK, fg: DEFAULT_FG, bg: DEFAULT_BG });
      }
      // newline between rows (except last)
      if (y < rows - 1) fragment.appendChild(document.createTextNode('\n'));
      this._cells.push(row);
    }

    this._el.textContent = '';
    this._el.appendChild(fragment);
  }

  /** Stage a single cell update. Out-of-bounds calls are silently ignored. */
  put(x, y, char, fg = DEFAULT_FG, bg = DEFAULT_BG) {
    if (x < 0 || y < 0 || x >= this._cols || y >= this._rows) return;
    const cell = this._cells[y][x];
    if (cell.char !== char || cell.fg !== fg || cell.bg !== bg) {
      cell.char = char;
      cell.fg = fg;
      cell.bg = bg;
      this._dirty.add(`${x},${y}`);
    }
  }

  /** Stage blanking every cell. */
  clear(fg = DEFAULT_FG, bg = DEFAULT_BG) {
    for (let y = 0; y < this._rows; y++) {
      for (let x = 0; x < this._cols; x++) {
        this.put(x, y, BLANK, fg, bg);
      }
    }
  }

  /** Flush all staged changes to the DOM in one pass. */
  flush() {
    for (const key of this._dirty) {
      const [x, y] = key.split(',').map(Number);
      const cell = this._cells[y][x];
      const el = cell.el;
      el.textContent = cell.char;
      el.style.color = cell.fg;
      el.style.background = cell.bg;
    }
    this._dirty.clear();
  }

  get cols() { return this._cols; }
  get rows() { return this._rows; }
}
