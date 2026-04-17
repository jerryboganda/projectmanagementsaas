import { motion } from 'motion/react';
import { PriorityBadge, Chip } from './Chip';
import { spring } from '../motion';

export interface IssueRowData {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  dateLabel?: string;
  overdueLabel?: string;
  status: 'open' | 'in-progress' | 'done';
  timeAgo?: string;
  assignee?: { initials: string };
}

function StatusGlyph({ status }: { status: IssueRowData['status'] }) {
  if (status === 'done')
    return (
      <span className="size-3.5 rounded-[3px] border border-emerald-500 bg-emerald-500/20 flex items-center justify-center">
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-[1px]" />
      </span>
    );
  if (status === 'in-progress')
    return (
      <span className="size-3.5 rounded-[3px] border border-[#0066FF] bg-[#0066FF]/20 flex items-center justify-center">
        <span className="w-1.5 h-1.5 bg-[#0066FF] rounded-full" />
      </span>
    );
  return <span className="size-3.5 rounded-[3px] border border-[#222] bg-[#111]" />;
}

function Avatar({ initials }: { initials: string }) {
  return (
    <span className="size-5 rounded-[3px] bg-[#0066FF]/20 border border-[#0066FF]/30 text-[#0066FF] font-mono text-[9px] font-semibold uppercase tracking-wider flex items-center justify-center flex-shrink-0">
      {initials.slice(0, 2)}
    </span>
  );
}

export function IssueRow({ issue }: { issue: IssueRowData }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.985, backgroundColor: '#141414' }}
      transition={spring.snappy}
      className="w-full flex items-center gap-3 px-4 py-3 text-left"
    >
      <StatusGlyph status={issue.status} />
      <PriorityBadge priority={issue.priority} />
      {issue.overdueLabel ? (
        <Chip tone="red">{issue.overdueLabel}</Chip>
      ) : null}
      {issue.dateLabel ? <Chip tone="neutral">{issue.dateLabel}</Chip> : null}
      <span className="flex-1 min-w-0 text-[13px] text-slate-200 truncate">
        {issue.title}
      </span>
      {issue.assignee ? <Avatar initials={issue.assignee.initials} /> : null}
      {issue.timeAgo ? (
        <span className="font-mono text-[10px] text-slate-500">{issue.timeAgo}</span>
      ) : null}
    </motion.button>
  );
}
