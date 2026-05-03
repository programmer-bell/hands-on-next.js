// src/app/(dashboard)/revenue/components/RevenueSummary.tsx
export default function RevenueSummary({ total, target, from, to }: { total: number, target: number, from: string, to: string }) {
  const trend = ((total - target) / target) * 100;
  const isUp = trend >= 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-dash-surface border border-dash-border rounded-xl p-6">
      <div>
        <p className="text-dash-subtle text-sm uppercase tracking-widest font-display mb-1">Total Revenue</p>
        <p className="text-3xl font-mono text-dash-text">${Math.round(total).toLocaleString()}</p>
      </div>
      <div>
        <p className="text-dash-subtle text-sm uppercase tracking-widest font-display mb-1">Target Achievement</p>
        <p className="text-3xl font-mono text-dash-text">
          <span className={isUp ? 'text-dash-success' : 'text-dash-danger'}>
            {isUp ? '+' : ''}{trend.toFixed(1)}%
          </span>
          <span className="text-lg text-dash-subtle ml-2">of ${Math.round(target).toLocaleString()}</span>
        </p>
      </div>
    </div>
  );
}
