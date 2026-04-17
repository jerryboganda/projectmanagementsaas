export default function Loading() {
  return (
    <div className="flex h-screen bg-[#0a0a0a]">
      {/* Sidebar placeholder */}
      <div className="hidden md:flex w-64 flex-shrink-0 border-r border-[#222222] bg-[#111111] flex-col" />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header placeholder */}
        <div className="h-14 border-b border-[#222222] bg-[#111111]/50 flex items-center px-6">
          <div className="h-4 w-32 bg-white/[0.06] rounded animate-pulse" />
        </div>

        {/* Timeline / Gantt skeleton */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left column: task names */}
          <div className="w-56 border-r border-[#222222] bg-[#111111]/50 flex flex-col">
            {/* Column header */}
            <div className="h-10 border-b border-[#222222] px-4 flex items-center">
              <div className="h-3 w-16 bg-white/[0.06] rounded animate-pulse" />
            </div>

            {/* Task name rows */}
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-10 border-b border-[#222222] px-4 flex items-center"
              >
                <div
                  className="h-3 bg-white/[0.06] rounded animate-pulse"
                  style={{ width: `${45 + ((i * 23) % 45)}%` }}
                />
              </div>
            ))}
          </div>

          {/* Right area: Gantt bars */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Timeline header with date markers */}
            <div className="h-10 border-b border-[#222222] flex items-center gap-16 px-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-3 w-12 bg-white/[0.06] rounded animate-pulse" />
              ))}
            </div>

            {/* Gantt rows with horizontal bars */}
            {[35, 60, 25, 80, 45, 70, 30, 55, 40, 65].map((width, i) => (
              <div
                key={i}
                className="h-10 border-b border-[#222222] flex items-center px-4"
              >
                <div
                  className="h-5 bg-white/[0.06] rounded animate-pulse"
                  style={{
                    width: `${width}%`,
                    marginLeft: `${(i * 13) % 30}%`,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
