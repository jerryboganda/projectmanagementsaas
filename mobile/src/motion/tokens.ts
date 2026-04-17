/**
 * Mobile motion tokens — mirrors lib/motion/tokens.ts on web but tuned
 * slightly for WebView rendering and touch interaction:
 *  - Durations are marginally longer to feel native on mobile.
 *  - Spring profiles favor settle behavior for sheet/tab transitions.
 *  - Everything stays on transform + opacity to keep the WebView smooth.
 */

import type { Transition, Variants } from 'motion/react';

export const duration = {
  instant: 0.1,
  fast: 0.18,
  base: 0.24,
  slow: 0.34,
} as const;

export const easing = {
  standard: [0.2, 0, 0, 1] as const,
  exit: [0.4, 0, 1, 1] as const,
} as const;

export const spring = {
  snappy: { type: 'spring', stiffness: 500, damping: 40, mass: 0.9 } as const,
  sheet: { type: 'spring', stiffness: 280, damping: 32, mass: 1 } as const,
  tab: { type: 'spring', stiffness: 420, damping: 36, mass: 0.8 } as const,
} as const;

export const distance = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
} as const;

export const stagger = {
  tight: 0.025,
  base: 0.04,
} as const;

export const transitions: Record<'fast' | 'base' | 'slow' | 'exit', Transition> = {
  fast: { duration: duration.fast, ease: easing.standard },
  base: { duration: duration.base, ease: easing.standard },
  slow: { duration: duration.slow, ease: easing.standard },
  exit: { duration: duration.fast, ease: easing.exit },
};

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

export const sheetBottomVariants: Variants = {
  hidden: { opacity: 0, y: distance.xl },
  visible: { opacity: 1, y: 0, transition: transitions.base },
  exit: { opacity: 0, y: distance.lg, transition: transitions.exit },
};

export const listContainerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger.base, delayChildren: 0.02 },
  },
  exit: {
    transition: { staggerChildren: stagger.tight, staggerDirection: -1 },
  },
};

export const press = {
  soft: { scale: 0.98 },
  firm: { scale: 0.96 },
} as const;
