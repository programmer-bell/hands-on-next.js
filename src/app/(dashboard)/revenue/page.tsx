// src/app/(dashboard)/revenue/page.tsx
// ─────────────────────────────────────────────────────────────
// Revenue page — GET /revenue
// Runs on: SERVER (async server component)
// Rendering mode: SSR — re-runs on server when URL filter params change
//
// Filter state lives in URL params (managed by FilterBar via nuqs).
// When user changes date range: URL updates → Next.js re-runs this page
// on the server with new searchParams → generates filtered data →
// new HTML with filtered chart data → RevenueChart hydrates with it.
//
// searchParams prop:
//   from     — ISO date string from URL
//   to       — ISO date string from URL
//   category — category filter from URL
// ─────────────────────────────────────────────────────────────

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { generateRevenueData } from '@/lib/data/generators';
import { createSeededRandom, STATIC_SEED } from '@/lib/data/seed';
import { getDefaultDateRange } from '@/lib/utils';
import { REVENUE_CATEGORIES } from '@/lib/data/constants';
import RevenueChart from './components/RevenueChart';
import RevenueSummary from './components/RevenueSummary';
import FilterBar from '@/components/shared/FilterBar';
import { Skeleton } from '@/components/ui/Skeleton';

export const metadata: Metadata = { title: 'Revenue' };
export const dynamic = 'force-dynamic';

export default async function RevenuePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; category?: string }>;
}) {
  const defaults = getDefaultDateRange();
  const params = await searchParams;

  // Read filter values from URL — these come from FilterBar (nuqs)
  // Validate: unknown category falls back to 'all'
  const from = params.from ?? defaults.from;
  const to = params.to ?? defaults.to;
  const category = REVENUE_CATEGORIES.includes(params.category as never)
    ? (params.category ?? 'all')
    : 'all';

  // Generate initial SSR data with current filter values
  const initialData = generateRevenueData(
    { from, to, category },
    createSeededRandom(STATIC_SEED)
  );

  // Compute summary for RevenueSummary component (server-rendered)
  const total = initialData.reduce((sum, d) => sum + d.revenue, 0);
  const targetTotal = initialData.reduce((sum, d) => sum + d.target, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl text-dash-text mb-1">Revenue</h1>
          <p className="text-sm text-dash-subtle">Polls every 10 seconds</p>
        </div>
        {/* FilterBar: 'use client' — manages URL params via nuqs */}
        <FilterBar
          categoryOptions={[
            { value: 'all', label: 'All Categories' },
            { value: 'saas', label: 'SaaS' },
            { value: 'enterprise', label: 'Enterprise' },
            { value: 'marketplace', label: 'Marketplace' },
            { value: 'services', label: 'Services' },
          ]}
          showDateRange
          showCategory
        />
      </div>

      {/* Summary stats — server rendered, static for this SSR pass */}
      <RevenueSummary total={total} target={targetTotal} from={from} to={to} />

      {/* Chart — client component, receives SSR data + polls for updates */}
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        <RevenueChart
          initialData={initialData}
          filter={{ from, to, category }}
          pollInterval={10000}
        />
      </Suspense>
    </div>
  );
}
