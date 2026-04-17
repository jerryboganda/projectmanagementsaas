export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background-dark">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="size-12 rounded-full border-2 border-neutral-border" />
          <div className="absolute inset-0 size-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-slate-500 font-mono tracking-wider">Loading workspace...</p>
      </div>
    </div>
  );
}
