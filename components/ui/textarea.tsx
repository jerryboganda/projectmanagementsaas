'use client';

import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  maxLength?: number;
  showCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      label,
      error,
      helperText,
      maxLength,
      showCount = false,
      className,
      disabled,
      value,
      defaultValue,
      id: externalId,
      ...rest
    },
    ref
  ) {
    const generatedId = useId();
    const id = externalId ?? generatedId;
    const errorId = error ? `${id}-error` : undefined;
    const helperId = helperText ? `${id}-helper` : undefined;
    const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;

    const currentLength =
      typeof value === 'string'
        ? value.length
        : typeof defaultValue === 'string'
          ? defaultValue.length
          : 0;

    return (
      <div className={cn('flex flex-col gap-1.5', className)}>
        {label && (
          <label
            htmlFor={id}
            className="text-[12px] font-medium text-slate-300"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <textarea
            ref={ref}
            id={id}
            disabled={disabled}
            maxLength={maxLength}
            value={value}
            defaultValue={defaultValue}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              'w-full bg-transparent border rounded-lg px-3 py-2 text-sm text-slate-200 resize-y',
              'placeholder:text-slate-600 transition-colors min-h-[80px]',
              'focus:outline-none focus:ring-1',
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-[#222222] focus:border-[#1313ec] focus:ring-[#1313ec]/20',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            {...rest}
          />

          {showCount && maxLength !== undefined && maxLength !== null && (
            <span
              aria-live="polite"
              className="absolute bottom-2 right-3 text-[11px] text-slate-500 pointer-events-none"
            >
              {currentLength}/{maxLength}
            </span>
          )}
        </div>

        {error && (
          <p id={errorId} role="alert" className="text-[11px] text-red-400">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={helperId} className="text-[11px] text-slate-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
