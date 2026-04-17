import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings — Linear Precision',
  description: 'Configure workspace and account settings',
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
