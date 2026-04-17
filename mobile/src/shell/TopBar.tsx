import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronsUpDown, Plus, X } from 'lucide-react';

const DESTINATIONS: Array<{ label: string; route: string }> = [
  { label: 'Dashboard', route: '/' },
  { label: 'Issues', route: '/issues' },
  { label: 'Projects', route: '/projects' },
  { label: 'Board', route: '/board' },
  { label: 'Calendar', route: '/calendar' },
  { label: 'Timeline', route: '/timeline' },
  { label: 'Sprints', route: '/sprints' },
  { label: 'Goals', route: '/goals' },
  { label: 'Portfolio', route: '/portfolio' },
  { label: 'Workload', route: '/workload' },
  { label: 'Reports', route: '/reports' },
  { label: 'Docs', route: '/docs' },
  { label: 'Time Tracking', route: '/time-tracking' },
  { label: 'Templates', route: '/templates' },
  { label: 'Automations', route: '/automations' },
  { label: 'Settings', route: '/settings' },
];

const CREATE_ACTIONS: Array<{ label: string; route: string }> = [
  { label: 'New Task', route: '/issues' },
  { label: 'New Project', route: '/projects' },
  { label: 'New Doc', route: '/docs' },
  { label: 'New Goal', route: '/goals' },
  { label: 'New Event', route: '/calendar' },
];

function LogoTile() {
  return (
    <span className="size-6 bg-[#0066FF] rounded-[4px] flex items-center justify-center flex-shrink-0">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
        <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex flex-col">
      <button type="button" onClick={onClose} aria-label="Close" className="flex-1 bg-black/60 backdrop-blur-sm" />
      <div
        className="bg-[#0A0A0A] border-t border-[#1A1A1A] max-h-[70vh] overflow-y-auto"
        style={{ paddingBottom: 'var(--safe-bottom)' }}
      >
        <div className="flex items-center justify-between px-4 h-12 border-b border-[#1A1A1A] sticky top-0 bg-[#0A0A0A] z-10">
          <h2 className="font-mono text-[12px] font-bold uppercase tracking-[0.1em] text-slate-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="size-7 flex items-center justify-center rounded-[4px] text-slate-400 hover:text-slate-100"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function TopBar() {
  const navigate = useNavigate();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <header
        className="fixed left-0 right-0 top-0 z-50 border-b border-[#1A1A1A] bg-[#0A0A0A]"
        style={{ paddingTop: 'var(--safe-top)', height: 'calc(var(--top-bar-height) + var(--safe-top))' }}
      >
        <div className="flex h-[var(--top-bar-height)] items-center justify-between px-4">
          <button
            type="button"
            onClick={() => setSwitcherOpen(true)}
            className="flex items-center gap-2.5 group"
            aria-label="Open destination switcher"
          >
            <LogoTile />
            <span className="font-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-100">
              Linear Precision PM
            </span>
            <ChevronsUpDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
          </button>

          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="size-8 rounded-[4px] bg-[#111] border border-[#1A1A1A] hover:border-[#0066FF]/40 hover:bg-[#0066FF]/10 text-slate-300 hover:text-[#0066FF] flex items-center justify-center transition-colors"
            aria-label="Create new"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </header>

      <Sheet open={switcherOpen} onClose={() => setSwitcherOpen(false)} title="Jump To">
        <div className="divide-y divide-[#1A1A1A]">
          {DESTINATIONS.map((d) => (
            <button
              key={d.route}
              type="button"
              onClick={() => {
                setSwitcherOpen(false);
                navigate(d.route);
              }}
              className="w-full flex items-center justify-between px-4 h-11 hover:bg-[#141414] text-left transition-colors"
            >
              <span className="text-[13px] text-slate-200">{d.label}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate-600">
                {d.route}
              </span>
            </button>
          ))}
        </div>
      </Sheet>

      <Sheet open={createOpen} onClose={() => setCreateOpen(false)} title="Create">
        <div className="divide-y divide-[#1A1A1A]">
          {CREATE_ACTIONS.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => {
                setCreateOpen(false);
                navigate(a.route);
              }}
              className="w-full flex items-center gap-3 px-4 h-11 hover:bg-[#141414] text-left transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-[#0066FF]" />
              <span className="text-[13px] text-slate-200">{a.label}</span>
            </button>
          ))}
        </div>
      </Sheet>
    </>
  );
}
