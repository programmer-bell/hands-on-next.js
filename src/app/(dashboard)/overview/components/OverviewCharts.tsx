// src/app/(dashboard)/overview/components/OverviewCharts.tsx
'use client';
import RevenueChart from '../../revenue/components/RevenueChart';
import { getDefaultDateRange } from '@/lib/utils';

export default function OverviewCharts({ initialRevenueData }: { initialRevenueData: any[] }) {
  const defaults = getDefaultDateRange();
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <RevenueChart 
          initialData={initialRevenueData} 
          filter={{ from: defaults.from, to: defaults.to, category: 'all' }}
          pollInterval={10000}
        />
      </div>
      <div className="bg-dash-surface border border-dash-border rounded-xl p-6 flex flex-col items-center justify-center">
        <p className="text-dash-subtle text-sm">More charts coming soon...</p>
      </div>
    </div>
  );
}
