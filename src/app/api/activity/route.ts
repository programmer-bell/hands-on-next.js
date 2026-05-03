// src/app/api/activity/route.ts
// ─────────────────────────────────────────────────────────────
// Live activity feed — GET /api/activity
// Runs on: NODE.JS server runtime
//
// Query params:
//   count — number of events to return (default: 20, max: 50)
//
// Consumed by: ActivityFeed.tsx (polling every 3 seconds)
// Response shape: { events: ActivityEvent[], generatedAt: string }
// Cache policy: no-store
//
// Note: generatedAt timestamp tells the client component when this
//   batch was generated — used to animate new events sliding in
// ─────────────────────────────────────────────────────────────

import { z } from 'zod';
import { generateActivityEvents } from '@/lib/data/generators';
import { createSeededRandom, getLiveSeed } from '@/lib/data/seed';

const QuerySchema = z.object({
  count: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const parsed = QuerySchema.safeParse({
    count: searchParams.get('count'),
  });

  if (!parsed.success) {
    return Response.json({ error: 'Invalid count parameter' }, { status: 400 });
  }

  const random = createSeededRandom(getLiveSeed());
  const events = generateActivityEvents(parsed.data.count, random);

  return Response.json(
    { events, generatedAt: new Date().toISOString() },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}
