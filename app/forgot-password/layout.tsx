import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forgot Password — Linear Precision',
  description: 'Reset your account password',
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
