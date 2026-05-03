// src/app/api/revenue/route.ts
// ─────────────────────────────────────────────────────────────
// Revenue time-series endpoint — GET /api/revenue
// Runs on: NODE.JS server runtime
//
// Query params:
//   from     — ISO date string (default: 30 days ago)
//   to       — ISO date string (default: today)
//   category — 'all' | 'saas' | 'enterprise' | 'marketplace' | 'services'
//
// Consumed by: RevenueChart.tsx (polling every 10 seconds)
// Response shape: { data: RevenueDataPoint[], summary: { total, target, trend } }
// Cache policy: no-store
//
// Validation: Zod validates all params before generator call
//   Invalid params → 400 response, never passed to generator
// ─────────────────────────────────────────────────────────────

import { z } from 'zod';
import { generateRevenueData } from '@/lib/data/generators';
import { createSeededRandom, getLiveSeed } from '@/lib/data/seed';
import { REVENUE_CATEGORIES } from '@/lib/data/constants';
import { getDefaultDateRange } from '@/lib/utils';

// Validation schema for query params
const QuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  category: z.enum(['all', ...REVENUE_CATEGORIES]).optional().default('all'),
});

export async function GET(request: Request) {
  // Parse and validate query params
  const { searchParams } = new URL(request.url);
  const defaults = getDefaultDateRange();

  const parsed = QuerySchema.safeParse({
    from: searchParams.get('from') ?? defaults.from,
    to: searchParams.get('to') ?? defaults.to,
    category: searchParams.get('category') ?? 'all',
  });

  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid query parameters', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { from, to, category } = parsed.data;
  const safeFrom = from ?? defaults.from;
  const safeTo = to ?? defaults.to;
  const random = createSeededRandom(getLiveSeed());
  const data = generateRevenueData({ from: safeFrom, to: safeTo, category }, random);

  // Compute summary stats from the generated data
  const total = data.reduce((sum, d) => sum + d.revenue, 0);
  const target = data.reduce((sum, d) => sum + d.target, 0);
  const trend = parseFloat(((total - target) / target * 100).toFixed(1));

  return Response.json(
    { data, summary: { total, target, trend } },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}
