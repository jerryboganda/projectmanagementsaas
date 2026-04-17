import { MotionConfig } from 'motion/react';
import type { ReactNode } from 'react';
import { transitions } from './tokens';

interface Props {
  children: ReactNode;
}

/**
 * Global Motion provider for the mobile shell. `reducedMotion="user"` is
 * the official Motion API that respects the OS setting automatically.
 */
export function MotionProvider({ children }: Props) {
  return (
    <MotionConfig reducedMotion="user" transition={transitions.base}>
      {children}
    </MotionConfig>
  );
}
