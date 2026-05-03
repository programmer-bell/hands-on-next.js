// src/app/(dashboard)/users/page.tsx
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { generateUserData, generateCohortData } from '@/lib/data/generators';
import { createSeededRandom, STATIC_SEED } from '@/lib/data/seed';
import { getDefaultDateRange } from '@/lib/utils';
import { USER_SOURCES } from '@/lib/data/constants';
import UserAcquisitionChart from './components/UserAcquisitionChart';
import CohortTable from './components/CohortTable';
import FilterBar from '@/components/shared/FilterBar';
import { ChartSkeleton, TableSkeleton } from '@/components/ui/Skeleton';

export const metadata: Metadata = { title: 'Users' };
export const dynamic = 'force-dynamic';

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; source?: string }>;
}) {
  const defaults = getDefaultDateRange();
  const params = await searchParams;

  const from = params.from ?? defaults.from;
  const to = params.to ?? defaults.to;
  const source = USER_SOURCES.includes(params.source as never) ? (params.source ?? 'all') : 'all';

  const random = createSeededRandom(STATIC_SEED);

  const [data, cohorts] = await Promise.all([
    Promise.resolve(generateUserData(new Date(from), new Date(to), source, random)),
    Promise.resolve(generateCohortData(random)),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl text-dash-text mb-1">User Acquisition</h1>
          <p className="text-sm text-dash-subtle">Polls every 10 seconds</p>
        </div>
        <FilterBar
          categoryOptions={[
            { value: 'all', label: 'All Sources' },
            { value: 'organic', label: 'Organic' },
            { value: 'paid', label: 'Paid' },
            { value: 'referral', label: 'Referral' },
            { value: 'direct', label: 'Direct' },
          ]}
          showDateRange
          showCategory
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <Suspense fallback={<ChartSkeleton />}>
            <UserAcquisitionChart initialData={data} filter={{ from, to, source }} pollInterval={10000} />
          </Suspense>
        </div>
        <div>
          <Suspense fallback={<TableSkeleton />}>
            <CohortTable initialCohorts={cohorts} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
