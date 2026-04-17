/**
 * Reduced-motion hook for the mobile WebView. Listens to the OS-level
 * `prefers-reduced-motion` media query so Motion components can respond
 * via the global <MotionConfig reducedMotion="user"> provider.
 */

import { useSyncExternalStore } from 'react';

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  );
}
