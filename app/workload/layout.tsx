import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Workload — Linear Precision',
  description: 'Team capacity and workload distribution',
};

export default function WorkloadLayout({ children }: { children: React.ReactNode }) {
  return children;
}
