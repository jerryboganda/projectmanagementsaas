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

        {/* Docs skeleton: sidebar + editor */}
        <div className="flex-1 flex overflow-hidden">
          {/* Document tree sidebar */}
          <div className="w-60 border-r border-[#222222] bg-[#111111]/50 p-4 flex flex-col gap-1">
            {/* Search */}
            <div className="h-8 w-full bg-white/[0.06] rounded mb-3 animate-pulse" />

            {/* Tree items */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-2 py-1.5"
                style={{ paddingLeft: i === 2 || i === 3 || i === 6 ? 20 : 0 }}
              >
                <div className="h-3.5 w-3.5 bg-white/[0.06] rounded animate-pulse flex-shrink-0" />
                <div
                  className="h-3 bg-white/[0.06] rounded animate-pulse"
                  style={{ width: `${50 + ((i * 17) % 40)}%` }}
                />
              </div>
            ))}
          </div>

          {/* Editor area */}
          <div className="flex-1 p-8 max-w-3xl">
            {/* Document title */}
            <div className="h-7 w-2/5 bg-white/[0.06] rounded animate-pulse mb-6" />

            {/* Text line placeholders */}
            <div className="flex flex-col gap-3">
              <div className="h-3 w-full bg-white/[0.06] rounded animate-pulse" />
              <div className="h-3 w-11/12 bg-white/[0.06] rounded animate-pulse" />
              <div className="h-3 w-4/5 bg-white/[0.06] rounded animate-pulse" />
              <div className="h-3 w-full bg-white/[0.06] rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-white/[0.06] rounded animate-pulse" />

              {/* Gap for paragraph break */}
              <div className="h-4" />

              <div className="h-3 w-full bg-white/[0.06] rounded animate-pulse" />
              <div className="h-3 w-5/6 bg-white/[0.06] rounded animate-pulse" />
              <div className="h-3 w-full bg-white/[0.06] rounded animate-pulse" />
              <div className="h-3 w-2/3 bg-white/[0.06] rounded animate-pulse" />

              {/* Gap */}
              <div className="h-4" />

              <div className="h-3 w-full bg-white/[0.06] rounded animate-pulse" />
              <div className="h-3 w-11/12 bg-white/[0.06] rounded animate-pulse" />
              <div className="h-3 w-3/5 bg-white/[0.06] rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
