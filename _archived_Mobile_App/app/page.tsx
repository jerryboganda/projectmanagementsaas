"use client";

import { useState } from 'react';
import { ChevronsUpDown, Plus, Inbox, List, LayoutGrid, Search, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';

export default function Page() {
  const [filter, setFilter] = useState('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const triageTasks = [
    { id: 1, status: 'Open', title: 'Update mobile navigation logic', time: '2h', type: 'urgent' },
    { id: 2, status: 'In Progress', title: 'Refactor Tailwind config for dark mode', time: '4h', type: 'progress' },
    { id: 3, status: 'Done', title: 'Fix contrast issues in login screen', time: '1d', type: 'done' },
    { id: 4, status: 'Open', title: 'Review PR #442: Design tokens', time: '3h', type: 'urgent' },
  ];

  const filteredTasks = filter === 'All' ? triageTasks : triageTasks.filter(t => t.status === filter);

  const getIconForType = (type: string) => {
    switch(type) {
      case 'urgent': return <span className="text-[#F97316] font-bold text-[15px] leading-none">!</span>;
      case 'progress': return <div className="w-2.5 h-2.5 rounded-full bg-[#0066FF]"></div>;
      case 'done': return <div className="w-3.5 h-3.5 rounded-full bg-slate-600 flex items-center justify-center"><svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></div>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-100 font-sans selection:bg-[#0066FF]/30 pb-20">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-4 h-14 border-b border-[#1A1A1A] sticky top-0 bg-[#0A0A0A] z-50">
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="size-6 bg-[#0066FF] rounded-[4px] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white"/>
              <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-[13px] font-semibold tracking-wide uppercase font-mono text-slate-100">Linear Precision PM</h1>
          <ChevronsUpDown className="w-4 h-4 text-slate-500" />
        </div>
        <button className="size-7 flex items-center justify-center rounded-[4px] bg-[#0066FF]/10 text-[#0066FF] border border-[#0066FF]/20 hover:bg-[#0066FF]/20 transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Metric Widgets */}
        <section className="grid grid-cols-1 gap-0 border-b border-[#1A1A1A]">
          <MetricRow title="Open Issues" value="24" trend="+12%" trendUp={true} />
          <MetricRow title="In Progress" value="8" trend="-2%" trendUp={false} />
          <MetricRow title="Completed" value="112" trend="+5%" trendUp={true} borderBottom={false} />
        </section>

        {/* Personal Triage */}
        <section className="mt-2">
          <div className="flex items-center justify-between px-4 py-4 border-b border-[#1A1A1A]">
            <h3 className="text-xs font-bold uppercase tracking-widest font-mono text-slate-100">Personal Triage</h3>
            <div className="flex items-center gap-4">
              <div className="relative">
                <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {filter} <ChevronDown className="w-3 h-3" />
                </button>
                {isFilterOpen && (
                  <div className="absolute right-0 mt-2 w-32 bg-[#1A1A1A] border border-[#222] rounded-[4px] shadow-xl z-10 py-1 overflow-hidden">
                    {['All', 'Open', 'In Progress', 'Done'].map(f => (
                      <button 
                        key={f} 
                        onClick={() => { setFilter(f); setIsFilterOpen(false); }} 
                        className={`block w-full text-left px-3 py-2 text-[11px] font-mono uppercase tracking-wider transition-colors ${filter === f ? 'bg-[#0066FF]/10 text-[#0066FF]' : 'text-slate-300 hover:bg-white/5 hover:text-slate-100'}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button className="text-[11px] text-[#0066FF] font-bold uppercase tracking-wider hover:text-[#0066FF]/80 transition-colors">View All</button>
            </div>
          </div>
          <div className="divide-y divide-[#1A1A1A]">
            {filteredTasks.length > 0 ? (
              filteredTasks.map(task => (
                <TriageItem 
                  key={task.id}
                  icon={getIconForType(task.type)} 
                  title={task.title} 
                  time={task.time} 
                />
              ))
            ) : (
              <div className="px-4 py-6 text-center text-[12px] text-slate-500 font-mono">No tasks found</div>
            )}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="mt-6">
          <div className="flex items-center px-4 py-4 border-b border-[#1A1A1A]">
            <h3 className="text-xs font-bold uppercase tracking-widest font-mono text-slate-100">Recent Activity</h3>
          </div>
          <div className="px-4 py-3 space-y-1">
            <ActivityItem 
              name="Alex Rivera"
              action="moved"
              target={<span className="font-mono text-[11px] bg-[#1A1A1A] px-1.5 py-0.5 rounded-[3px] text-slate-400">LIN-102</span>}
              destination={<span className="text-[#0066FF]">Done</span>}
              time="12m ago"
            />
            <ActivityItem 
              name="Jordan Smith"
              action="commented on"
              target={<span className="font-mono text-[11px] bg-[#1A1A1A] px-1.5 py-0.5 rounded-[3px] text-slate-400">LIN-89</span>}
              time="45m ago"
            />
            <ActivityItem 
              name="System"
              action="deployed"
              target={<span className="text-emerald-500 font-medium">v2.4.0-rc1</span>}
              destination="to production"
              time="2h ago"
            />
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] border-t border-[#1A1A1A] flex items-center h-[60px] px-2 z-50 pb-safe">
        <NavItem icon={<Inbox className="w-6 h-6" fill="currentColor" strokeWidth={1.5} />} label="Inbox" active />
        <NavItem icon={<List className="w-6 h-6" strokeWidth={1.5} />} label="Issues" />
        <NavItem icon={<LayoutGrid className="w-6 h-6" strokeWidth={1.5} />} label="Projects" />
        <NavItem icon={<Search className="w-6 h-6" strokeWidth={1.5} />} label="Search" />
      </nav>
    </div>
  );
}

function MetricRow({ title, value, trend, trendUp, borderBottom = true }: { title: string, value: string, trend: string, trendUp: boolean, borderBottom?: boolean }) {
  return (
    <div className={`px-4 py-5 flex items-center justify-between ${borderBottom ? 'border-b border-[#1A1A1A]' : ''} hover:bg-white/[0.02] transition-colors cursor-pointer`}>
      <div className="flex flex-col gap-1.5">
        <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold font-mono">{title}</p>
        <p className="text-[32px] leading-none font-bold tracking-tight text-slate-100">{value}</p>
      </div>
      <div className={`text-[11px] font-mono px-2 py-1 rounded-[3px] ${trendUp ? 'text-emerald-500 bg-emerald-500/10' : 'text-orange-500 bg-orange-500/10'}`}>
        {trend}
      </div>
    </div>
  );
}

function TriageItem({ icon, title, time }: { icon: React.ReactNode, title: string, time: string }) {
  return (
    <div className="flex items-center gap-4 px-4 h-[52px] hover:bg-[#141414] transition-colors cursor-pointer group relative">
      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#0066FF] opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="flex items-center justify-center">
        <div className="w-4 h-4 rounded-[3px] border border-slate-700 bg-transparent group-hover:border-slate-500 transition-colors"></div>
      </div>
      <div className="flex items-center justify-center w-4">
        {icon}
      </div>
      <p className="text-[13px] flex-1 truncate text-slate-300 group-hover:text-slate-100 transition-colors">{title}</p>
      <p className="text-[11px] font-mono text-slate-600">{time}</p>
    </div>
  );
}

function ActivityItem({ name, action, target, destination, time }: { name: string, action: string, target: React.ReactNode, destination?: React.ReactNode, time: string }) {
  return (
    <div className="flex gap-3.5 group cursor-pointer p-3 -mx-3 rounded-lg hover:bg-[#141414] border border-transparent hover:border-white/5 transition-all">
      <div className="size-8 rounded-[4px] bg-[#F3E8D6] flex-shrink-0 flex items-center justify-center overflow-hidden">
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-[#A89B8C]">
          <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" fill="currentColor" />
          <path d="M7 20C7 17.2386 9.23858 15 12 15C14.7614 15 17 17.2386 17 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <div className="flex-1 pt-0.5">
        <p className="text-[13px] text-slate-400 leading-relaxed">
          <span className="text-slate-100 font-semibold">{name}</span> {action} {target} {destination && <span>{destination}</span>}
        </p>
        <p className="text-[10px] font-mono text-slate-600 mt-0.5">{time}</p>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <button className={`flex flex-col flex-1 items-center justify-center gap-1.5 ${active ? 'text-[#0066FF]' : 'text-slate-500 hover:text-slate-300'} transition-colors group`}>
      <div className="mb-0.5">
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest font-mono">{label}</span>
    </button>
  );
}
