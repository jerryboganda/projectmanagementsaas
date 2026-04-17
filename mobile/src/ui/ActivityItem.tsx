import type { ReactNode } from 'react';

export function IssueKey({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#0066FF]">
      {children}
    </span>
  );
}

export function ActivityItem({
  initials,
  body,
  timeAgo,
}: {
  initials: string;
  body: ReactNode;
  timeAgo: string;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="size-7 rounded-[4px] bg-[#0066FF]/15 border border-[#0066FF]/25 text-[#0066FF] font-mono text-[10px] font-semibold uppercase tracking-wider flex items-center justify-center flex-shrink-0 mt-0.5">
        {initials.slice(0, 2)}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-slate-300 leading-relaxed">{body}</p>
        <p className="font-mono text-[10px] text-slate-500 mt-1 uppercase tracking-[0.08em]">
          {timeAgo}
        </p>
      </div>
    </div>
  );
}
