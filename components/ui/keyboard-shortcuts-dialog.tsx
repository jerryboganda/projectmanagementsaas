"use client";

import { useState, useEffect } from "react";
import { X, Keyboard } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { KEYBOARD_SHORTCUTS } from "@/hooks/use-keyboard-shortcuts";

export function KeyboardShortcutsDialog() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsOpen((prev) => !prev);
    window.addEventListener("toggle-shortcuts-help", handler);
    return () => window.removeEventListener("toggle-shortcuts-help", handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[100]"
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-neutral-surface border border-neutral-border rounded-lg shadow-2xl z-[101] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-border">
              <div className="flex items-center gap-2">
                <Keyboard className="size-4 text-primary" />
                <h2 className="text-[15px] font-semibold text-slate-100">Keyboard Shortcuts</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-sm transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Shortcuts list */}
            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-2">
              {/* Navigation section */}
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">Navigation</div>
              {KEYBOARD_SHORTCUTS.filter(s => s.keys[0] === "g" || s.keys[0] === "/").map((shortcut, i) => (
                <ShortcutRow key={i} keys={shortcut.keys} description={shortcut.description} />
              ))}

              <div className="h-px bg-neutral-border/50 my-3" />

              {/* Actions section */}
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">Actions</div>
              {KEYBOARD_SHORTCUTS.filter(s => s.keys[0] !== "g" && s.keys[0] !== "/").map((shortcut, i) => (
                <ShortcutRow key={i} keys={shortcut.keys} description={shortcut.description} />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ShortcutRow({ keys, description }: { keys: readonly string[]; description: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[13px] text-slate-300">{description}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, i) => (
          <span key={i}>
            {i > 0 && <span className="text-[11px] text-slate-600 mx-0.5">then</span>}
            <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 bg-white/[0.05] border border-neutral-border rounded text-[11px] font-mono text-slate-300">
              {key}
            </kbd>
          </span>
        ))}
      </div>
    </div>
  );
}
