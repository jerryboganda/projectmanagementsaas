import { useMemo, useState } from 'react';
import { AlertCircle, CalendarOff, Loader2 } from 'lucide-react';
import { ScreenContainer } from './ScreenContainer';
import { SectionHeader, EmptyState } from '../ui';
import { useCalendar } from '../hooks/use-data';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function getStripDays() {
  const today = new Date();
  const days: Array<{ date: number; day: string; iso: string; isToday: boolean }> = [];
  for (let i = -3; i < 10; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      date: d.getDate(),
      day: DAY_NAMES[d.getDay()],
      iso: d.toISOString().slice(0, 10),
      isToday: i === 0,
    });
  }
  return days;
}

function dayRange(iso: string) {
  const start = new Date(`${iso}T00:00:00.000Z`).toISOString();
  const end = new Date(`${iso}T23:59:59.999Z`).toISOString();
  return { start, end };
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

export function CalendarScreen() {
  const days = getStripDays();
  const [selected, setSelected] = useState(days.find((d) => d.isToday)?.iso ?? days[0].iso);
  const today = new Date();
  const { start, end } = useMemo(() => dayRange(selected), [selected]);
  const calendar = useCalendar(start, end);

  const events = useMemo(
    () => (calendar.data ?? []).slice().sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    [calendar.data],
  );

  return (
    <ScreenContainer>
      <div className="px-4 py-3 border-b border-[#1A1A1A] flex items-center justify-between">
        <span className="font-mono text-[11px] text-slate-500 uppercase tracking-[0.1em]">
          {MONTHS[today.getMonth()]} {today.getFullYear()}
        </span>
        <button
          type="button"
          onClick={() => setSelected(days.find((d) => d.isToday)!.iso)}
          className="font-mono text-[11px] text-[#0066FF] uppercase tracking-[0.08em]"
        >
          Today
        </button>
      </div>

      <div className="px-4 py-3 flex gap-2 overflow-x-auto border-b border-[#1A1A1A]">
        {days.map((d) => {
          const active = d.iso === selected;
          return (
            <button
              key={d.iso}
              type="button"
              onClick={() => setSelected(d.iso)}
              className={`flex flex-col items-center justify-center w-11 h-14 rounded-[4px] flex-shrink-0 transition-colors ${
                active
                  ? 'bg-[#0066FF]/10 border border-[#0066FF]/20 text-[#0066FF]'
                  : 'bg-[#111] border border-[#1A1A1A] text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-[9px] font-mono uppercase tracking-[0.1em]">{d.day}</span>
              <span className="text-[15px] font-semibold mt-0.5">{d.date}</span>
              {d.isToday ? <span className="w-1 h-1 rounded-full bg-[#0066FF] mt-0.5" /> : null}
            </button>
          );
        })}
      </div>

      <SectionHeader title="Schedule" />
      {calendar.isLoading ? (
        <div className="flex items-center justify-center py-10 text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      ) : calendar.isError ? (
        <EmptyState
          icon={AlertCircle}
          title="Could not load calendar"
          description={calendar.error instanceof Error ? calendar.error.message : 'Try again later.'}
        />
      ) : events.length === 0 ? (
        <EmptyState icon={CalendarOff} title="No events" description="Nothing scheduled for this day." />
      ) : (
        <div className="divide-y divide-[#1A1A1A]">
          {events.map((e) => (
            <button
              key={e.id}
              type="button"
              className="group w-full flex items-center gap-3 px-4 py-3 hover:bg-[#141414] transition-colors text-left"
            >
              <span className="font-mono text-[11px] text-slate-500 w-12">
                {e.isAllDay ? 'ALL' : formatTime(e.startTime)}
              </span>
              <span className="w-1 h-10 rounded-full bg-[#0066FF]" style={e.color ? { background: e.color } : undefined} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-slate-200 truncate group-hover:text-slate-100">{e.title}</p>
                <p className="font-mono text-[11px] text-slate-500 mt-0.5">
                  {String(e.type).toUpperCase()}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </ScreenContainer>
  );
}
