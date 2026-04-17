"use client";

import { useState, useCallback, useMemo, type CSSProperties, type UIEvent } from "react";

interface UseVirtualListOptions {
  itemCount: number;
  itemHeight: number;
  overscan?: number;
  containerHeight: number;
}

interface VirtualItem {
  index: number;
  offset: number;
  size: number;
}

interface UseVirtualListReturn {
  virtualItems: VirtualItem[];
  totalHeight: number;
  containerProps: {
    style: CSSProperties;
    onScroll: (e: UIEvent<HTMLElement>) => void;
    ref: (el: HTMLElement | null) => void;
  };
  innerProps: {
    style: CSSProperties;
  };
}

export function useVirtualList(options: UseVirtualListOptions): UseVirtualListReturn {
  const { itemCount, itemHeight, overscan = 5, containerHeight } = options;

  const [scrollTop, setScrollTop] = useState(0);
  const [containerEl, setContainerEl] = useState<HTMLElement | null>(null);

  const totalHeight = itemCount * itemHeight;

  const virtualItems = useMemo<VirtualItem[]>(() => {
    if (containerHeight <= 0 || itemCount === 0) return [];

    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      itemCount - 1,
      Math.floor((scrollTop + containerHeight) / itemHeight)
    );

    const overscanStart = Math.max(0, startIndex - overscan);
    const overscanEnd = Math.min(itemCount - 1, endIndex + overscan);

    const items: VirtualItem[] = [];
    for (let i = overscanStart; i <= overscanEnd; i++) {
      items.push({
        index: i,
        offset: i * itemHeight,
        size: itemHeight,
      });
    }
    return items;
  }, [scrollTop, itemHeight, itemCount, containerHeight, overscan]);

  const handleScroll = useCallback((e: UIEvent<HTMLElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const ref = useCallback((el: HTMLElement | null) => {
    setContainerEl(el);
    if (el) {
      setScrollTop(el.scrollTop);
    }
  }, []);

  const containerProps = useMemo(
    () => ({
      style: {
        overflow: "auto" as const,
        position: "relative" as const,
        height: containerHeight,
      },
      onScroll: handleScroll,
      ref,
    }),
    [containerHeight, handleScroll, ref]
  );

  const innerProps = useMemo(
    () => ({
      style: {
        height: totalHeight,
        width: "100%",
        position: "relative" as const,
      },
    }),
    [totalHeight]
  );

  return { virtualItems, totalHeight, containerProps, innerProps };
}
