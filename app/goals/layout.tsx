import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Goals — Linear Precision',
  description: 'Track objectives, key results, and strategic goals',
};

export default function GoalsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
