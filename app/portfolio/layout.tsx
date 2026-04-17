import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portfolio — Linear Precision',
  description: 'High-level portfolio and initiative tracking',
};

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
