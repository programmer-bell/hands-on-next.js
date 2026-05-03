// src/app/(dashboard)/reports/page.tsx
// ─────────────────────────────────────────────────────────────
// Reports page — GET /reports
// Runs on: SERVER
// Rendering mode: SSG (static generation at build time)
//
// Why SSG here?
//   Reports are historical summaries — they don't change per request.
//   The same monthly report data is valid for any user at any time.
//   Pre-generating at build time → zero server cost per visit.
//
// This is the ONE page in this app that is NOT 'force-dynamic'.
// No polling. No client components. Pure server-rendered static HTML.
// Demonstrates the contrast between SSG and SSR in the same codebase.
// ─────────────────────────────────────────────────────────────

import type { Metadata } from 'next';
import { generateReportRows } from '@/lib/data/generators';
import { createSeededRandom, STATIC_SEED } from '@/lib/data/seed';
import ReportTable from './components/ReportTable';
import ReportSummary from './components/ReportSummary';

export const metadata: Metadata = { title: 'Reports' };
// SSG: no 'force-dynamic' export — Next.js pre-renders at build time
// revalidate: 86400 → rebuild this page once per day at most
export const revalidate = 86400;

export default function ReportsPage() {
  // NOT async — no await needed. Generators are pure synchronous functions.
  // At build time this runs once and the output is saved as HTML.
  const rows = generateReportRows(createSeededRandom(STATIC_SEED));

  const totals = {
    revenue: rows.reduce((s, r) => s + r.revenue, 0),
    users: rows.reduce((s, r) => s + r.users, 0),
    avgConversion: rows.reduce((s, r) => s + r.conversionRate, 0) / rows.length,
    avgResponseTime: rows.reduce((s, r) => s + r.avgResponseTime, 0) / rows.length,
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl text-dash-text mb-1">Reports</h1>
        <p className="text-sm text-dash-subtle">
          Static snapshot — generated at build time (SSG)
        </p>
      </div>

      <ReportSummary totals={totals} />
      <ReportTable rows={rows} />
    </div>
  );
}
