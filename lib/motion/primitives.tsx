"use client";

/**
 * Reusable motion primitives for the Next.js app. Each primitive composes
 * a token-driven variant and respects `prefers-reduced-motion` by delegating
 * to `ReducedMotionProvider`. Prefer these over ad-hoc `motion.div` blocks
 * to keep the motion language consistent.
 */

import { motion, type HTMLMotionProps, type Variants } from "motion/react";
import { forwardRef, type ReactNode } from "react";
import {
  fadeUpVariants,
  fadeVariants,
  listContainerVariants,
  scalePopVariants,
  transitions,
} from "./tokens";

type DivMotionProps = HTMLMotionProps<"div">;

interface PrimitiveProps extends Omit<DivMotionProps, "variants" | "initial" | "animate" | "exit"> {
  children?: ReactNode;
  delay?: number;
}

function withDelay(variants: Variants, delay?: number): Variants {
  if (!delay) return variants;
  return {
    ...variants,
    visible: {
      ...(variants.visible as object),
      transition: { ...transitions.base, delay },
    },
  };
}

/** Fade in (no translation). Good for overlays, chart cards, skeleton swaps. */
export const Fade = forwardRef<HTMLDivElement, PrimitiveProps>(function Fade(
  { children, delay, ...rest },
  ref,
) {
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={withDelay(fadeVariants, delay)}
      {...rest}
    >
      {children}
    </motion.div>
  );
});

/** Fade + subtle rise. Good for page content and dashboard cards. */
export const FadeUp = forwardRef<HTMLDivElement, PrimitiveProps>(function FadeUp(
  { children, delay, ...rest },
  ref,
) {
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={withDelay(fadeUpVariants, delay)}
      {...rest}
    >
      {children}
    </motion.div>
  );
});

/** Scale + fade. Good for popovers, dropdowns, quick menus. */
export const PopIn = forwardRef<HTMLDivElement, PrimitiveProps>(function PopIn(
  { children, delay, ...rest },
  ref,
) {
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={withDelay(scalePopVariants, delay)}
      {...rest}
    >
      {children}
    </motion.div>
  );
});

/**
 * Stagger container. Children should use `fadeUpVariants` (or another
 * variant triple) for inherited orchestration to work.
 *
 * Example:
 *   <Stagger>
 *     {items.map(i => <motion.li key={i} variants={fadeUpVariants}>…</motion.li>)}
 *   </Stagger>
 */
export const Stagger = forwardRef<HTMLDivElement, PrimitiveProps>(function Stagger(
  { children, ...rest },
  ref,
) {
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={listContainerVariants}
      {...rest}
    >
      {children}
    </motion.div>
  );
});
