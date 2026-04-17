/**
 * next/font shim. Returns inert font objects so shared components
 * that call next/font loaders don't crash in the Vite bundle.
 * System fonts are used on mobile; real fonts should be bundled as
 * static assets and loaded via @font-face in globals.css.
 */

type FontResult = {
  className: string;
  style: { fontFamily: string };
  variable: string;
};

const noop = (): FontResult => ({
  className: '',
  style: { fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif' },
  variable: '--font-sans',
});

// Default export used by next/font/local
export default noop;

// Named exports mirror Google font factories (Inter, Roboto, etc.).
// Any dynamic access returns the same inert font.
export const Inter = noop;
export const Roboto = noop;
export const Geist = noop;
export const Geist_Mono = noop;
