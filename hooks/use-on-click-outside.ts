'use client';

import { useEffect, type RefObject } from 'react';

type AnyEvent = MouseEvent | TouchEvent;

/**
 * Calls `handler` when a click/touch occurs outside the referenced element.
 * Commonly used for closing dropdowns, popovers, and modals.
 */
export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T | null>,
  handler: (event: AnyEvent) => void,
  options: { enabled?: boolean } = {},
) {
  const { enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const listener = (event: AnyEvent) => {
      const el = ref.current;
      if (!el || el.contains(event.target as Node)) return;
      handler(event);
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener, { passive: true });

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler, enabled]);
}
