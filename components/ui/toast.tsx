'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { distance, transitions } from '@/lib/motion';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

interface ToastContextValue {
  toast: (options: Omit<Toast, 'id'>) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

const typeConfig: Record<
  ToastType,
  { icon: typeof CheckCircle2; color: string; borderColor: string }
> = {
  success: {
    icon: CheckCircle2,
    color: 'text-emerald-400',
    borderColor: 'border-l-emerald-500',
  },
  error: {
    icon: AlertCircle,
    color: 'text-rose-400',
    borderColor: 'border-l-rose-500',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    borderColor: 'border-l-amber-500',
  },
  info: {
    icon: Info,
    color: 'text-blue-400',
    borderColor: 'border-l-blue-500',
  },
};

function ToastItem({
  toast: t,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const { icon: Icon, color, borderColor } = typeConfig[t.type];
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const duration = t.duration ?? 5000;
    timerRef.current = setTimeout(() => onDismiss(t.id), duration);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [t.id, t.duration, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: distance.lg, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: distance.xl * 2, scale: 0.97 }}
      transition={transitions.base}
      className={cn(
        'w-80 bg-neutral-surface border border-neutral-border rounded-lg shadow-xl border-l-2 overflow-hidden',
        borderColor
      )}
    >
      <div className="flex items-start gap-3 p-3">
        <Icon className={cn('size-[18px] mt-0.5 shrink-0', color)} />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-slate-200">{t.title}</p>
          {t.message && (
            <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">
              {t.message}
            </p>
          )}
          {t.actionLabel && t.onAction && (
            <button
              onClick={() => {
                t.onAction?.();
                onDismiss(t.id);
              }}
              className="mt-1.5 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {t.actionLabel}
            </button>
          )}
        </div>
        <button
          onClick={() => onDismiss(t.id)}
          className="p-0.5 text-slate-500 hover:text-slate-300 transition-colors shrink-0"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((options: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...options, id }]);
    return id;
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
