'use client';

import { useState, useRef, useEffect, useCallback, useId } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export function Dropdown({
  options,
  value,
  onSelect,
  placeholder = 'Select…',
  label,
  disabled = false,
  className,
  size = 'md',
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const id = useId();
  const triggerId = `${id}-trigger`;
  const listboxId = `${id}-listbox`;

  const selected = options.find((o) => o.value === value);
  const enabledOptions = options.filter((o) => !o.disabled);

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
    triggerRef.current?.focus();
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !listRef.current?.contains(target)
      ) {
        close();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, close]);

  // Scroll active option into view
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setActiveIndex(0);
        } else {
          setActiveIndex((prev) => {
            const next = prev + 1;
            // Skip disabled options
            for (let i = next; i < options.length; i++) {
              if (!options[i].disabled) return i;
            }
            return prev;
          });
        }
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        if (open) {
          setActiveIndex((prev) => {
            const next = prev - 1;
            for (let i = next; i >= 0; i--) {
              if (!options[i].disabled) return i;
            }
            return prev;
          });
        }
        break;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setActiveIndex(
            options.findIndex((o) => o.value === value && !o.disabled)
          );
        } else if (activeIndex >= 0 && !options[activeIndex]?.disabled) {
          onSelect(options[activeIndex].value);
          close();
        }
        break;
      }
      case 'Escape': {
        e.preventDefault();
        close();
        break;
      }
      case 'Home': {
        e.preventDefault();
        if (open) {
          const first = options.findIndex((o) => !o.disabled);
          if (first >= 0) setActiveIndex(first);
        }
        break;
      }
      case 'End': {
        e.preventDefault();
        if (open) {
          for (let i = options.length - 1; i >= 0; i--) {
            if (!options[i].disabled) {
              setActiveIndex(i);
              break;
            }
          }
        }
        break;
      }
    }
  }

  return (
    <div className={cn('relative', className)}>
      {label && (
        <label
          id={`${id}-label`}
          className="block text-[12px] font-medium text-slate-300 mb-1.5"
        >
          {label}
        </label>
      )}

      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-labelledby={label ? `${id}-label` : undefined}
        aria-activedescendant={
          open && activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined
        }
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setOpen((prev) => !prev);
            if (!open) {
              const idx = options.findIndex((o) => o.value === value && !o.disabled);
              setActiveIndex(idx >= 0 ? idx : 0);
            }
          }
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          'flex items-center justify-between w-full bg-transparent border border-[#222222] rounded-lg text-left transition-colors',
          'focus:outline-none focus:border-[#1313ec] focus:ring-1 focus:ring-[#1313ec]/20',
          disabled && 'opacity-50 cursor-not-allowed',
          size === 'sm' ? 'h-8 px-2.5 text-xs' : 'h-9 px-3 text-[13px]'
        )}
      >
        <span
          className={cn(
            'flex items-center gap-2 truncate',
            selected ? 'text-slate-200' : 'text-slate-500'
          )}
        >
          {selected?.icon}
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform duration-150',
            open && 'rotate-180'
          )}
        />
      </button>

      {/* Menu */}
      <ul
        ref={listRef}
        id={listboxId}
        role="listbox"
        aria-labelledby={label ? `${id}-label` : triggerId}
        tabIndex={-1}
        className={cn(
          'absolute left-0 right-0 mt-1 z-50 max-h-60 overflow-auto rounded-lg border border-[#222222] bg-[#111111] shadow-xl py-1',
          'transition-all duration-150 origin-top',
          open
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-1 pointer-events-none'
        )}
      >
        {options.map((option, i) => {
          const isSelected = option.value === value;
          const isActive = i === activeIndex;

          return (
            <li
              key={option.value}
              id={`${id}-option-${i}`}
              role="option"
              data-index={i}
              aria-selected={isSelected}
              aria-disabled={option.disabled || undefined}
              onClick={() => {
                if (!option.disabled) {
                  onSelect(option.value);
                  close();
                }
              }}
              onMouseEnter={() => {
                if (!option.disabled) setActiveIndex(i);
              }}
              className={cn(
                'flex items-center gap-2 cursor-pointer transition-colors',
                size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-[13px]',
                isActive && 'bg-white/[0.06]',
                isSelected && 'text-slate-100',
                !isSelected && 'text-slate-400',
                option.disabled && 'opacity-40 cursor-not-allowed'
              )}
            >
              {option.icon && (
                <span className="shrink-0">{option.icon}</span>
              )}
              <span className="flex-1 truncate">
                <span className="block">{option.label}</span>
                {option.description && (
                  <span className="block text-[11px] text-slate-500 mt-0.5">
                    {option.description}
                  </span>
                )}
              </span>
              {isSelected && (
                <Check className="h-3.5 w-3.5 shrink-0 text-[#1313ec]" />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
