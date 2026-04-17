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

        {/* Time tracking skeleton */}
        <div className="flex-1 overflow-auto p-6">
          {/* Page title */}
          <div className="h-6 w-36 bg-white/[0.06] rounded animate-pulse mb-6" />

          {/* Timer display */}
          <div className="rounded-lg border border-[#222222] bg-[#111111] p-6 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-4 w-48 bg-white/[0.06] rounded animate-pulse" />
              <div className="h-5 w-20 bg-white/[0.06] rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-24 bg-white/[0.06] rounded-lg animate-pulse" />
              <div className="h-10 w-10 bg-white/[0.06] rounded-lg animate-pulse" />
            </div>
          </div>

          {/* Summary stats row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-[#222222] bg-[#111111] p-4 flex flex-col gap-2"
              >
                <div className="h-3 w-20 bg-white/[0.06] rounded animate-pulse" />
                <div className="h-6 w-16 bg-white/[0.06] rounded animate-pulse" />
              </div>
            ))}
          </div>

          {/* Time entries table */}
          <div className="rounded-lg border border-[#222222] bg-[#111111] overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-5 gap-4 px-4 py-3 border-b border-[#222222]">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-3 w-16 bg-white/[0.06] rounded animate-pulse" />
              ))}
            </div>

            {/* Table rows */}
            {Array.from({ length: 7 }).map((_, row) => (
              <div
                key={row}
                className="grid grid-cols-5 gap-4 px-4 py-3.5 border-b border-[#222222] last:border-b-0"
              >
                <div className="h-3 w-3/4 bg-white/[0.06] rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-white/[0.06] rounded animate-pulse" />
                <div className="h-3 w-16 bg-white/[0.06] rounded animate-pulse" />
                <div className="h-3 w-16 bg-white/[0.06] rounded animate-pulse" />
                <div className="h-3 w-12 bg-white/[0.06] rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
