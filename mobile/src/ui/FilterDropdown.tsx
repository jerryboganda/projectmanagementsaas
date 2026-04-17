import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export function FilterDropdown({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.08em] text-slate-400 hover:text-slate-200 transition-colors"
    >
      <span className="text-slate-500">{label}:</span>
      <span>{value}</span>
      <ChevronDown className="w-3 h-3" />
    </button>
  );
}

export function LinkAction({
  onClick,
  children,
}: {
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#0066FF] hover:underline"
    >
      {children}
    </button>
  );
}
