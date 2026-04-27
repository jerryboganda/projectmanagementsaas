"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Compass,
  LayoutDashboard,
  Keyboard,
  Rocket,
  ChevronLeft,
  ChevronRight,
  X,
  Kanban,
  Timer,
  CalendarDays,
  Target,
  Clock,
  Zap,
  FileStack,
  FileText,
} from "lucide-react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "onboarding-completed";
const SHOW_EVENT = "show-onboarding";
const TOTAL_STEPS = 5;

/* ------------------------------------------------------------------ */
/*  Feature grid data                                                  */
/* ------------------------------------------------------------------ */
const features = [
  { icon: Kanban, label: "Board", desc: "Kanban task management" },
  { icon: Timer, label: "Sprints", desc: "Agile sprint planning" },
  { icon: CalendarDays, label: "Calendar", desc: "Schedule & deadlines" },
  { icon: Target, label: "Goals", desc: "OKR tracking" },
  { icon: Clock, label: "Time Tracking", desc: "Log work hours" },
  { icon: Zap, label: "Automations", desc: "Workflow rules" },
  { icon: FileStack, label: "Templates", desc: "Reusable blueprints" },
  { icon: FileText, label: "Docs", desc: "Shared documentation" },
];

/* ------------------------------------------------------------------ */
/*  Shortcut data                                                      */
/* ------------------------------------------------------------------ */
const shortcuts = [
  { keys: ["C"], description: "Create new task" },
  { keys: ["?"], description: "Show help & shortcuts" },
  { keys: ["/"], description: "Focus search" },
  { keys: ["G", "B"], description: "Go to board" },
  { keys: ["Ctrl", "K"], description: "Command palette" },
  { keys: ["Esc"], description: "Close dialog / panel" },
];

/* ------------------------------------------------------------------ */
/*  Slide variants                                                     */
/* ------------------------------------------------------------------ */
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export function OnboardingWizard() {
  const router = useRouter();
  // Lazy initial state — reads localStorage once during initial mount without
  // an effect. Guard against SSR where window is undefined.
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(STORAGE_KEY) !== "true";
    } catch {
      return false;
    }
  });
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  /* --- listen for "show-onboarding" custom event ------------------ */
  useEffect(() => {
    const handler = () => {
      setStep(0);
      setDirection(1);
      setIsOpen(true);
    };
    window.addEventListener(SHOW_EVENT, handler);
    return () => window.removeEventListener(SHOW_EVENT, handler);
  }, []);

  /* --- helpers ---------------------------------------------------- */
  const close = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore
    }
    setIsOpen(false);
  }, []);

  const next = useCallback(() => {
    if (step < TOTAL_STEPS - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  }, [step]);

  const prev = useCallback(() => {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  }, [step]);

  const finish = useCallback(() => {
    close();
    router.push("/");
  }, [close, router]);

  /* --- close on Escape (after `close` is defined) ----------------- */
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, close]);

  /* --- step content ----------------------------------------------- */
  const renderStep = () => {
    switch (step) {
      /* Step 1: Welcome */
      case 0:
        return (
          <div className="flex flex-col items-center text-center px-6 py-4">
            <div className="size-12 rounded-full bg-primary/15 flex items-center justify-center mb-4">
              <Sparkles className="size-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">
              Welcome to Linear Precision
            </h2>
            <p className="text-sm text-slate-400 max-w-sm mb-6">
              Your all-in-one project management workspace. Let&apos;s get you
              set up in under 2 minutes.
            </p>
            <button
              onClick={next}
              className="px-5 py-2 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Get Started
            </button>
          </div>
        );

      /* Step 2: Navigation */
      case 1:
        return (
          <div className="flex flex-col items-center text-center px-6 py-4">
            <div className="size-12 rounded-full bg-primary/15 flex items-center justify-center mb-4">
              <Compass className="size-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">
              Navigate Your Workspace
            </h2>
            <p className="text-sm text-slate-400 max-w-sm mb-5">
              Your workspace is organised into three key zones.
            </p>

            {/* Layout diagram */}
            <div className="w-full max-w-xs border border-neutral-border rounded-lg overflow-hidden text-xs">
              {/* Header zone */}
              <div className="flex items-center justify-between bg-white/5 px-3 py-2 border-b border-neutral-border">
                <span className="text-slate-300 font-medium">Header</span>
                <span className="text-slate-500">Search + Actions</span>
              </div>
              <div className="flex">
                {/* Sidebar zone */}
                <div className="w-24 border-r border-neutral-border bg-white/[0.03] flex flex-col items-center justify-center py-6 gap-1">
                  <span className="text-slate-300 font-medium">Sidebar</span>
                  <span className="text-[10px] text-slate-500">
                    Navigation
                  </span>
                </div>
                {/* Main content zone */}
                <div className="flex-1 flex flex-col items-center justify-center py-6 gap-1">
                  <span className="text-slate-300 font-medium">Content</span>
                  <span className="text-[10px] text-slate-500">
                    Your work lives here
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono text-[11px]">
                Ctrl+K
              </kbd>
              <span>opens the Command Palette from anywhere</span>
            </div>
          </div>
        );

      /* Step 3: Core Features */
      case 2:
        return (
          <div className="flex flex-col items-center text-center px-6 py-4">
            <div className="size-12 rounded-full bg-primary/15 flex items-center justify-center mb-4">
              <LayoutDashboard className="size-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">
              Core Features
            </h2>
            <p className="text-sm text-slate-400 max-w-sm mb-5">
              Everything you need to plan, track, and ship.
            </p>

            <div className="grid grid-cols-4 gap-3 w-full max-w-sm">
              {features.map((f) => (
                <div
                  key={f.label}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-neutral-border bg-white/[0.03] p-3 hover:bg-white/5 transition-colors"
                >
                  <f.icon className="size-4 text-primary" />
                  <span className="text-[11px] font-medium text-slate-200">
                    {f.label}
                  </span>
                  <span className="text-[9px] text-slate-500 leading-tight">
                    {f.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      /* Step 4: Shortcuts */
      case 3:
        return (
          <div className="flex flex-col items-center text-center px-6 py-4">
            <div className="size-12 rounded-full bg-primary/15 flex items-center justify-center mb-4">
              <Keyboard className="size-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">
              Keyboard Shortcuts
            </h2>
            <p className="text-sm text-slate-400 max-w-sm mb-5">
              Speed up your workflow with these essential shortcuts.
            </p>

            <div className="w-full max-w-xs space-y-2">
              {shortcuts.map((s) => (
                <div
                  key={s.description}
                  className="flex items-center justify-between rounded-md border border-neutral-border bg-white/[0.03] px-3 py-2"
                >
                  <span className="text-xs text-slate-300">
                    {s.description}
                  </span>
                  <div className="flex items-center gap-1">
                    {s.keys.map((k) => (
                      <kbd
                        key={k}
                        className="min-w-[22px] px-1.5 py-0.5 rounded bg-white/10 text-center text-[11px] font-mono text-slate-200"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Press{" "}
              <kbd className="px-1 py-0.5 rounded bg-white/10 text-slate-300 font-mono text-[11px]">
                ?
              </kbd>{" "}
              anytime to see all shortcuts
            </p>
          </div>
        );

      /* Step 5: Ready */
      case 4:
        return (
          <div className="flex flex-col items-center text-center px-6 py-4">
            <div className="size-12 rounded-full bg-primary/15 flex items-center justify-center mb-4">
              <Rocket className="size-6 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">
              You&apos;re All Set!
            </h2>
            <p className="text-sm text-slate-400 max-w-sm mb-6">
              Start by creating your first task or exploring the dashboard.
            </p>
            <button
              onClick={finish}
              className="px-5 py-2 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                           */
  /* ---------------------------------------------------------------- */
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            onClick={close}
          />

          {/* Card — centered via flex wrapper to avoid Tailwind translate colliding with motion transforms */}
          <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
              role="dialog"
              aria-modal="true"
              aria-label="Welcome onboarding"
              className="pointer-events-auto w-full max-w-lg max-h-[90vh] bg-neutral-surface border border-neutral-border rounded-xl shadow-2xl overflow-hidden flex flex-col"
            >
            {/* Progress bar */}
            <div className="h-1 w-full bg-white/5">
              <motion.div
                className="h-full bg-primary"
                initial={false}
                animate={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
              />
            </div>

            {/* Close / skip button */}
            <button
              onClick={close}
              className="absolute top-3 right-3 p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors z-10"
              aria-label="Close onboarding"
            >
              <X className="size-4" />
            </button>

            {/* Step indicator */}
            <div className="pt-4 pb-1 text-center flex-shrink-0">
              <span className="text-[11px] text-slate-500 font-medium tracking-wide uppercase">
                Step {step + 1} of {TOTAL_STEPS}
              </span>
            </div>

            {/* Animated step content */}
            <div className="relative flex-1 min-h-0 overflow-y-auto">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  className="w-full"
                >
                  {renderStep()}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer nav */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-neutral-border flex-shrink-0">
              <button
                onClick={prev}
                disabled={step === 0}
                className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="size-4" />
                Previous
              </button>

              <button
                onClick={close}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Skip
              </button>

              {step < TOTAL_STEPS - 1 ? (
                <button
                  onClick={next}
                  className="flex items-center gap-1 text-sm text-slate-200 hover:text-white transition-colors"
                >
                  Next
                  <ChevronRight className="size-4" />
                </button>
              ) : (
                <button
                  onClick={finish}
                  className="px-4 py-1.5 rounded-md bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Finish
                </button>
              )}
            </div>
          </motion.div>
        </div>
        </>
      )}
    </AnimatePresence>
  );
}
