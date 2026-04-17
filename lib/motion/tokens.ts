/**
 * Motion tokens — the single source of truth for animation timing, easing,
 * and amplitude across the web app. Use these instead of hardcoding
 * durations or cubic-beziers in components.
 *
 * Principles:
 *  - Productivity-first. Motion clarifies state changes; it never decorates.
 *  - Short durations (sub-250ms) for all primary UI feedback.
 *  - Transform + opacity only; avoid animating layout-affecting properties.
 *  - Every variant honors `prefers-reduced-motion`.
 */

import type { Transition, Variants } from "motion/react";

// ---------------------------------------------------------------------------
// Durations (seconds — motion/react uses seconds, not ms)
// ---------------------------------------------------------------------------

export const duration = {
  /** 100ms — instant feedback (hover, press, focus ring). */
  instant: 0.1,
  /** 160ms — standard micro-interaction (tooltip, toast, dropdown). */
  fast: 0.16,
  /** 220ms — standard surface transition (modal, sheet, panel). */
  base: 0.22,
  /** 320ms — larger surfaces or staged reveals (drawer, side panel). */
  slow: 0.32,
  /** 480ms — onboarding / first paint / choreographed sequences only. */
  showcase: 0.48,
} as const;

// ---------------------------------------------------------------------------
// Easing curves — standard productivity set
// ---------------------------------------------------------------------------

/**
 * `standard`   — default enter/exit. Feels calm and intentional.
 * `emphasized` — used when a surface needs more visual anchor (panels).
 * `exit`       — accelerate on the way out so dismissal feels snappy.
 * `linear`     — progress bars and indeterminate loaders only.
 */
export const easing = {
  standard: [0.2, 0, 0, 1] as const,
  emphasized: [0.2, 0, 0, 1] as const,
  exit: [0.4, 0, 1, 1] as const,
  linear: [0, 0, 1, 1] as const,
} as const;

// ---------------------------------------------------------------------------
// Spring profiles — reserved for gesture-driven or layout transitions
// ---------------------------------------------------------------------------

export const spring = {
  /** Interactive drag / reorder. Firm, no overshoot. */
  snappy: { type: "spring", stiffness: 520, damping: 42, mass: 0.9 } as const,
  /** Panel or sheet settle. */
  surface: { type: "spring", stiffness: 320, damping: 34, mass: 1 } as const,
  /** Large travel (mobile sheets, workspace switcher). */
  drawer: { type: "spring", stiffness: 260, damping: 30, mass: 1 } as const,
} as const;

// ---------------------------------------------------------------------------
// Amplitude / distance tokens
// ---------------------------------------------------------------------------

export const distance = {
  /** Nudges for toasts, dropdowns, tooltips. */
  xs: 2,
  sm: 4,
  md: 8,
  /** Drawer / sheet entry. */
  lg: 16,
  xl: 24,
} as const;

// ---------------------------------------------------------------------------
// Staggers
// ---------------------------------------------------------------------------

export const stagger = {
  /** Fine-grained lists (<10 items). */
  tight: 0.02,
  /** Default list reveal. */
  base: 0.035,
  /** Hero/dashboard card reveal. */
  relaxed: 0.05,
} as const;

// ---------------------------------------------------------------------------
// Prebuilt transitions
// ---------------------------------------------------------------------------

export const transitions: Record<
  "fast" | "base" | "slow" | "exit",
  Transition
> = {
  fast: { duration: duration.fast, ease: easing.standard },
  base: { duration: duration.base, ease: easing.standard },
  slow: { duration: duration.slow, ease: easing.emphasized },
  exit: { duration: duration.fast, ease: easing.exit },
};

// ---------------------------------------------------------------------------
// Prebuilt variant libraries
// ---------------------------------------------------------------------------

export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.base },
  exit: { opacity: 0, transition: transitions.exit },
};

export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: distance.sm },
  visible: { opacity: 1, y: 0, transition: transitions.base },
  exit: { opacity: 0, y: distance.xs, transition: transitions.exit },
};

export const scalePopVariants: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1, transition: transitions.fast },
  exit: { opacity: 0, scale: 0.97, transition: transitions.exit },
};

export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.fast },
  exit: { opacity: 0, transition: transitions.exit },
};

export const sheetSideVariants: Variants = {
  hidden: { opacity: 0, x: distance.xl },
  visible: { opacity: 1, x: 0, transition: transitions.base },
  exit: { opacity: 0, x: distance.lg, transition: transitions.exit },
};

export const sheetBottomVariants: Variants = {
  hidden: { opacity: 0, y: distance.xl },
  visible: { opacity: 1, y: 0, transition: transitions.base },
  exit: { opacity: 0, y: distance.lg, transition: transitions.exit },
};

/**
 * Parent variants for staggered list reveals. Pair with `fadeUpVariants`
 * on children and `variants={listContainerVariants}` on the parent.
 */
export const listContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: stagger.base,
      delayChildren: 0.02,
    },
  },
  exit: {
    transition: {
      staggerChildren: stagger.tight,
      staggerDirection: -1,
    },
  },
};

// ---------------------------------------------------------------------------
// Press / hover micro-interaction presets (for whileHover / whileTap)
// ---------------------------------------------------------------------------

export const press = {
  /** Subtle button press. */
  soft: { scale: 0.98 },
  /** Firmer press for chips, pills, icon buttons. */
  firm: { scale: 0.96 },
} as const;

export const hover = {
  lift: { y: -1 },
  brighten: { opacity: 0.92 },
} as const;
