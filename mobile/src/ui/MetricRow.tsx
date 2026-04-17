export function MetricRow({
  title,
  value,
  trend,
  trendDir,
  borderBottom = true,
}: {
  title: string;
  value: number | string;
  trend?: string;
  trendDir?: 'up' | 'down';
  borderBottom?: boolean;
}) {
  const trendColor =
    trendDir === 'up'
      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
      : trendDir === 'down'
      ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
      : 'bg-[#1A1A1A] text-slate-400 border-[#222]';

  return (
    <div
      className={`flex items-end justify-between px-4 py-3 ${
        borderBottom ? 'border-b border-[#1A1A1A]' : ''
      }`}
    >
      <div className="flex flex-col">
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-slate-500">
          {title}
        </span>
        <span className="text-[32px] leading-none font-semibold tracking-tight text-slate-100 mt-1">
          {value}
        </span>
      </div>
      {trend ? (
        <span
          className={`font-mono text-[10px] uppercase tracking-[0.08em] px-1.5 py-0.5 rounded-[3px] border ${trendColor}`}
        >
          {trend}
        </span>
      ) : null}
    </div>
  );
}
