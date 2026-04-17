import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Templates — Linear Precision',
  description: 'Reusable project and task templates',
};

export default function TemplatesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
