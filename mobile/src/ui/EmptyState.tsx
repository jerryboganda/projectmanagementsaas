import type { LucideIcon } from 'lucide-react';

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="size-10 rounded-[4px] bg-[#111] border border-[#1A1A1A] flex items-center justify-center text-slate-500 mb-3">
        <Icon className="w-5 h-5" strokeWidth={1.5} />
      </span>
      <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-slate-300">{title}</p>
      {description ? (
        <p className="text-[12px] text-slate-500 mt-1 max-w-[240px]">{description}</p>
      ) : null}
    </div>
  );
}
