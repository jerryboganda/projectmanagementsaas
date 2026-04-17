import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Intake — Linear Precision',
  description: 'Manage incoming requests and submissions',
};

export default function IntakeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
