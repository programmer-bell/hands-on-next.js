// src/app/api/users/route.ts
// ─────────────────────────────────────────────────────────────
// User acquisition endpoint — GET /api/users
// Runs on: NODE.JS server runtime
//
// Query params:
//   from   — ISO date string
//   to     — ISO date string
//   source — 'all' | 'organic' | 'paid' | 'referral' | 'direct'
//
// Consumed by: UserAcquisitionChart.tsx, SourceBreakdown.tsx
// Response shape: { data: UserDataPoint[], cohorts: UserCohort[] }
// Cache policy: no-store
// ─────────────────────────────────────────────────────────────

import { z } from 'zod';
import { generateUserData, generateCohortData } from '@/lib/data/generators';
import { createSeededRandom, getLiveSeed } from '@/lib/data/seed';
import { USER_SOURCES } from '@/lib/data/constants';
import { getDefaultDateRange } from '@/lib/utils';

const QuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  source: z.enum(['all', ...USER_SOURCES]).optional().default('all'),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const defaults = getDefaultDateRange();

  const parsed = QuerySchema.safeParse({
    from: searchParams.get('from') ?? defaults.from,
    to: searchParams.get('to') ?? defaults.to,
    source: searchParams.get('source') ?? 'all',
  });

  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid query parameters', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { from, to, source } = parsed.data;
  const safeFrom = from ?? defaults.from;
  const safeTo = to ?? defaults.to;
  const random = createSeededRandom(getLiveSeed());

  // Parallel generation — cohorts don't depend on time range data
  const [data, cohorts] = await Promise.all([
    Promise.resolve(generateUserData(new Date(safeFrom), new Date(safeTo), source, random)),
    Promise.resolve(generateCohortData(random)),
  ]);

  return Response.json(
    { data, cohorts },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}
