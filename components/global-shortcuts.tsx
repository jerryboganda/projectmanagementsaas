"use client";

import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

/**
 * Invisible component that activates global keyboard shortcuts.
 * Rendered inside Providers so shortcuts work on every page.
 */
export function GlobalShortcuts() {
  useKeyboardShortcuts();
  return null;
}
