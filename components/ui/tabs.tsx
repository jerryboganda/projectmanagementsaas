'use client';

import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  variant?: 'underline' | 'pills' | 'bordered';
  size?: 'sm' | 'md';
  className?: string;
}

const sizeClasses: Record<NonNullable<TabsProps['size']>, string> = {
  sm: 'text-xs px-2.5 py-1.5 gap-1.5',
  md: 'text-sm px-3 py-2 gap-2',
};

export function Tabs({
  tabs,
  activeTab,
  onTabChange,
  variant = 'underline',
  size = 'md',
  className,
}: TabsProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = tabs.findIndex((t) => t.id === activeTab);
    let nextIndex = currentIndex;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      e.preventDefault();
      nextIndex = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      nextIndex = tabs.length - 1;
    } else {
      return;
    }

    onTabChange(tabs[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  };

  const getTabClasses = (isActive: boolean) => {
    switch (variant) {
      case 'underline':
        return cn(
          'border-b-2 -mb-px',
          isActive
            ? 'border-[#1313ec] text-slate-100'
            : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
        );
      case 'pills':
        return cn(
          'rounded-md',
          isActive
            ? 'bg-white/[0.06] text-slate-100'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
        );
      case 'bordered':
        return cn(
          'rounded-md border',
          isActive
            ? 'border-[#222222] bg-[#111111] text-slate-100'
            : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-[#222222]'
        );
    }
  };

  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      onKeyDown={handleKeyDown}
      className={cn(
        'flex items-center gap-1',
        variant === 'underline' && 'border-b border-[#222222]',
        className
      )}
    >
      {tabs.map((tab, i) => (
        <button
          key={tab.id}
          ref={(el) => { tabRefs.current[i] = el; }}
          role="tab"
          id={`tab-${tab.id}`}
          aria-selected={tab.id === activeTab}
          aria-controls={`tabpanel-${tab.id}`}
          tabIndex={tab.id === activeTab ? 0 : -1}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'inline-flex items-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1313ec]',
            sizeClasses[size],
            getTabClasses(tab.id === activeTab)
          )}
        >
          {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={cn(
                'inline-flex items-center justify-center rounded-full text-[10px] font-medium min-w-[18px] h-[18px] px-1',
                tab.id === activeTab
                  ? 'bg-[#1313ec]/20 text-blue-400'
                  : 'bg-white/[0.06] text-slate-500'
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
