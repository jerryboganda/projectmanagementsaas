'use client';

import { useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { overlayVariants, transitions } from '@/lib/motion';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  side?: 'left' | 'right';
  title?: string;
  description?: string;
  width?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const widthClasses = {
  sm: 'w-[320px]',
  md: 'w-[420px]',
  lg: 'w-[540px]',
  xl: 'w-[700px]',
} as const;

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Sheet({
  open,
  onClose,
  children,
  side = 'right',
  title,
  description,
  width = 'md',
  className,
}: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Escape key to close
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, handleEscape]);

  // Focus trap + initial focus
  useEffect(() => {
    if (!open) {
      previousFocusRef.current?.focus();
      return;
    }

    const frame = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const first = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      first?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [open]);

  // Trap Tab within the panel
  const handleTabTrap = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const panel = panelRef.current;
    if (!panel) return;

    const focusable = Array.from(
      panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', handleTabTrap);
    return () => document.removeEventListener('keydown', handleTabTrap);
  }, [open, handleTabTrap]);

  const slideFrom = side === 'left' ? '-100%' : '100%';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={overlayVariants}
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            initial={{ x: slideFrom, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: slideFrom, opacity: 0 }}
            transition={transitions.base}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={cn(
              'relative flex flex-col bg-[#0a0a0a] border-[#222222] shadow-2xl max-h-screen overflow-y-auto',
              side === 'left'
                ? 'ml-0 mr-auto border-r'
                : 'ml-auto mr-0 border-l',
              widthClasses[width],
              className
            )}
          >
            {/* Header */}
            {(title || description) && (
              <div className="flex items-start justify-between gap-4 border-b border-[#222222] px-6 py-4">
                <div className="flex flex-col gap-1">
                  {title && (
                    <h2 className="text-base font-semibold text-white">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="text-sm text-[#888888]">{description}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close panel"
                  className="rounded-md p-1.5 text-[#666666] transition-colors hover:bg-[#1a1a1a] hover:text-white focus:outline-none focus:ring-1 focus:ring-[#1313ec]/40"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
