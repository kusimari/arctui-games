/**
 * Game registry.
 *
 * Each entry maps a slug to a game module path and display name.
 * Games are lazy-loaded when selected.
 *
 * Shape:
 *   {
 *     slug:    string,          // URL-safe identifier
 *     name:    string,          // display name shown in menu
 *     load:    () => Promise,   // dynamic import returning { Game }
 *   }
 *
 * Example (add games here as they are implemented):
 *
 *   {
 *     slug: 'snake',
 *     name: 'Snake',
 *     load: () => import('./snake/index.js'),
 *   },
 */

export const games = [
  // games will be registered here
];
