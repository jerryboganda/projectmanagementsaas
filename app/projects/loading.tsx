export default function ProjectsLoading() {
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

        {/* Project cards grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-neutral-border bg-neutral-surface p-5 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-white/[0.06] animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 rounded bg-white/[0.06] animate-pulse" />
                    <div className="h-3 w-1/3 rounded bg-white/[0.06] animate-pulse" />
                  </div>
                </div>
                <div className="h-3 w-full rounded bg-white/[0.06] animate-pulse" />
                <div className="h-3 w-4/5 rounded bg-white/[0.06] animate-pulse" />
                <div className="flex items-center justify-between pt-2">
                  <div className="h-5 w-20 rounded-full bg-white/[0.06] animate-pulse" />
                  <div className="flex -space-x-2">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="size-6 rounded-full bg-white/[0.06] animate-pulse border-2 border-neutral-surface" />
                    ))}
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 w-full rounded-full bg-white/[0.06] animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
