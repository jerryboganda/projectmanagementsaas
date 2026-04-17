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
        <div className="flex-1 overflow-auto flex">
          {/* Left sidebar — form list */}
          <div className="w-64 flex-shrink-0 border-r border-[#222222] bg-[#111111] p-4 space-y-3">
            <div className="h-5 w-24 bg-white/[0.06] rounded animate-pulse mb-4" />
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-md px-3 py-2"
              >
                <div className="h-4 w-4 bg-white/[0.06] rounded animate-pulse" />
                <div className="h-4 w-28 bg-white/[0.06] rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* Right area — submissions table */}
          <div className="flex-1 p-6">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div className="h-6 w-40 bg-white/[0.06] rounded animate-pulse" />
              <div className="flex items-center gap-3">
                <div className="h-9 w-48 bg-white/[0.06] rounded animate-pulse" />
                <div className="h-9 w-24 bg-white/[0.06] rounded animate-pulse" />
              </div>
            </div>

            {/* Table header */}
            <div className="flex items-center gap-4 border-b border-[#222222] pb-3 mb-2">
              <div className="h-3 w-40 bg-white/[0.06] rounded animate-pulse" />
              <div className="h-3 w-28 bg-white/[0.06] rounded animate-pulse" />
              <div className="h-3 w-24 bg-white/[0.06] rounded animate-pulse" />
              <div className="h-3 w-20 bg-white/[0.06] rounded animate-pulse" />
              <div className="h-3 w-24 bg-white/[0.06] rounded animate-pulse" />
            </div>

            {/* Table rows */}
            <div className="space-y-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-md border border-[#222222] bg-[#111111] px-4 py-3"
                >
                  <div className="h-4 w-40 bg-white/[0.06] rounded animate-pulse" />
                  <div className="h-4 w-28 bg-white/[0.06] rounded animate-pulse" />
                  <div className="h-4 w-24 bg-white/[0.06] rounded animate-pulse" />
                  <div className="h-4 w-20 bg-white/[0.06] rounded animate-pulse" />
                  <div className="h-4 w-24 bg-white/[0.06] rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
