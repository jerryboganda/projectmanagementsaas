"use client";

import { useState } from "react";
import { type InboxItem } from "./data";
import { motion } from "motion/react";
import { Check, Archive, Filter, CheckCircle2, Search, Bookmark, CheckSquare, ChevronDown, Inbox } from "lucide-react";
import Image from "next/image";
import { EmptyState } from "@/components/ui/empty-state";

interface Props {
  items: InboxItem[];
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onArchive: (id: string) => void;
  onMarkAllAsRead: () => void;
  onSave: (id: string) => void;
  onDone: (id: string) => void;
}

export function InboxList({ items, activeFilter, onSelectFilter, selectedId, onSelect, onMarkAsRead, onArchive, onMarkAllAsRead, onSave, onDone }: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  let filteredItems = items;
  if (activeFilter === 'mentions') filteredItems = items.filter(i => i.type === 'mention');
  if (activeFilter === 'assigned') filteredItems = items.filter(i => i.type === 'assignment');
  if (activeFilter === 'saved') filteredItems = items.filter(i => i.saved);
  if (activeFilter === 'done') filteredItems = items.filter(i => i.done);
  
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filteredItems = filteredItems.filter(i => 
      i.title.toLowerCase().includes(query) || 
      i.description.toLowerCase().includes(query) ||
      i.actor.name.toLowerCase().includes(query) ||
      i.entityLabel?.toLowerCase().includes(query) ||
      i.entityId?.toLowerCase().includes(query)
    );
  }
  
  const grouped = filteredItems.reduce((acc, item) => {
    if (!acc[item.dateGroup]) acc[item.dateGroup] = [];
    acc[item.dateGroup].push(item);
    return acc;
  }, {} as Record<string, InboxItem[]>);

  const groupOrder = ['Today', 'Yesterday', 'Older'];

  return (
    <div className="w-full md:w-[420px] flex-shrink-0 border-r border-neutral-border bg-background-dark flex flex-col h-full">
      <div className="h-14 border-b border-neutral-border flex items-center justify-between px-4 flex-shrink-0 bg-neutral-surface/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <h2 className="text-[14px] font-semibold text-slate-100 hidden md:block">
            {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}
          </h2>
          
          {/* Mobile Filter Dropdown */}
          <div className="relative md:hidden flex items-center">
            <select 
              value={activeFilter}
              onChange={(e) => onSelectFilter(e.target.value)}
              className="appearance-none bg-transparent text-[14px] font-semibold text-slate-100 focus:outline-none pr-6 cursor-pointer"
            >
              <option value="inbox" className="bg-background-dark text-slate-200">Inbox</option>
              <option value="mentions" className="bg-background-dark text-slate-200">Mentions</option>
              <option value="assigned" className="bg-background-dark text-slate-200">Assigned</option>
              <option value="saved" className="bg-background-dark text-slate-200">Saved</option>
              <option value="done" className="bg-background-dark text-slate-200">Done</option>
            </select>
            <ChevronDown className="absolute right-0 size-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-sm transition-colors" 
            title="Mark all as read"
            onClick={onMarkAllAsRead}
          >
            <CheckCircle2 className="size-[16px]" />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-sm transition-colors" title="Filter">
            <Filter className="size-[16px]" />
          </button>
        </div>
      </div>

      <div className="p-3 border-b border-neutral-border/50 bg-background-dark/50">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search inbox..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.03] border border-neutral-border/50 rounded-md pl-8 pr-3 py-1.5 text-[13px] text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {groupOrder.map(group => {
          const groupItems = grouped[group];
          if (!groupItems || groupItems.length === 0) return null;
          
          return (
            <div key={group}>
              <div className="px-4 py-2 sticky top-0 bg-background-dark/95 backdrop-blur-sm z-10 border-b border-neutral-border/50">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{group}</span>
              </div>
              <div className="divide-y divide-neutral-border/50">
                {groupItems.map(item => (
                  <InboxRow 
                    key={item.id} 
                    item={item} 
                    isSelected={selectedId === item.id} 
                    onSelect={() => onSelect(item.id)} 
                    onMarkAsRead={() => onMarkAsRead(item.id)}
                    onArchive={() => onArchive(item.id)}
                    onSave={() => onSave(item.id)}
                    onDone={() => onDone(item.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
        {filteredItems.length === 0 && (
          <EmptyState
            icon={Inbox}
            title="All caught up!"
            description="You have no notifications matching these filters"
          />
        )}
      </div>
    </div>
  );
}

function InboxRow({ item, isSelected, onSelect, onMarkAsRead, onArchive, onSave, onDone }: { item: InboxItem, isSelected: boolean, onSelect: () => void, onMarkAsRead: () => void, onArchive: () => void, onSave: () => void, onDone: () => void }) {
  return (
    <div 
      onClick={onSelect}
      className={`relative p-4 cursor-pointer transition-colors group ${
        isSelected ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'
      }`}
    >
      {isSelected && (
        <motion.div 
          layoutId="selectedRowIndicator"
          className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      
      <div className="flex gap-3">
        <div className="relative mt-0.5 flex-shrink-0">
          <div className="size-8 rounded-sm bg-slate-800 border border-neutral-border flex items-center justify-center text-[11px] font-medium text-slate-300 overflow-hidden">
            {item.actor.avatar ? (
              <Image src={item.actor.avatar} alt={item.actor.name} width={32} height={32} className="size-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              item.actor.initials
            )}
          </div>
          {item.unread && (
            <span className="absolute -top-1 -right-1 size-2.5 rounded-full bg-primary border-2 border-background-dark shadow-[0_0_8px_rgba(19,19,236,0.6)]" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 truncate">
              <span className={`text-[13px] truncate ${item.unread ? 'font-semibold text-slate-100' : 'font-medium text-slate-300'}`}>
                {item.actor.name}
              </span>
              <span className="text-[13px] text-slate-500 truncate">{item.title}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 flex-shrink-0">{item.timestamp}</span>
          </div>
          
          <p className={`text-[13px] truncate mb-2 ${item.unread ? 'text-slate-200' : 'text-slate-400'}`}>
            {item.description}
          </p>
          
          <div className="flex items-center gap-2">
            {item.entityLabel && (
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider border border-neutral-border px-1.5 py-0.5 rounded-sm bg-white/[0.02]">
                {item.entityLabel}
              </span>
            )}
            {item.entityId && (
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider border border-neutral-border px-1.5 py-0.5 rounded-sm bg-white/[0.02]">
                {item.entityId.slice(0, 8)}
              </span>
            )}
            {item.priority && (
              <span className={`text-[10px] px-1.5 py-0.5 border rounded-sm ${
                item.priority === 'Urgent' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                item.priority === 'High' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                'bg-slate-500/10 text-slate-400 border-slate-500/20'
              }`}>
                {item.priority}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hover Actions */}
      <div className="absolute right-3 top-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-background-dark/90 backdrop-blur-sm p-1 rounded-sm border border-neutral-border shadow-sm">
        {item.unread && (
          <button 
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/10 rounded-sm transition-colors" 
            title="Mark as read" 
            onClick={(e) => { e.stopPropagation(); onMarkAsRead(); }}
          >
            <Check className="size-3.5" />
          </button>
        )}
        <button 
          className={`p-1.5 rounded-sm transition-colors ${item.saved ? 'text-primary hover:bg-primary/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/10'}`}
          title={item.saved ? "Unsave" : "Save"}
          onClick={(e) => { e.stopPropagation(); onSave(); }}
        >
          <Bookmark className="size-3.5" fill={item.saved ? "currentColor" : "none"} />
        </button>
        <button 
          className={`p-1.5 rounded-sm transition-colors ${item.done ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/10'}`}
          title={item.done ? "Mark as undone" : "Mark as done"}
          onClick={(e) => { e.stopPropagation(); onDone(); }}
        >
          <CheckSquare className="size-3.5" />
        </button>
        <button 
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/10 rounded-sm transition-colors" 
          title="Archive" 
          onClick={(e) => { e.stopPropagation(); onArchive(); }}
        >
          <Archive className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
