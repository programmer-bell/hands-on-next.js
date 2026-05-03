// src/app/(dashboard)/reports/components/ReportSummary.tsx
export default function ReportSummary({ totals }: { totals: { revenue: number; users: number; avgConversion: number; avgResponseTime: number } }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-dash-surface border border-dash-border p-4 rounded-xl">
        <p className="text-dash-subtle text-xs uppercase tracking-widest font-display">Total Revenue</p>
        <p className="text-2xl font-mono text-dash-text mt-1">${Math.round(totals.revenue).toLocaleString()}</p>
      </div>
      <div className="bg-dash-surface border border-dash-border p-4 rounded-xl">
        <p className="text-dash-subtle text-xs uppercase tracking-widest font-display">Total Users</p>
        <p className="text-2xl font-mono text-dash-text mt-1">{totals.users.toLocaleString()}</p>
      </div>
      <div className="bg-dash-surface border border-dash-border p-4 rounded-xl">
        <p className="text-dash-subtle text-xs uppercase tracking-widest font-display">Avg Conversion</p>
        <p className="text-2xl font-mono text-dash-text mt-1">{totals.avgConversion.toFixed(1)}%</p>
      </div>
      <div className="bg-dash-surface border border-dash-border p-4 rounded-xl">
        <p className="text-dash-subtle text-xs uppercase tracking-widest font-display">Avg Response Time</p>
        <p className="text-2xl font-mono text-dash-text mt-1">{totals.avgResponseTime.toFixed(0)}ms</p>
      </div>
    </div>
  );
}
