import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reports — Linear Precision',
  description: 'Analytics and insights for your projects',
};

export default function ReportsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
