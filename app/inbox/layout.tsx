import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inbox — Linear Precision',
  description: 'Notifications and updates from your workspace',
};

export default function InboxLayout({ children }: { children: React.ReactNode }) {
  return children;
}
