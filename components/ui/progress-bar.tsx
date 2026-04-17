'use client';

import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  className?: string;
}

const sizeClasses: Record<string, string> = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const colorClasses: Record<string, string> = {
  primary: 'bg-[#1313ec]',
  success: 'bg-[#22c55e]',
  warning: 'bg-[#f59e0b]',
  danger: 'bg-[#ef4444]',
};

function resolveColor(pct: number): 'danger' | 'warning' | 'success' {
  if (pct <= 33) return 'danger';
  if (pct <= 66) return 'warning';
  return 'success';
}

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  color,
  showLabel = false,
  label,
  animated = false,
  className,
}: ProgressBarProps) {
  const clamped = Math.min(Math.max(value, 0), max);
  const pct = max > 0 ? Math.round((clamped / max) * 100) : 0;
  const resolvedColor = color ?? resolveColor(pct);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label ?? `${pct}% complete`}
        className={cn(
          'w-full rounded-full bg-white/[0.06] overflow-hidden',
          sizeClasses[size],
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            colorClasses[resolvedColor],
            animated && 'animate-pulse',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-slate-400 tabular-nums shrink-0">
          {label ?? `${pct}%`}
        </span>
      )}
    </div>
  );
}
