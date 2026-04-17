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

        {/* Reports skeleton */}
        <div className="flex-1 overflow-auto p-6">
          {/* Page title + controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 w-24 bg-white/[0.06] rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="h-8 w-28 bg-white/[0.06] rounded animate-pulse" />
              <div className="h-8 w-20 bg-white/[0.06] rounded animate-pulse" />
            </div>
          </div>

          {/* 2x2 chart grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-[#222222] bg-[#111111] p-5 flex flex-col"
              >
                {/* Chart title */}
                <div className="flex items-center justify-between mb-4">
                  <div className="h-4 w-32 bg-white/[0.06] rounded animate-pulse" />
                  <div className="h-3 w-16 bg-white/[0.06] rounded animate-pulse" />
                </div>

                {/* Chart placeholder area */}
                <div className="h-48 w-full flex items-end gap-2 px-2 pt-4 pb-2">
                  {i % 2 === 0 ? (
                    /* Bar chart variant */
                    <>
                      {[40, 65, 50, 80, 35, 70, 55].map((h, j) => (
                        <div
                          key={j}
                          className="flex-1 bg-white/[0.06] rounded-t animate-pulse"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </>
                  ) : (
                    /* Line/area chart variant */
                    <div className="w-full h-full flex flex-col justify-between">
                      {Array.from({ length: 4 }).map((_, k) => (
                        <div key={k} className="w-full border-b border-[#222222]" />
                      ))}
                      <div className="absolute inset-0" />
                      <div className="h-1 w-full bg-white/[0.06] rounded animate-pulse mt-auto" />
                    </div>
                  )}
                </div>

                {/* X-axis labels */}
                <div className="flex justify-between px-2 mt-2">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <div key={k} className="h-2.5 w-8 bg-white/[0.06] rounded animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
