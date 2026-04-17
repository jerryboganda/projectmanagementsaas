import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Board — Linear Precision',
  description: 'Kanban board view for managing tasks across sprints',
};

export default function BoardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
