import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Projects — Linear Precision',
  description: 'Manage and track all projects in your workspace',
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
