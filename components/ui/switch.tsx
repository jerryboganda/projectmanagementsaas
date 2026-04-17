'use client';

import { type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  label?: string;
  description?: string;
  className?: string;
}

const trackSize: Record<NonNullable<SwitchProps['size']>, string> = {
  sm: 'h-5 w-9',
  md: 'h-6 w-11',
};

const thumbSize: Record<NonNullable<SwitchProps['size']>, string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4.5 w-4.5',
};

const thumbTranslate: Record<NonNullable<SwitchProps['size']>, string> = {
  sm: 'translate-x-4',
  md: 'translate-x-5',
};

export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  size = 'md',
  label,
  description,
  className,
}: SwitchProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!disabled) {
        onCheckedChange(!checked);
      }
    }
  };

  const switchElement = (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label && !description ? label : undefined}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1313ec] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]',
        trackSize[size],
        checked ? 'bg-[#1313ec]' : 'bg-white/[0.1]',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'cursor-pointer'
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none inline-block rounded-full bg-white shadow-sm transition-transform duration-200',
          thumbSize[size],
          'ml-0.5',
          checked ? thumbTranslate[size] : 'translate-x-0'
        )}
      />
    </button>
  );

  if (!label) {
    return <div className={className}>{switchElement}</div>;
  }

  return (
    <label
      className={cn(
        'inline-flex items-start gap-3',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'cursor-pointer',
        className
      )}
    >
      {switchElement}
      <span className="flex flex-col">
        <span className="text-sm font-medium text-slate-200">{label}</span>
        {description && (
          <span className="text-xs text-slate-500 mt-0.5">{description}</span>
        )}
      </span>
    </label>
  );
}
