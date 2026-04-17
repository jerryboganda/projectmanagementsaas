import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Time Tracking — Linear Precision',
  description: 'Log and analyze time spent on tasks',
};

export default function TimeTrackingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
