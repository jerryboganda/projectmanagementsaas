import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Calendar — Linear Precision',
  description: 'Schedule and manage events and deadlines',
};

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
