'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizeMap: Record<NonNullable<SpinnerProps['size']>, number> = {
  sm: 16,
  md: 24,
  lg: 32,
};

export function Spinner({ size = 'md', className, label }: SpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <Loader2
        className="animate-spin text-slate-400"
        size={sizeMap[size]}
      />
      {label && (
        <span className="text-xs text-slate-500">{label}</span>
      )}
    </div>
  );
}

interface FullPageSpinnerProps {
  label?: string;
  size?: SpinnerProps['size'];
}

export function FullPageSpinner({ label, size = 'lg' }: FullPageSpinnerProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a]/80">
      <Spinner size={size} label={label} />
    </div>
  );
}
