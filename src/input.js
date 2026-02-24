/**
 * Keyboard input abstraction.
 *
 * Normalises raw KeyboardEvents into a simpler event object and dispatches
 * them to registered listeners.
 *
 * API
 *   on(key, handler)   — subscribe; key is a KeyboardEvent.key value or '*'
 *   off(key, handler)  — unsubscribe
 *   destroy()          — remove DOM listeners
 */

export class Input {
  constructor() {
    this._listeners = new Map(); // key → Set<handler>
    this._onKeyDown = this._handleKeyDown.bind(this);
    window.addEventListener('keydown', this._onKeyDown);
  }

  on(key, handler) {
    if (!this._listeners.has(key)) this._listeners.set(key, new Set());
    this._listeners.get(key).add(handler);
  }

  off(key, handler) {
    this._listeners.get(key)?.delete(handler);
  }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    this._listeners.clear();
  }

  _handleKeyDown(e) {
    // Prevent browser shortcuts from interfering with game keys
    const blocked = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '];
    if (blocked.includes(e.key)) e.preventDefault();

    const event = { key: e.key, ctrl: e.ctrlKey, shift: e.shiftKey, alt: e.altKey };

    this._listeners.get(e.key)?.forEach(h => h(event));
    this._listeners.get('*')?.forEach(h => h(event));
  }
}
