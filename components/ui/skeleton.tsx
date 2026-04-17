'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

const variantClasses: Record<NonNullable<SkeletonProps['variant']>, string> = {
  text: 'rounded-sm h-4 w-full',
  circular: 'rounded-full',
  rectangular: 'rounded-sm',
};

function formatDimension(value: string | number): string {
  return typeof value === 'number' ? `${value}px` : value;
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  lines,
}: SkeletonProps) {
  const style: React.CSSProperties = {};
  if (width !== undefined) style.width = formatDimension(width);
  if (height !== undefined) style.height = formatDimension(height);

  if (lines && lines > 1 && variant === 'text') {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className={cn(
              'animate-pulse bg-white/[0.06]',
              variantClasses.text,
              i === lines - 1 && 'w-3/4',
            )}
            style={i < lines - 1 ? style : { ...style, width: style.width ?? '75%' }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'animate-pulse bg-white/[0.06]',
        variantClasses[variant],
        className,
      )}
      style={style}
    />
  );
}

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-white/[0.06] bg-[#111111] p-4 space-y-4',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={10} />
        </div>
      </div>
      <Skeleton variant="text" lines={3} />
    </div>
  );
}

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: SkeletonTableProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-white/[0.06] bg-[#111111] overflow-hidden',
        className,
      )}
    >
      {/* Header */}
      <div
        className="grid gap-4 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} height={12} width="70%" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }, (_, rowIdx) => (
        <div
          key={rowIdx}
          className={cn(
            'grid gap-4 px-4 py-3',
            rowIdx < rows - 1 && 'border-b border-white/[0.04]',
          )}
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }, (_, colIdx) => (
            <Skeleton key={colIdx} height={12} />
          ))}
        </div>
      ))}
    </div>
  );
}

interface SkeletonAvatarProps {
  size?: number;
  className?: string;
}

export function SkeletonAvatar({ size = 40, className }: SkeletonAvatarProps) {
  return (
    <Skeleton
      variant="circular"
      width={size}
      height={size}
      className={className}
    />
  );
}
