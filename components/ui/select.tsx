'use client';

import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 text-xs pl-2.5 pr-7',
  md: 'h-10 text-sm pl-3 pr-8',
} as const;

const iconSizeClasses = {
  sm: 'right-1.5 h-3.5 w-3.5',
  md: 'right-2.5 h-4 w-4',
} as const;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select(
    {
      options,
      value,
      onChange,
      placeholder = 'Select…',
      label,
      error,
      disabled = false,
      size = 'md',
      className,
    },
    ref
  ) {
    const autoId = useId();
    const selectId = `${autoId}-select`;
    const errorId = `${autoId}-error`;

    return (
      <div className={cn('flex flex-col gap-1.5', className)}>
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-medium text-[#a1a1a1]"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              'w-full appearance-none rounded-lg border bg-transparent text-white transition-colors',
              'focus:outline-none focus:border-[#1313ec] focus:ring-1 focus:ring-[#1313ec]/20',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error
                ? 'border-red-500'
                : 'border-[#222222] hover:border-[#333333]',
              sizeClasses[size]
            )}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
              >
                {opt.label}
              </option>
            ))}
          </select>

          <ChevronDown
            className={cn(
              'pointer-events-none absolute top-1/2 -translate-y-1/2 text-[#666666]',
              iconSizeClasses[size]
            )}
            aria-hidden="true"
          />
        </div>

        {error && (
          <p id={errorId} className="text-xs text-red-500" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
