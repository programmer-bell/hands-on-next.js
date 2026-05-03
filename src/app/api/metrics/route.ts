// src/app/api/metrics/route.ts
// ─────────────────────────────────────────────────────────────
// KPI metrics endpoint — GET /api/metrics
// Runs on: NODE.JS server runtime
//
// Consumed by: KpiCard components (polling every 15 seconds)
// Response shape: { metrics: KpiMetric[] }
// Cache policy: no-store — every poll must return fresh numbers
//
// Why no query params here?
//   KPI overview shows all-time/current metrics without filtering.
//   Filters apply at the individual metric pages (revenue, users).
//
// Polling interval: 15 seconds (slowest — summary data)
// ─────────────────────────────────────────────────────────────

import { generateKpiMetrics } from '@/lib/data/generators';
import { createSeededRandom, getLiveSeed } from '@/lib/data/seed';

export async function GET() {
  // getLiveSeed() changes every minute — metrics drift slowly over time
  // This simulates a real dashboard where numbers gradually change
  const random = createSeededRandom(getLiveSeed());
  const metrics = generateKpiMetrics(random);

  return Response.json(
    { metrics },
    {
      headers: {
        // no-store: polling clients MUST get fresh data every call
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
