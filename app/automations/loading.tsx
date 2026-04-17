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
          {/* Page title + action */}
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 w-36 bg-white/[0.06] rounded animate-pulse" />
            <div className="h-9 w-36 bg-white/[0.06] rounded animate-pulse" />
          </div>

          {/* Rule cards list */}
          <div className="space-y-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-lg border border-[#222222] bg-[#111111] px-4 py-3"
              >
                {/* Icon */}
                <div className="h-9 w-9 flex-shrink-0 bg-white/[0.06] rounded-lg animate-pulse" />

                {/* Title + description */}
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-48 bg-white/[0.06] rounded animate-pulse" />
                  <div className="h-3 w-72 bg-white/[0.06] rounded animate-pulse" />
                </div>

                {/* Toggle switch */}
                <div className="h-6 w-11 flex-shrink-0 bg-white/[0.06] rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
