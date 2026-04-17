'use client';

import { AuthErrorFallback } from '@/components/auth/auth-error-fallback';

export default function RegisterError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AuthErrorFallback error={error} reset={reset} title="Couldn't create your account" />;
}
