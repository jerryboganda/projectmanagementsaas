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

        {/* Page-specific skeleton */}
        <div className="flex-1 overflow-auto p-6">
          {/* Sprint header bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-6 w-40 bg-white/[0.06] rounded animate-pulse" />
              <div className="h-5 w-20 bg-white/[0.06] rounded-full animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-24 bg-white/[0.06] rounded animate-pulse" />
              <div className="h-8 w-32 bg-white/[0.06] rounded animate-pulse" />
            </div>
          </div>

          {/* Progress bar placeholder */}
          <div className="h-2 w-full bg-white/[0.06] rounded-full mb-6 animate-pulse" />

          {/* 3-column kanban */}
          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map((col) => (
              <div key={col} className="rounded-lg border border-[#222222] bg-[#111111] p-4">
                {/* Column header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="h-4 w-20 bg-white/[0.06] rounded animate-pulse" />
                  <div className="h-5 w-5 bg-white/[0.06] rounded animate-pulse" />
                </div>

                {/* Cards */}
                <div className="space-y-3">
                  {[0, 1, 2].map((card) => (
                    <div
                      key={card}
                      className="rounded-md border border-[#222222] bg-[#0a0a0a] p-3 space-y-2"
                    >
                      <div className="h-4 w-3/4 bg-white/[0.06] rounded animate-pulse" />
                      <div className="h-3 w-1/2 bg-white/[0.06] rounded animate-pulse" />
                      <div className="flex items-center justify-between pt-1">
                        <div className="h-5 w-5 bg-white/[0.06] rounded-full animate-pulse" />
                        <div className="h-3 w-12 bg-white/[0.06] rounded animate-pulse" />
                      </div>
                    </div>
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
