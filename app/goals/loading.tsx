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

        {/* Goals skeleton */}
        <div className="flex-1 overflow-auto p-6">
          {/* Page title + action */}
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 w-28 bg-white/[0.06] rounded animate-pulse" />
            <div className="h-8 w-28 bg-white/[0.06] rounded animate-pulse" />
          </div>

          {/* 2-column goal cards grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-[#222222] bg-[#111111] p-5 flex flex-col gap-4"
              >
                {/* Goal title */}
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="h-4 w-3/5 bg-white/[0.06] rounded animate-pulse" />
                    <div className="h-3 w-4/5 bg-white/[0.06] rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-16 bg-white/[0.06] rounded-full animate-pulse" />
                </div>

                {/* Progress bar */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <div className="h-3 w-16 bg-white/[0.06] rounded animate-pulse" />
                    <div className="h-3 w-8 bg-white/[0.06] rounded animate-pulse" />
                  </div>
                  <div className="h-2 w-full bg-white/[0.06] rounded-full animate-pulse" />
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 bg-white/[0.06] rounded-full animate-pulse" />
                  <div className="h-3 w-20 bg-white/[0.06] rounded animate-pulse" />
                  <div className="h-3 w-24 bg-white/[0.06] rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
