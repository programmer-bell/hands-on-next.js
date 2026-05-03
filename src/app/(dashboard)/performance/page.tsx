// src/app/(dashboard)/performance/page.tsx
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { generatePerfData, generatePerfStatus } from '@/lib/data/generators';
import { createSeededRandom, STATIC_SEED } from '@/lib/data/seed';
import ResponseTimeChart from './components/ResponseTimeChart';
import ThroughputGauge from './components/ThroughputGauge';
import ErrorRateChart from './components/ErrorRateChart';
import PerfStatusBar from './components/PerfStatusBar';
import { ChartSkeleton } from '@/components/ui/Skeleton';

export const metadata: Metadata = { title: 'Performance' };
export const dynamic = 'force-dynamic';

export default async function PerformancePage() {
  const random = createSeededRandom(STATIC_SEED);
  
  const [data, status] = await Promise.all([
    Promise.resolve(generatePerfData(20, random)),
    Promise.resolve(generatePerfStatus(random)),
  ]);

  const latestThroughput = data[data.length - 1]?.throughput ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl text-dash-text mb-1">System Performance</h1>
        <p className="text-sm text-dash-subtle">Polls every 3 seconds</p>
      </div>

      <PerfStatusBar status={status} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<ChartSkeleton />}>
            <ResponseTimeChart initialData={data} pollInterval={3000} />
          </Suspense>
          <Suspense fallback={<ChartSkeleton />}>
            <ErrorRateChart initialData={data} pollInterval={3000} />
          </Suspense>
        </div>
        <div>
          <Suspense fallback={<ChartSkeleton />}>
            <ThroughputGauge initialThroughput={latestThroughput} pollInterval={3000} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
