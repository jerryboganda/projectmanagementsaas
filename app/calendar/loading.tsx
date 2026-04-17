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

        {/* Calendar skeleton */}
        <div className="flex-1 overflow-auto p-6">
          {/* Month header */}
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 w-40 bg-white/[0.06] rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="h-8 w-8 bg-white/[0.06] rounded animate-pulse" />
              <div className="h-8 w-8 bg-white/[0.06] rounded animate-pulse" />
            </div>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 gap-px mb-px">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-8 flex items-center justify-center">
                <div className="h-3 w-8 bg-white/[0.06] rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* 5-row calendar grid */}
          <div className="grid grid-cols-7 gap-px border border-[#222222] rounded-lg overflow-hidden">
            {Array.from({ length: 35 }).map((_, i) => (
              <div
                key={i}
                className="h-24 bg-[#111111] p-2 flex flex-col gap-1"
              >
                <div className="h-3 w-5 bg-white/[0.06] rounded animate-pulse" />
                {i % 4 === 0 && (
                  <div className="h-4 w-full bg-white/[0.06] rounded animate-pulse mt-1" />
                )}
                {i % 5 === 1 && (
                  <div className="h-4 w-3/4 bg-white/[0.06] rounded animate-pulse mt-1" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
