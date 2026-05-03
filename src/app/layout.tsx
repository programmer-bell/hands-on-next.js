// src/app/layout.tsx
// ─────────────────────────────────────────────────────────────
// Root layout — wraps EVERY page in the application
// Runs on: SERVER (no 'use client')
//
// Loads fonts via next/font/google:
//   - Syne: display headings and section labels
//   - IBM Plex Mono: all numeric/metric values
//   - DM Sans: body text and UI labels
//
// CSS variables are injected into <html> for Tailwind var() usage
// ─────────────────────────────────────────────────────────────

import type { Metadata } from 'next';
import { Syne, IBM_Plex_Mono, DM_Sans } from 'next/font/google';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import './globals.css';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Analytics Dashboard',
    template: '%s | Analytics',
  },
  description: 'Real-time analytics dashboard — live metrics, charts, and performance monitoring.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`
          ${syne.variable}
          ${ibmPlexMono.variable}
          ${dmSans.variable}
          font-sans bg-dash-bg text-dash-text antialiased min-h-screen
        `}
      >
        <NuqsAdapter>
          {children}
        </NuqsAdapter>
      </body>
    </html>
  );
}
