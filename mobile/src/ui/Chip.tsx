import type { ReactNode } from 'react';

type Tone = 'blue' | 'emerald' | 'orange' | 'red' | 'slate' | 'neutral';

const TONES: Record<Tone, string> = {
  blue: 'bg-[#0066FF]/10 text-[#0066FF] border-[#0066FF]/20',
  emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  orange: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  red: 'bg-red-500/10 text-red-500 border-red-500/20',
  slate: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  neutral: 'bg-[#1A1A1A] text-slate-400 border-[#222]',
};

export function Chip({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center font-mono text-[10px] uppercase tracking-[0.08em] px-1.5 py-0.5 rounded-[3px] border ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const tone: Tone = priority === 'high' ? 'red' : priority === 'medium' ? 'orange' : 'slate';
  return <Chip tone={tone}>{priority}</Chip>;
}

export function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const tone: Tone =
    s.includes('track') || s === 'done' || s === 'completed' || s === 'active'
      ? 'emerald'
      : s.includes('risk') || s === 'in-progress' || s === 'in progress'
      ? 'blue'
      : s.includes('block') || s === 'off'
      ? 'red'
      : 'slate';
  return <Chip tone={tone}>{status}</Chip>;
}
