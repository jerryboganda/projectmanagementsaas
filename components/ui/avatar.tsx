'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';

interface AvatarProps {
  src?: string | null;
  alt: string;
  initials?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away' | 'busy';
  className?: string;
}

interface AvatarGroupProps {
  users: { src?: string | null; alt: string; initials?: string }[];
  max?: number;
  size?: AvatarProps['size'];
  className?: string;
}

const sizeMap: Record<NonNullable<AvatarProps['size']>, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

const sizeClasses: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

const statusColors: Record<NonNullable<AvatarProps['status']>, string> = {
  online: 'bg-emerald-500',
  offline: 'bg-slate-500',
  away: 'bg-amber-400',
  busy: 'bg-rose-500',
};

const statusDotSize: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'h-1.5 w-1.5 border',
  sm: 'h-2 w-2 border',
  md: 'h-2.5 w-2.5 border-2',
  lg: 'h-3 w-3 border-2',
  xl: 'h-3.5 w-3.5 border-2',
};

function hashToHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

export function Avatar({
  src,
  alt,
  initials,
  size = 'md',
  status,
  className,
}: AvatarProps) {
  const hue = initials ? hashToHue(initials) : 0;

  return (
    <span
      className={cn('relative inline-flex shrink-0', className)}
      role="img"
      aria-label={alt}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          width={sizeMap[size]}
          height={sizeMap[size]}
          className={cn('rounded-full object-cover', sizeClasses[size])}
        />
      ) : (
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-full font-medium text-white',
            sizeClasses[size]
          )}
          style={{ backgroundColor: `hsl(${hue}, 55%, 45%)` }}
          aria-hidden="true"
        >
          {initials?.slice(0, 2).toUpperCase() ?? '?'}
        </span>
      )}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-[#0a0a0a]',
            statusColors[status],
            statusDotSize[size]
          )}
          aria-label={status}
        />
      )}
    </span>
  );
}

export function AvatarGroup({
  users,
  max = 4,
  size = 'md',
  className,
}: AvatarGroupProps) {
  const visible = users.slice(0, max);
  const overflow = users.length - max;

  return (
    <div
      className={cn('flex items-center -space-x-2', className)}
      role="group"
      aria-label={`${users.length} users`}
    >
      {visible.map((user, i) => (
        <Avatar
          key={i}
          src={user.src}
          alt={user.alt}
          initials={user.initials}
          size={size}
          className="ring-2 ring-[#0a0a0a]"
        />
      ))}
      {overflow > 0 && (
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-full bg-white/[0.1] text-slate-300 font-medium ring-2 ring-[#0a0a0a]',
            sizeClasses[size]
          )}
          aria-label={`${overflow} more users`}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
