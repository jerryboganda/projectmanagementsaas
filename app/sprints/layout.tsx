import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sprints — Linear Precision',
  description: 'Plan and manage agile sprints',
};

export default function SprintsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
