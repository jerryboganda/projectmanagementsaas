import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from './providers';
import { SkipToContent } from '@/components/ui/skip-to-content';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://linearprecision.com'),
  title: 'Linear Precision — PM Workspace',
  description: 'Project Management Dashboard for teams. Plan, track, and deliver projects with Linear Precision.',
  openGraph: {
    title: 'Linear Precision — PM Workspace',
    description: 'Project Management Dashboard for teams. Plan, track, and deliver projects with Linear Precision.',
    siteName: 'Linear Precision',
    type: 'website',
    url: 'https://linearprecision.com',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Linear Precision Project Management',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Linear Precision — PM Workspace',
    description: 'Project Management Dashboard for teams. Plan, track, and deliver projects with Linear Precision.',
    site: '@linearprecision',
    creator: '@linearprecision',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large' as const,
      'max-video-preview': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background-dark text-slate-100 font-sans antialiased h-screen overflow-hidden flex" suppressHydrationWarning>
        <SkipToContent />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
