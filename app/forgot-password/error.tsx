'use client';

import { AuthErrorFallback } from '@/components/auth/auth-error-fallback';

export default function ForgotPasswordError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AuthErrorFallback error={error} reset={reset} title="Password reset failed" />;
}
