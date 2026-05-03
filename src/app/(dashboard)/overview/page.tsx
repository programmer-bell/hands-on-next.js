// src/app/(dashboard)/overview/page.tsx
// ─────────────────────────────────────────────────────────────
// Overview page — GET /overview
// Runs on: SERVER (async server component)
// Rendering mode: SSR (dynamic — metrics drift over time)
//
// Data strategy: PARALLEL FETCH (Promise.all)
//   Generates KPI metrics, sparkline data, and summary charts simultaneously.
//   Each generator call takes ~0ms (pure computation), but the pattern
//   demonstrates the correct architecture for real DB calls.
//
// Data flow:
//   generateKpiMetrics() → KpiGrid (server) → KpiCard (client, animated counter)
//   generateRevenueData() → OverviewCharts (client, summary chart)
//
// Why dynamic and not static (SSG)?
//   KPIs drift over time via getLiveSeed() — caching them permanently
//   would show stale numbers. 'force-dynamic' ensures fresh SSR.
// ─────────────────────────────────────────────────────────────

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { generateKpiMetrics, generateRevenueData } from '@/lib/data/generators';
import { createSeededRandom, STATIC_SEED } from '@/lib/data/seed';
import { getDefaultDateRange } from '@/lib/utils';  
import KpiGrid from './components/KpiGrid';
import OverviewCharts from './components/OverviewCharts';
import { Skeleton } from '@/components/ui/Skeleton';

export const metadata: Metadata = { title: 'Overview' };
// Force dynamic: KPIs change — never serve a cached HTML snapshot
export const dynamic = 'force-dynamic';

export default async function OverviewPage() {
  const defaults = getDefaultDateRange();

  // PARALLEL FETCH — all generators fire simultaneously
  // In a real app these would be DB queries; the pattern is identical
  const [metrics, revenueData] = await Promise.all([
    Promise.resolve(generateKpiMetrics(createSeededRandom(STATIC_SEED))),
    Promise.resolve(generateRevenueData(defaults, createSeededRandom(STATIC_SEED))),
  ]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl text-dash-text mb-1">Overview</h1>
        <p className="text-sm text-dash-subtle">Live metrics — updates every 15 seconds</p>
      </div>

      {/* KPI Cards grid — server component, passes data to animated client cards */}
      <Suspense fallback={<Skeleton className="h-36 w-full rounded-xl" />}>
        <KpiGrid initialMetrics={metrics} />
      </Suspense>

      {/* Summary charts — client component with polling */}
      <Suspense fallback={<Skeleton className="h-80 w-full rounded-xl" />}>
        <OverviewCharts initialRevenueData={revenueData} />
      </Suspense>
    </div>
  );
}
