import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Timeline — Linear Precision',
  description: 'Gantt chart view of project timelines',
};

export default function TimelineLayout({ children }: { children: React.ReactNode }) {
  return children;
}
