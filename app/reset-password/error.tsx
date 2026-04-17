'use client';

import { AuthErrorFallback } from '@/components/auth/auth-error-fallback';

export default function ResetPasswordError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AuthErrorFallback error={error} reset={reset} title="Couldn't reset your password" />;
}
