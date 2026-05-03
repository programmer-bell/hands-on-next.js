// src/app/(dashboard)/activity/page.tsx
import type { Metadata } from 'next';
import { generateActivityEvents } from '@/lib/data/generators';
import { createSeededRandom, STATIC_SEED } from '@/lib/data/seed';
import ActivityFeed from './components/ActivityFeed';

export const metadata: Metadata = { title: 'Activity' };
export const dynamic = 'force-dynamic';

export default async function ActivityPage() {
  const initialEvents = generateActivityEvents(20, createSeededRandom(STATIC_SEED));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="max-w-4xl h-[800px]">
        <ActivityFeed initialEvents={initialEvents} pollInterval={3000} />
      </div>
    </div>
  );
}
