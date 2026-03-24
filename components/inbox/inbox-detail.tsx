"use client";

import { type InboxItem } from "./data";
import { motion } from "motion/react";
import {
  Archive,
  ArrowLeft,
  Bookmark,
  Check,
  CheckSquare,
  MoreHorizontal,
  X,
} from "lucide-react";
import Image from "next/image";

interface Props {
  item: InboxItem;
  onClose: () => void;
  onMarkAsRead: () => void;
  onArchive: () => void;
  onSave: () => void;
  onDone: () => void;
}

export function InboxDetail({ item, onClose, onMarkAsRead, onArchive, onSave, onDone }: Props) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
      className="flex-1 flex flex-col bg-neutral-surface border-l border-neutral-border h-full"
    >
      {/* Toolbar */}
      <div className="h-14 border-b border-neutral-border flex items-center justify-between px-4 flex-shrink-0 bg-neutral-surface/50 backdrop-blur-sm">
        <div className="flex items-center gap-1">
          <button onClick={onClose} className="md:hidden p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-sm transition-colors mr-1" title="Back to list">
            <ArrowLeft className="size-4" />
          </button>
          {item.unread && (
            <button onClick={onMarkAsRead} className="px-2 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-sm transition-colors flex items-center gap-1.5" title="Mark as read">
              <Check className="size-4" />
              <span className="hidden sm:inline text-[12px] font-medium">Mark Read</span>
            </button>
          )}
          <button onClick={onSave} className={`px-2 py-1.5 rounded-sm transition-colors flex items-center gap-1.5 ${item.saved ? 'text-primary hover:bg-primary/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`} title={item.saved ? "Unsave" : "Save"}>
            <Bookmark className="size-4" fill={item.saved ? "currentColor" : "none"} />
            <span className="hidden sm:inline text-[12px] font-medium">{item.saved ? "Saved" : "Save"}</span>
          </button>
          <button onClick={onDone} className={`px-2 py-1.5 rounded-sm transition-colors flex items-center gap-1.5 ${item.done ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`} title={item.done ? "Mark as undone" : "Mark as done"}>
            <CheckSquare className="size-4" />
            <span className="hidden sm:inline text-[12px] font-medium">{item.done ? "Done" : "Mark Done"}</span>
          </button>
          <button onClick={onArchive} className="px-2 py-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-sm transition-colors flex items-center gap-1.5" title="Archive">
            <Archive className="size-4" />
            <span className="hidden sm:inline text-[12px] font-medium">Archive</span>
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-sm transition-colors">
            <MoreHorizontal className="size-4" />
          </button>
          <div className="w-px h-4 bg-neutral-border mx-1"></div>
          <button onClick={onClose} className="hidden md:flex p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-sm transition-colors">
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-sm bg-slate-800 border border-neutral-border flex items-center justify-center text-[14px] font-medium text-slate-300 overflow-hidden">
                {item.actor.avatar ? (
                  <Image src={item.actor.avatar} alt={item.actor.name} width={40} height={40} className="size-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  item.actor.initials
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-slate-100">{item.actor.name}</span>
                  <span className="text-[13px] text-slate-500">{item.title}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">{item.timestamp}</span>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="text-[14px] text-slate-200 leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Context Card */}
          {(item.entityLabel || item.entityId) && (
            <div className="mt-6 border border-neutral-border bg-background-dark rounded-sm p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
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
                </div>
              </div>
              <h4 className="text-[14px] font-medium text-slate-200">{item.title}</h4>
              <p className="mt-2 text-[13px] text-slate-500">
                This notification is now backed by the live notifications API. Linked entity navigation
                will land in a follow-on migration once those surfaces are fully API-backed too.
              </p>
            </div>
          )}

          <div className="mt-8 border border-neutral-border bg-background-dark rounded-sm p-4">
            <p className="text-[13px] font-medium text-slate-200">Live triage actions only</p>
            <p className="mt-2 text-[13px] text-slate-500 leading-relaxed">
              Mark read, archive, save, and done are available here. Threaded replies are still
              mock-only elsewhere in the prototype, so they are intentionally disabled on the live
              notifications flow.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
