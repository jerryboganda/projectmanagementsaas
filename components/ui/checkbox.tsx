'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  indeterminate?: boolean;
  disabled?: boolean;
  label?: string;
  description?: string;
  className?: string;
}

export function Checkbox({
  checked,
  onCheckedChange,
  indeterminate = false,
  disabled = false,
  label,
  description,
  className,
}: CheckboxProps) {
  const id = useId();
  const descriptionId = description ? `${id}-desc` : undefined;

  const ariaChecked = indeterminate ? 'mixed' as const : checked;

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === ' ') {
      e.preventDefault();
      if (!disabled) onCheckedChange(!checked);
    }
  }

  return (
    <div className={cn('flex items-start gap-2.5', className)}>
      <button
        type="button"
        role="checkbox"
        aria-checked={ariaChecked}
        aria-disabled={disabled || undefined}
        aria-describedby={descriptionId}
        aria-label={!label ? 'checkbox' : undefined}
        tabIndex={0}
        disabled={disabled}
        onClick={() => {
          if (!disabled) onCheckedChange(!checked);
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          'relative shrink-0 w-[18px] h-[18px] rounded-sm border transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1313ec]/40 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0a0a0a]',
          (checked || indeterminate)
            ? 'bg-[#1313ec] border-[#1313ec]'
            : 'bg-transparent border-[#222222]',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'cursor-pointer'
        )}
      >
        {/* Checkmark */}
        {checked && !indeterminate && (
          <svg
            className="absolute inset-0 m-auto"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2.5 6L5 8.5L9.5 3.5"
              stroke="white"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}

        {/* Indeterminate dash */}
        {indeterminate && (
          <svg
            className="absolute inset-0 m-auto"
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M3 6H9"
              stroke="white"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>

      {(label || description) && (
        <div className="flex flex-col gap-0.5 pt-px">
          {label && (
            <label
              onClick={() => {
                if (!disabled) onCheckedChange(!checked);
              }}
              className={cn(
                'text-[13px] text-slate-200 select-none',
                disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <span
              id={descriptionId}
              className={cn(
                'text-[11px] text-slate-500',
                disabled && 'opacity-50'
              )}
            >
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
