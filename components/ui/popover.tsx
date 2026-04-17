'use client';

import { useState, useRef, useEffect, useCallback, useId } from 'react';
import { cn } from '@/lib/utils';

interface PopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

const sideClasses = {
  top: 'bottom-full mb-2',
  bottom: 'top-full mt-2',
  left: 'right-full mr-2',
  right: 'left-full ml-2',
} as const;

const alignClasses = {
  start: 'left-0',
  center: 'left-1/2 -translate-x-1/2',
  end: 'right-0',
} as const;

const alignVerticalClasses = {
  start: 'top-0',
  center: 'top-1/2 -translate-y-1/2',
  end: 'bottom-0',
} as const;

export function Popover({
  trigger,
  children,
  side = 'bottom',
  align = 'start',
  open: controlledOpen,
  onOpenChange,
  className,
}: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentId = useId();

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  const toggle = useCallback(() => setOpen(!isOpen), [isOpen, setOpen]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, setOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setOpen]);

  const isHorizontal = side === 'left' || side === 'right';
  const alignCls = isHorizontal
    ? alignVerticalClasses[align]
    : alignClasses[align];

  return (
    <div ref={containerRef} className="relative inline-flex">
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle();
          }
        }}
      >
        {trigger}
      </div>

      <div
        id={contentId}
        role="dialog"
        className={cn(
          'absolute z-50 min-w-[8rem] rounded-lg border border-[#222222] bg-[#111111] shadow-xl',
          'transition-all duration-150 origin-center',
          isOpen
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none',
          sideClasses[side],
          alignCls,
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
