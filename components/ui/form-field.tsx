'use client';

import { type ReactNode, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

interface FormFieldBaseProps {
  label: string;
  error?: string;
  required?: boolean;
  className?: string;
  hint?: string;
}

/* ─── Text / Email / Password / Date Input ─── */

interface FormInputProps
  extends FormFieldBaseProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  as?: 'input';
}

/* ─── Textarea ─── */

interface FormTextareaProps
  extends FormFieldBaseProps,
    Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  as: 'textarea';
}

/* ─── Select ─── */

interface FormSelectProps
  extends FormFieldBaseProps,
    Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  as: 'select';
  children: ReactNode;
}

type FormFieldProps = FormInputProps | FormTextareaProps | FormSelectProps;

const baseInputClasses =
  'w-full bg-transparent border text-[13px] text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-primary rounded-sm transition-colors';

export const FormField = forwardRef<
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  FormFieldProps
>(function FormField(props, ref) {
  const { label, error, required, className, hint, ...rest } = props;
  const generatedId = useId();
  const fieldId = rest.id ?? generatedId;

  const inputClasses = cn(
    baseInputClasses,
    error ? 'border-rose-500/60 focus:border-rose-500' : 'border-neutral-border',
    props.as === 'textarea' ? 'px-3 py-2 min-h-[80px] resize-y' : 'h-8 px-3',
    props.as === 'select' ? 'appearance-none cursor-pointer' : ''
  );

  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={fieldId} className="flex items-center gap-1 text-[12px] font-medium text-slate-300">
        {label}
        {required && <span className="text-rose-500">*</span>}
      </label>

      {props.as === 'textarea' ? (
        <textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          id={fieldId}
          className={inputClasses}
          {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : props.as === 'select' ? (
        <select
          ref={ref as React.Ref<HTMLSelectElement>}
          id={fieldId}
          className={inputClasses}
          {...(rest as Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'>)}
        >
          {(props as FormSelectProps).children}
        </select>
      ) : (
        <input
          ref={ref as React.Ref<HTMLInputElement>}
          id={fieldId}
          className={inputClasses}
          {...(rest as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}

      {hint && !error && (
        <p className="text-[11px] text-slate-600">{hint}</p>
      )}
      {error && (
        <p className="text-[11px] text-rose-500">{error}</p>
      )}
    </div>
  );
});
