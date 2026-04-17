export default function BoardLoading() {
  return (
    <div className="flex h-screen bg-background-dark">
      {/* Sidebar placeholder */}
      <div className="hidden lg:block w-60 shrink-0 border-r border-neutral-border bg-neutral-surface">
        <div className="p-4 space-y-4">
          <div className="h-8 w-32 rounded-md bg-white/[0.06] animate-pulse" />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 rounded-md bg-white/[0.06] animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header placeholder */}
        <div className="h-14 border-b border-neutral-border bg-neutral-surface px-6 flex items-center gap-4">
          <div className="h-6 w-24 rounded-md bg-white/[0.06] animate-pulse" />
          <div className="h-8 w-48 rounded-md bg-white/[0.06] animate-pulse" />
          <div className="ml-auto h-8 w-8 rounded-full bg-white/[0.06] animate-pulse" />
        </div>

        {/* Board columns */}
        <div className="flex-1 overflow-x-auto p-6">
          <div className="flex gap-4 h-full">
            {Array.from({ length: 4 }).map((_, col) => (
              <div key={col} className="w-72 shrink-0 flex flex-col gap-3">
                {/* Column header */}
                <div className="flex items-center gap-2 pb-2">
                  <div className="h-5 w-24 rounded bg-white/[0.06] animate-pulse" />
                  <div className="h-5 w-6 rounded bg-white/[0.06] animate-pulse" />
                </div>
                {/* Cards */}
                {Array.from({ length: 3 - (col % 2) }).map((_, card) => (
                  <div
                    key={card}
                    className="rounded-lg border border-neutral-border bg-neutral-surface p-4 space-y-3"
                  >
                    <div className="h-4 w-3/4 rounded bg-white/[0.06] animate-pulse" />
                    <div className="h-3 w-full rounded bg-white/[0.06] animate-pulse" />
                    <div className="flex items-center gap-2 pt-1">
                      <div className="h-5 w-14 rounded-full bg-white/[0.06] animate-pulse" />
                      <div className="ml-auto h-6 w-6 rounded-full bg-white/[0.06] animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
