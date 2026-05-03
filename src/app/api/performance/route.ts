// src/app/api/performance/route.ts
// ─────────────────────────────────────────────────────────────
// Server performance metrics — GET /api/performance
// Runs on: NODE.JS server runtime
//
// Query params: none — always returns latest rolling 20 data points
//
// Consumed by: ResponseTimeChart.tsx, ErrorRateChart.tsx, ThroughputGauge.tsx
// Polling interval: 3 seconds (fastest — health monitoring)
// Response shape: { data: PerfDataPoint[], status: PerfStatus }
// Cache policy: no-store — 3-second polling needs fresh data every time
// ─────────────────────────────────────────────────────────────

import { generatePerfData, generatePerfStatus } from '@/lib/data/generators';
import { createSeededRandom, getLiveSeed } from '@/lib/data/seed';

export async function GET() {
  // getLiveSeed() changes per minute — combined with random drift in generator
  // this produces realistic metric variation on every poll
  const random = createSeededRandom(getLiveSeed());
  const data = generatePerfData(20, random);
  const status = generatePerfStatus(random);

  return Response.json(
    { data, status },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}
