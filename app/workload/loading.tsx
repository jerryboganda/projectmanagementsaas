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

        {/* Workload skeleton */}
        <div className="flex-1 overflow-auto p-6">
          {/* Page title + controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 w-28 bg-white/[0.06] rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="h-8 w-24 bg-white/[0.06] rounded animate-pulse" />
              <div className="h-8 w-24 bg-white/[0.06] rounded animate-pulse" />
            </div>
          </div>

          {/* Team member avatars row */}
          <div className="flex items-center gap-4 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className="h-10 w-10 bg-white/[0.06] rounded-full animate-pulse" />
                <div className="h-2.5 w-14 bg-white/[0.06] rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* Horizontal bar chart rows */}
          <div className="rounded-lg border border-[#222222] bg-[#111111] overflow-hidden">
            {[75, 45, 90, 60, 30, 85, 50].map((width, i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-4 py-3.5 border-b border-[#222222] last:border-b-0"
              >
                {/* Member name + avatar */}
                <div className="flex items-center gap-3 w-44 flex-shrink-0">
                  <div className="h-7 w-7 bg-white/[0.06] rounded-full animate-pulse" />
                  <div className="h-3 w-20 bg-white/[0.06] rounded animate-pulse" />
                </div>

                {/* Bar */}
                <div className="flex-1 flex items-center">
                  <div
                    className="h-6 bg-white/[0.06] rounded animate-pulse"
                    style={{ width: `${width}%` }}
                  />
                </div>

                {/* Hours label */}
                <div className="h-3 w-10 bg-white/[0.06] rounded animate-pulse flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
