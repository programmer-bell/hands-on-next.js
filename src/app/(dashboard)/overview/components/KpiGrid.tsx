// src/app/(dashboard)/overview/components/KpiGrid.tsx
import KpiCard from './KpiCard';

interface MetricData {
  id: string;
  label: string;
  value: number;
  unit: 'currency' | 'number' | 'percent' | 'ms';
  trend: number;
  trendDirection: 'up' | 'down' | 'flat';
  sparkline: number[];
}

export default function KpiGrid({ initialMetrics }: { initialMetrics: MetricData[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {initialMetrics.map((metric) => (
        <KpiCard key={metric.id} metric={metric} />
      ))}
    </div>
  );
}
