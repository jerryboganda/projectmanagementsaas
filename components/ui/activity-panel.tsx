'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import type { Comment, ActivityItem, User } from '@/types/shared';
import {
  MessageSquare,
  GitCommit,
  UserCheck,
  CheckCircle2,
  ArrowRightLeft,
  Pencil,
  Reply,
  Send,
  Plus,
} from 'lucide-react';

// === Props ===

interface ActivityPanelProps {
  entityId: string;
  entityType: 'task' | 'project' | 'goal' | 'initiative' | 'doc';
  className?: string;
}

// === Mock Data ===

const mockUsers: Record<string, User> = {
  u1: { id: 'u1', name: 'Sarah Chen', initials: 'SC' },
  u2: { id: 'u2', name: 'Alex Rivera', initials: 'AR' },
  u3: { id: 'u3', name: 'Jordan Lee', initials: 'JL' },
  u4: { id: 'u4', name: 'Morgan Patel', initials: 'MP' },
  me: { id: 'me', name: 'You', initials: 'YO' },
};

const mockActivity: ActivityItem[] = [
  {
    id: 'a1',
    type: 'completed',
    description: 'marked this as complete',
    actor: mockUsers.u1,
    timestamp: '2026-03-18T09:15:00Z',
  },
  {
    id: 'a2',
    type: 'commented',
    description: 'left a comment',
    actor: mockUsers.u3,
    timestamp: '2026-03-17T16:42:00Z',
  },
  {
    id: 'a3',
    type: 'status_changed',
    description: 'changed status from In Progress to In Review',
    actor: mockUsers.u2,
    timestamp: '2026-03-17T11:05:00Z',
    metadata: { from: 'In Progress', to: 'In Review' },
  },
  {
    id: 'a4',
    type: 'assigned',
    description: 'assigned this to Sarah Chen',
    actor: mockUsers.u4,
    timestamp: '2026-03-16T14:30:00Z',
  },
  {
    id: 'a5',
    type: 'updated',
    description: 'updated the description',
    actor: mockUsers.u2,
    timestamp: '2026-03-15T10:20:00Z',
  },
  {
    id: 'a6',
    type: 'created',
    description: 'created this item',
    actor: mockUsers.u4,
    timestamp: '2026-03-14T09:00:00Z',
  },
];

const initialComments: Comment[] = [
  {
    id: 'c1',
    content:
      'The new design looks great. I think we should move forward with the rounded variant for the cards.',
    author: mockUsers.u1,
    createdAt: '2026-03-17T16:42:00Z',
  },
  {
    id: 'c2',
    content:
      'Agreed. I also updated the spacing to match the latest design tokens. Please review when you get a chance.',
    author: mockUsers.me,
    createdAt: '2026-03-17T17:10:00Z',
  },
  {
    id: 'c3',
    content: 'Looks good to me. Approving this for merge.',
    author: mockUsers.u3,
    createdAt: '2026-03-18T09:05:00Z',
  },
];

// === Helpers ===

type ActivityType = ActivityItem['type'];

const activityIconMap: Record<ActivityType, { icon: typeof GitCommit; color: string }> = {
  created: { icon: Plus, color: 'text-emerald-400 bg-emerald-500/15' },
  updated: { icon: Pencil, color: 'text-blue-400 bg-blue-500/15' },
  commented: { icon: MessageSquare, color: 'text-[#1313ec] bg-[#1313ec]/15' },
  assigned: { icon: UserCheck, color: 'text-purple-400 bg-purple-500/15' },
  status_changed: { icon: ArrowRightLeft, color: 'text-amber-400 bg-amber-500/15' },
  completed: { icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/15' },
  mentioned: { icon: GitCommit, color: 'text-slate-400 bg-white/[0.06]' },
};

function relativeTime(iso: string): string {
  const now = new Date();
  const date = new Date(iso);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// === Sub-components ===

function Avatar({ user, size = 'sm' }: { user: User; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-7 w-7 text-[11px]';
  return (
    <div
      className={cn(
        'rounded-full bg-white/[0.08] border border-white/[0.06] flex items-center justify-center font-medium text-slate-300 shrink-0',
        sizeClass
      )}
    >
      {user.initials}
    </div>
  );
}

function ActivityItemRow({ item }: { item: ActivityItem }) {
  const { icon: Icon, color } = activityIconMap[item.type];
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-2.5 py-2.5"
    >
      <div className={cn('rounded-full p-1 mt-0.5 shrink-0', color)}>
        <Icon className="h-3 w-3" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs leading-relaxed text-slate-300">
          <span className="font-medium text-slate-200">{item.actor.name}</span>{' '}
          {item.description}
        </p>
        <span className="text-[10px] text-slate-500">{relativeTime(item.timestamp)}</span>
      </div>
    </motion.div>
  );
}

function CommentRow({
  comment,
  isOwn,
}: {
  comment: Comment;
  isOwn: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="group py-3 first:pt-0"
    >
      <div className="flex items-start gap-2.5">
        <Avatar user={comment.author} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-200">
              {comment.author.name}
            </span>
            <span className="text-[10px] text-slate-500">
              {relativeTime(comment.createdAt)}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            {comment.content}
          </p>
          <div className="mt-1.5 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors">
              <Reply className="h-3 w-3" />
              Reply
            </button>
            {isOwn && (
              <button className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors">
                <Pencil className="h-3 w-3" />
                Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// === Main Component ===

type Tab = 'activity' | 'comments';

export function ActivityPanel({ entityId, entityType, className }: ActivityPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('activity');
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = () => {
    const text = inputValue.trim();
    if (!text) return;

    const newComment: Comment = {
      id: `c-${Date.now()}`,
      content: text,
      author: mockUsers.me,
      createdAt: new Date().toISOString(),
    };
    setComments((prev) => [...prev, newComment]);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'activity', label: 'Activity' },
    { key: 'comments', label: 'Comments', count: comments.length },
  ];

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Tab Switcher */}
      <div className="flex items-center gap-4 border-b border-[#222222] px-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'relative pb-2.5 text-xs font-medium transition-colors',
              activeTab === tab.key
                ? 'text-slate-100'
                : 'text-slate-500 hover:text-slate-300'
            )}
          >
            <span className="flex items-center gap-1.5">
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full',
                    activeTab === tab.key
                      ? 'bg-[#1313ec]/20 text-[#7b7bff]'
                      : 'bg-white/[0.05] text-slate-500'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </span>
            {activeTab === tab.key && (
              <motion.div
                layoutId={`activity-panel-tab-${entityId}`}
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1313ec] rounded-full"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <AnimatePresence mode="wait">
          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="divide-y divide-white/[0.04] px-1 pt-1"
            >
              {mockActivity.map((item) => (
                <ActivityItemRow key={item.id} item={item} />
              ))}
            </motion.div>
          )}

          {activeTab === 'comments' && (
            <motion.div
              key="comments"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col"
            >
              {/* Comment list */}
              <div className="divide-y divide-white/[0.04] px-1 pt-1">
                {comments.map((comment) => (
                  <CommentRow
                    key={comment.id}
                    comment={comment}
                    isOwn={comment.author.id === 'me'}
                  />
                ))}
              </div>

              {/* Comment input */}
              <div className="mt-3 px-1 pb-1">
                <div className="flex items-end gap-2 rounded-lg border border-[#222222] bg-[#111111] p-2 focus-within:border-[#1313ec]/50 transition-colors">
                  <textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Add a comment..."
                    rows={1}
                    className="flex-1 resize-none bg-transparent text-xs text-slate-300 placeholder:text-slate-600 outline-none leading-relaxed min-h-[24px] max-h-[96px]"
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={!inputValue.trim()}
                    className={cn(
                      'shrink-0 rounded-md p-1.5 transition-colors',
                      inputValue.trim()
                        ? 'bg-[#1313ec] text-white hover:bg-[#1313ec]/80 cursor-pointer'
                        : 'bg-white/[0.05] text-slate-600 cursor-not-allowed'
                    )}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
