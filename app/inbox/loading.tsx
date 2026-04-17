export default function InboxLoading() {
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

        {/* Inbox list items */}
        <div className="flex-1 overflow-y-auto">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b border-neutral-border px-6 py-4"
            >
              <div className="size-8 rounded-full bg-white/[0.06] animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-40 rounded bg-white/[0.06] animate-pulse" />
                  <div className="h-3 w-16 rounded bg-white/[0.06] animate-pulse" />
                </div>
                <div className="h-3 w-3/4 rounded bg-white/[0.06] animate-pulse" />
              </div>
              <div className="h-3 w-12 rounded bg-white/[0.06] animate-pulse shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
