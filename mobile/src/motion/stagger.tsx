import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { distance, stagger, transitions } from './tokens';

/**
 * Mobile stagger list — applies subtle cascade entry to direct children.
 * Pair with `<StaggerItem>` for each row, or use the container alone and
 * let rows inherit via `variants` if they already opt in.
 */
export function StaggerList({
  children,
  className,
  delayChildren = 0.04,
  staggerChildren = stagger.tight,
}: {
  children: ReactNode;
  className?: string;
  delayChildren?: number;
  staggerChildren?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: { delayChildren, staggerChildren },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: distance.sm },
        visible: { opacity: 1, y: 0, transition: transitions.base },
      }}
    >
      {children}
    </motion.div>
  );
}
