import type { ReactNode } from 'react';

export function SectionHeader({
  title,
  actions,
}: {
  title: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 h-11 border-b border-[#1A1A1A] bg-[#0A0A0A]">
      <h2 className="font-mono text-[11px] uppercase tracking-[0.1em] text-slate-400">
        {title}
      </h2>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
