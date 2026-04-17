export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-[#222222] bg-[#111111] p-8">
        {/* Logo placeholder */}
        <div className="mx-auto h-8 w-32 bg-white/[0.06] rounded animate-pulse" />

        {/* Title */}
        <div className="mx-auto h-5 w-32 bg-white/[0.06] rounded animate-pulse" />

        {/* New password field */}
        <div className="space-y-2">
          <div className="h-3 w-24 bg-white/[0.06] rounded animate-pulse" />
          <div className="h-10 w-full bg-white/[0.06] rounded-md animate-pulse" />
        </div>

        {/* Confirm password field */}
        <div className="space-y-2">
          <div className="h-3 w-32 bg-white/[0.06] rounded animate-pulse" />
          <div className="h-10 w-full bg-white/[0.06] rounded-md animate-pulse" />
        </div>

        {/* Submit button */}
        <div className="h-10 w-full bg-white/[0.06] rounded-md animate-pulse" />

        {/* Back to login link */}
        <div className="mx-auto h-3 w-28 bg-white/[0.06] rounded animate-pulse" />
      </div>
    </div>
  );
}
