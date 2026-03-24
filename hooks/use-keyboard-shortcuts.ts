"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

export function useKeyboardShortcuts() {
  const router = useRouter();
  const gPending = useRef(false);
  const gTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs, textareas, selects, or contentEditable
    const target = e.target as HTMLElement;
    if (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.isContentEditable
    ) {
      // Exception: Escape always works
      if (e.key === "Escape") {
        (target as HTMLInputElement).blur?.();
        window.dispatchEvent(new CustomEvent("close-panel"));
        return;
      }
      return;
    }

    // Handle "g then X" sequences
    if (gPending.current) {
      gPending.current = false;
      if (gTimer.current) clearTimeout(gTimer.current);
      
      const goRoutes: Record<string, string> = {
        p: "/projects",
        b: "/board",
        c: "/calendar",
        g: "/goals",
        i: "/inbox",
        s: "/settings",
        t: "/timeline",
        w: "/workload",
        d: "/docs",
        r: "/reports",
        o: "/portfolio",
        n: "/sprints",
        a: "/automations",
        h: "/time-tracking",
        f: "/intake",
        m: "/templates",
      };

      if (goRoutes[e.key]) {
        e.preventDefault();
        router.push(goRoutes[e.key]);
        return;
      }
    }

    // Single-key shortcuts
    switch (e.key) {
      case "c":
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("open-create-task"));
        break;
      case "j":
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("navigate-list", { detail: { direction: "down" } }));
        break;
      case "k":
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("navigate-list", { detail: { direction: "up" } }));
        break;
      case "Escape":
        window.dispatchEvent(new CustomEvent("close-panel"));
        break;
      case "?":
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("toggle-shortcuts-help"));
        break;
      case "/":
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("focus-search"));
        break;
      case "g":
        e.preventDefault();
        gPending.current = true;
        gTimer.current = setTimeout(() => {
          gPending.current = false;
        }, 1000); // 1s window for second key
        break;
    }
  }, [router]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (gTimer.current) clearTimeout(gTimer.current);
    };
  }, [handleKeyDown]);
}

/**
 * Describes available keyboard shortcuts for help display
 */
export const KEYBOARD_SHORTCUTS = [
  { keys: ["c"], description: "Create new task" },
  { keys: ["j"], description: "Navigate down" },
  { keys: ["k"], description: "Navigate up" },
  { keys: ["Esc"], description: "Close panel / modal" },
  { keys: ["?"], description: "Toggle shortcuts help" },
  { keys: ["/"], description: "Focus search" },
  { keys: ["g", "p"], description: "Go to Projects" },
  { keys: ["g", "b"], description: "Go to Board" },
  { keys: ["g", "c"], description: "Go to Calendar" },
  { keys: ["g", "g"], description: "Go to Goals" },
  { keys: ["g", "i"], description: "Go to Inbox" },
  { keys: ["g", "s"], description: "Go to Settings" },
  { keys: ["g", "t"], description: "Go to Timeline" },
  { keys: ["g", "w"], description: "Go to Workload" },
  { keys: ["g", "d"], description: "Go to Docs" },
  { keys: ["g", "r"], description: "Go to Reports" },
  { keys: ["g", "o"], description: "Go to Portfolio" },
  { keys: ["g", "n"], description: "Go to Sprints" },
  { keys: ["g", "a"], description: "Go to Automations" },
  { keys: ["g", "h"], description: "Go to Time Tracking" },
  { keys: ["g", "f"], description: "Go to Intake" },
  { keys: ["g", "m"], description: "Go to Templates" },
] as const;
