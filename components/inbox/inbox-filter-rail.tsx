"use client";

import { Inbox, AtSign, UserCheck, Bookmark, CheckSquare } from "lucide-react";
import { motion } from "motion/react";

interface Props {
  activeFilter: string;
  onSelectFilter: (f: string) => void;
  unreadCount: number;
}

const filters = [
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'mentions', label: 'Mentions', icon: AtSign },
  { id: 'assigned', label: 'Assigned to me', icon: UserCheck },
  { id: 'saved', label: 'Saved', icon: Bookmark },
  { id: 'done', label: 'Done', icon: CheckSquare },
];

export function InboxFilterRail({ activeFilter, onSelectFilter, unreadCount }: Props) {
  return (
    <div className="w-56 flex-shrink-0 border-r border-neutral-border bg-neutral-surface/30 flex flex-col py-4 px-3">
      <div className="space-y-0.5">
        {filters.map(f => {
          const isActive = activeFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => onSelectFilter(f.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-sm text-[13px] transition-colors relative group ${
                isActive ? 'text-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="activeInboxFilter" 
                  className="absolute inset-0 bg-white/10 rounded-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <div className="flex items-center gap-2.5 relative z-10">
                <f.icon className={`size-[16px] ${isActive ? 'text-primary' : 'text-slate-500 group-hover:text-slate-400'}`} />
                <span className="font-medium">{f.label}</span>
              </div>
              {f.id === 'inbox' && unreadCount > 0 && (
                <span className="relative z-10 text-[10px] font-mono bg-primary/20 text-primary px-1.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
