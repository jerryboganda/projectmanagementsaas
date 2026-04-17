import type { ReactNode } from 'react';

/**
 * LP screen wrapper. Applies safe-area padding, scroll containment, and the
 * canonical `#0A0A0A` surface. Every routed mobile screen renders inside this
 * wrapper. See mobile/DESIGN.md §5.
 */
export function ScreenContainer({
  children,
  toolbar,
  padded = false,
}: {
  children: ReactNode;
  toolbar?: ReactNode;
  padded?: boolean;
}) {
  return (
    <div className="lp-screen bg-[#0A0A0A] text-slate-100">
      {toolbar ? (
        <div className="sticky top-0 z-10 border-b border-[#1A1A1A] bg-[#0A0A0A]">{toolbar}</div>
      ) : null}
      <div className={`lp-screen-scroll ${padded ? 'px-4 py-3' : ''}`}>{children}</div>
    </div>
  );
}
