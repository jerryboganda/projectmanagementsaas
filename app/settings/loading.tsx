export default function SettingsLoading() {
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
          <div className="ml-auto h-8 w-8 rounded-full bg-white/[0.06] animate-pulse" />
        </div>

        {/* Settings panel */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl space-y-8">
            {/* Settings nav tabs */}
            <div className="flex gap-2 border-b border-neutral-border pb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-8 w-20 rounded-md bg-white/[0.06] animate-pulse" />
              ))}
            </div>

            {/* Settings sections */}
            {Array.from({ length: 3 }).map((_, section) => (
              <div key={section} className="space-y-4">
                <div className="h-5 w-32 rounded bg-white/[0.06] animate-pulse" />
                <div className="rounded-lg border border-neutral-border bg-neutral-surface p-5 space-y-5">
                  {Array.from({ length: 3 }).map((_, field) => (
                    <div key={field} className="space-y-2">
                      <div className="h-3 w-24 rounded bg-white/[0.06] animate-pulse" />
                      <div className="h-10 w-full rounded-lg bg-white/[0.06] animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Save button placeholder */}
            <div className="h-10 w-28 rounded-lg bg-white/[0.06] animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
