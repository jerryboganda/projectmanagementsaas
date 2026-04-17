import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account — Linear Precision',
  description: 'Create a new workspace account',
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
