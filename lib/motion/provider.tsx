"use client";

/**
 * Global motion provider. Wraps the tree in `<MotionConfig>` so all
 * `motion/react` components honor the user's OS-level
 * `prefers-reduced-motion` setting without any per-component branching.
 *
 * `reducedMotion="user"` is the official Motion API for this behavior
 * (motion.dev docs). When the user prefers reduced motion, Motion strips
 * transforms but keeps opacity transitions, which is exactly the
 * accessible default we want.
 */

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { transitions } from "./tokens";

interface Props {
  children: ReactNode;
}

export function MotionProvider({ children }: Props) {
  return (
    <MotionConfig reducedMotion="user" transition={transitions.base}>
      {children}
    </MotionConfig>
  );
}
