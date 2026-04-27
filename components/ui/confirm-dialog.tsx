'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Modal } from './modal';
import { cn } from '@/lib/utils';

export interface ConfirmOptions {
  title?: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /**
   * Visual treatment for the confirm button. `danger` is used for destructive
   * actions (delete, unlink, discard).
   */
  tone?: 'default' | 'danger';
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

interface PendingState extends ConfirmOptions {
  isOpen: boolean;
}

const INITIAL_STATE: PendingState = { isOpen: false, message: '' };

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PendingState>(INITIAL_STATE);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setState({ ...options, isOpen: true });
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const confirmTone = state.tone ?? 'default';
  const confirmLabel = state.confirmLabel ?? 'Confirm';
  const cancelLabel = state.cancelLabel ?? 'Cancel';

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        isOpen={state.isOpen}
        onClose={() => settle(false)}
        title={state.title ?? 'Are you sure?'}
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => settle(false)}
              className="px-3 py-1.5 text-[12px] text-slate-300 hover:text-slate-100 hover:bg-white/5 rounded-sm transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              autoFocus
              onClick={() => settle(true)}
              className={cn(
                'px-3 py-1.5 text-[12px] rounded-sm transition-colors font-medium',
                confirmTone === 'danger'
                  ? 'bg-rose-500/15 text-rose-300 hover:bg-rose-500/25'
                  : 'bg-primary/15 text-primary hover:bg-primary/25',
              )}
            >
              {confirmLabel}
            </button>
          </>
        }
      >
        <div className="text-[13px] text-slate-300 leading-relaxed">
          {state.message}
        </div>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return ctx;
}

/**
 * Returns a stable (memoized) confirm function. Mostly identical to
 * `useConfirm` — provided so call sites can document intent.
 */
export function useConfirmDialog(): ConfirmFn {
  const confirm = useConfirm();
  return useMemo(() => confirm, [confirm]);
}
