'use client';

import { AuthErrorFallback } from '@/components/auth/auth-error-fallback';

export default function LoginError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AuthErrorFallback error={error} reset={reset} title="Couldn't sign you in" />;
}
