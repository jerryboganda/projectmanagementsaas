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
            <div className="h-6 w-32 bg-white/[0.06] rounded animate-pulse" />
            <div className="h-9 w-36 bg-white/[0.06] rounded animate-pulse" />
          </div>

          {/* Template cards grid — 4 across */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className="rounded-lg border border-[#222222] bg-[#111111] p-4 space-y-3"
              >
                {/* Icon / thumbnail */}
                <div className="h-10 w-10 bg-white/[0.06] rounded-lg animate-pulse" />

                {/* Title */}
                <div className="h-4 w-3/4 bg-white/[0.06] rounded animate-pulse" />

                {/* Description lines */}
                <div className="space-y-1.5">
                  <div className="h-3 w-full bg-white/[0.06] rounded animate-pulse" />
                  <div className="h-3 w-2/3 bg-white/[0.06] rounded animate-pulse" />
                </div>

                {/* Footer badge */}
                <div className="h-5 w-16 bg-white/[0.06] rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
