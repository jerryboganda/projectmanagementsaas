"use client";

import { useCallback, useRef, useState } from "react";

interface UseKeyboardNavigationOptions {
  itemCount: number;
  orientation?: "horizontal" | "vertical" | "both";
  loop?: boolean;
  onSelect?: (index: number) => void;
  onEscape?: () => void;
}

interface UseKeyboardNavigationReturn {
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  getItemProps: (index: number) => {
    tabIndex: number;
    "aria-selected": boolean;
    onKeyDown: (e: React.KeyboardEvent) => void;
    onFocus: () => void;
    ref: (el: HTMLElement | null) => void;
  };
  containerProps: {
    role: string;
  };
}

export function useKeyboardNavigation(
  options: UseKeyboardNavigationOptions
): UseKeyboardNavigationReturn {
  const {
    itemCount,
    orientation = "vertical",
    loop = true,
    onSelect,
    onEscape,
  } = options;

  const [activeIndex, setActiveIndex] = useState(0);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  const focusItem = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, itemCount - 1));
      setActiveIndex(clamped);
      itemRefs.current[clamped]?.focus();
    },
    [itemCount]
  );

  const moveNext = useCallback(() => {
    if (activeIndex < itemCount - 1) {
      focusItem(activeIndex + 1);
    } else if (loop) {
      focusItem(0);
    }
  }, [activeIndex, itemCount, loop, focusItem]);

  const movePrev = useCallback(() => {
    if (activeIndex > 0) {
      focusItem(activeIndex - 1);
    } else if (loop) {
      focusItem(itemCount - 1);
    }
  }, [activeIndex, itemCount, loop, focusItem]);

  const moveFirst = useCallback(() => focusItem(0), [focusItem]);
  const moveLast = useCallback(
    () => focusItem(itemCount - 1),
    [focusItem, itemCount]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const isVertical = orientation === "vertical" || orientation === "both";
      const isHorizontal =
        orientation === "horizontal" || orientation === "both";

      switch (e.key) {
        case "ArrowDown":
          if (isVertical) {
            e.preventDefault();
            moveNext();
          }
          break;
        case "ArrowUp":
          if (isVertical) {
            e.preventDefault();
            movePrev();
          }
          break;
        case "ArrowRight":
          if (isHorizontal) {
            e.preventDefault();
            moveNext();
          }
          break;
        case "ArrowLeft":
          if (isHorizontal) {
            e.preventDefault();
            movePrev();
          }
          break;
        case "Home":
          e.preventDefault();
          moveFirst();
          break;
        case "End":
          e.preventDefault();
          moveLast();
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          onSelect?.(activeIndex);
          break;
        case "Escape":
          e.preventDefault();
          onEscape?.();
          break;
      }
    },
    [
      orientation,
      activeIndex,
      moveNext,
      movePrev,
      moveFirst,
      moveLast,
      onSelect,
      onEscape,
    ]
  );

  const getItemProps = useCallback(
    (index: number) => ({
      tabIndex: index === activeIndex ? 0 : -1,
      "aria-selected": index === activeIndex,
      onKeyDown: handleKeyDown,
      onFocus: () => setActiveIndex(index),
      ref: (el: HTMLElement | null) => {
        itemRefs.current[index] = el;
      },
    }),
    [activeIndex, handleKeyDown]
  );

  const containerProps = {
    role: "listbox",
  };

  return { activeIndex, setActiveIndex, getItemProps, containerProps };
}
