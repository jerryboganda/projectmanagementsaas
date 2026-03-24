'use client';

import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from './modal';

type ConfirmVariant = 'danger' | 'warning';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

const variantStyles: Record<
  ConfirmVariant,
  { iconBg: string; iconColor: string; btnBg: string; btnHover: string }
> = {
  danger: {
    iconBg: 'bg-rose-500/10',
    iconColor: 'text-rose-500',
    btnBg: 'bg-rose-600',
    btnHover: 'hover:bg-rose-700',
  },
  warning: {
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
    btnBg: 'bg-amber-600',
    btnHover: 'hover:bg-amber-700',
  },
};

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
}: ConfirmDialogProps) {
  const styles = variantStyles[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center py-2">
        <div
          className={cn(
            'size-12 rounded-full flex items-center justify-center mb-4',
            styles.iconBg
          )}
        >
          <AlertTriangle className={cn('size-6', styles.iconColor)} />
        </div>
        <h3 className="text-sm font-semibold text-slate-100 mb-2">{title}</h3>
        <p className="text-[13px] text-slate-400 leading-relaxed max-w-xs">
          {message}
        </p>
      </div>
      <div className="flex items-center justify-center gap-2 mt-4">
        <button
          onClick={onClose}
          className="h-8 px-4 text-[12px] font-medium text-slate-300 border border-neutral-border hover:bg-white/5 rounded-sm transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={cn(
            'h-8 px-4 text-[12px] font-medium text-white rounded-sm transition-colors',
            styles.btnBg,
            styles.btnHover
          )}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
