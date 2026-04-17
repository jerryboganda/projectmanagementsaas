"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  root?: Element | null;
  enabled?: boolean;
}

interface UseIntersectionObserverReturn {
  ref: (element: Element | null) => void;
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn {
  const { threshold = 0, rootMargin = "0px", root = null, enabled = true } = options;

  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<Element | null>(null);

  const cleanup = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  const observe = useCallback(() => {
    cleanup();

    if (
      !enabled ||
      !elementRef.current ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }

    observerRef.current = new IntersectionObserver(
      ([observedEntry]) => {
        setEntry(observedEntry);
      },
      { threshold, rootMargin, root }
    );

    observerRef.current.observe(elementRef.current);
  }, [enabled, threshold, rootMargin, root, cleanup]);

  // Callback ref pattern — runs whenever the observed element mounts/unmounts
  const ref = useCallback(
    (element: Element | null) => {
      elementRef.current = element;
      if (element) {
        observe();
      } else {
        cleanup();
        setEntry(null);
      }
    },
    [observe, cleanup]
  );

  // Re-observe when options change
  useEffect(() => {
    if (elementRef.current) {
      observe();
    }
    return cleanup;
  }, [observe, cleanup]);

  return {
    ref,
    isIntersecting: entry?.isIntersecting ?? false,
    entry,
  };
}
