export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-[#222222] bg-[#111111] p-8">
        {/* Logo placeholder */}
        <div className="mx-auto h-8 w-32 bg-white/[0.06] rounded animate-pulse" />

        {/* Title */}
        <div className="mx-auto h-5 w-36 bg-white/[0.06] rounded animate-pulse" />

        {/* Name field */}
        <div className="space-y-2">
          <div className="h-3 w-10 bg-white/[0.06] rounded animate-pulse" />
          <div className="h-10 w-full bg-white/[0.06] rounded-md animate-pulse" />
        </div>

        {/* Email field */}
        <div className="space-y-2">
          <div className="h-3 w-12 bg-white/[0.06] rounded animate-pulse" />
          <div className="h-10 w-full bg-white/[0.06] rounded-md animate-pulse" />
        </div>

        {/* Password field */}
        <div className="space-y-2">
          <div className="h-3 w-16 bg-white/[0.06] rounded animate-pulse" />
          <div className="h-10 w-full bg-white/[0.06] rounded-md animate-pulse" />
        </div>

        {/* Submit button */}
        <div className="h-10 w-full bg-white/[0.06] rounded-md animate-pulse" />

        {/* Footer link */}
        <div className="mx-auto h-3 w-40 bg-white/[0.06] rounded animate-pulse" />
      </div>
    </div>
  );
}
