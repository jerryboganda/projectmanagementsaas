'use client';

import { type ReactNode, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  onClick?: () => void;
}

interface CardHeaderProps {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<NonNullable<CardProps['variant']>, string> = {
  default: 'bg-[#111111] border border-[#222222]',
  outlined: 'bg-transparent border border-[#222222]',
  elevated: 'bg-[#111111] border border-[#222222] shadow-lg shadow-black/20',
};

const paddingClasses: Record<NonNullable<CardProps['padding']>, string> = {
  none: 'p-0',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({
  children,
  className,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  onClick,
}: CardProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={cn(
        'rounded-lg',
        variantClasses[variant],
        paddingClasses[padding],
        hoverable && 'transition-colors hover:border-slate-600',
        onClick && 'cursor-pointer',
        className
      )}
      {...(onClick && {
        role: 'button',
        tabIndex: 0,
        onClick,
        onKeyDown: handleKeyDown,
      })}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, action, className }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="text-sm font-medium text-slate-100">{children}</div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn('text-sm text-slate-300', className)}>{children}</div>;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center border-t border-[#222222] pt-3 mt-3',
        className
      )}
    >
      {children}
    </div>
  );
}
