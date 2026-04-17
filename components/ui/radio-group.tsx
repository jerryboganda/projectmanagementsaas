'use client';

import { useRef, useCallback, useId } from 'react';
import { cn } from '@/lib/utils';

interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface RadioGroupProps {
  options: RadioOption[];
  value: string;
  onValueChange: (value: string) => void;
  name: string;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function RadioGroup({
  options,
  value,
  onValueChange,
  name,
  orientation = 'vertical',
  className,
}: RadioGroupProps) {
  const groupId = useId();
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const enabledOptions = options.filter((o) => !o.disabled);

  const focusOption = useCallback(
    (optionValue: string) => {
      const el = itemRefs.current.get(optionValue);
      el?.focus();
      onValueChange(optionValue);
    },
    [onValueChange]
  );

  function handleKeyDown(e: React.KeyboardEvent, index: number) {
    const isHorizontal = orientation === 'horizontal';
    const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';
    const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';

    let handled = true;

    switch (e.key) {
      case nextKey: {
        // Find next enabled option
        for (let i = 1; i <= options.length; i++) {
          const nextIdx = (index + i) % options.length;
          if (!options[nextIdx].disabled) {
            focusOption(options[nextIdx].value);
            break;
          }
        }
        break;
      }
      case prevKey: {
        for (let i = 1; i <= options.length; i++) {
          const prevIdx = (index - i + options.length) % options.length;
          if (!options[prevIdx].disabled) {
            focusOption(options[prevIdx].value);
            break;
          }
        }
        break;
      }
      case 'Home': {
        const first = options.find((o) => !o.disabled);
        if (first) focusOption(first.value);
        break;
      }
      case 'End': {
        for (let i = options.length - 1; i >= 0; i--) {
          if (!options[i].disabled) {
            focusOption(options[i].value);
            break;
          }
        }
        break;
      }
      case ' ':
      case 'Enter': {
        e.preventDefault();
        if (!options[index].disabled) {
          onValueChange(options[index].value);
        }
        break;
      }
      default:
        handled = false;
    }

    if (handled) e.preventDefault();
  }

  return (
    <div
      role="radiogroup"
      aria-label={name}
      className={cn(
        'flex gap-3',
        orientation === 'vertical' ? 'flex-col' : 'flex-row flex-wrap',
        className
      )}
    >
      {options.map((option, index) => {
        const isSelected = option.value === value;
        const isDisabled = !!option.disabled;
        const optionId = `${groupId}-${option.value}`;
        const descriptionId = option.description
          ? `${optionId}-desc`
          : undefined;

        // roving tabindex: only selected (or first enabled if none selected) is tabbable
        const isTabTarget =
          isSelected ||
          (!enabledOptions.some((o) => o.value === value) &&
            enabledOptions[0]?.value === option.value);

        return (
          <div key={option.value} className="flex items-start gap-2.5">
            <button
              ref={(el) => {
                if (el) itemRefs.current.set(option.value, el);
                else itemRefs.current.delete(option.value);
              }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-disabled={isDisabled || undefined}
              aria-describedby={descriptionId}
              tabIndex={isTabTarget ? 0 : -1}
              disabled={isDisabled}
              onClick={() => {
                if (!isDisabled) onValueChange(option.value);
              }}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                'relative shrink-0 w-[18px] h-[18px] rounded-full border transition-all duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1313ec]/40 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0a0a0a]',
                isSelected ? 'border-[#1313ec]' : 'border-[#222222]',
                isDisabled && 'opacity-50 cursor-not-allowed',
                !isDisabled && 'cursor-pointer'
              )}
            >
              {isSelected && (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 m-auto w-[10px] h-[10px] rounded-full bg-[#1313ec]"
                />
              )}
            </button>

            {(option.label || option.description) && (
              <div className="flex flex-col gap-0.5 pt-px">
                <label
                  id={optionId}
                  onClick={() => {
                    if (!isDisabled) onValueChange(option.value);
                  }}
                  className={cn(
                    'text-[13px] text-slate-200 select-none',
                    isDisabled
                      ? 'cursor-not-allowed opacity-50'
                      : 'cursor-pointer'
                  )}
                >
                  {option.label}
                </label>
                {option.description && (
                  <span
                    id={descriptionId}
                    className={cn(
                      'text-[11px] text-slate-500',
                      isDisabled && 'opacity-50'
                    )}
                  >
                    {option.description}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
