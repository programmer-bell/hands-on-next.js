// src/app/(dashboard)/reports/components/ReportTable.tsx
import { format } from 'date-fns';

interface ReportRow {
  period: string;
  revenue: number;
  users: number;
  conversionRate: number;
  avgResponseTime: number;
}

export default function ReportTable({ rows }: { rows: ReportRow[] }) {
  return (
    <div className="bg-dash-surface border border-dash-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-dash-elevated border-b border-dash-border text-dash-subtle font-display uppercase tracking-widest text-xs">
            <tr>
              <th className="px-6 py-4 font-medium">Month</th>
              <th className="px-6 py-4 font-medium text-right">Revenue</th>
              <th className="px-6 py-4 font-medium text-right">New Users</th>
              <th className="px-6 py-4 font-medium text-right">Conversion</th>
              <th className="px-6 py-4 font-medium text-right">Response Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dash-border">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-dash-elevated/50 transition-colors">
                <td className="px-6 py-4 font-medium text-dash-text">
                  {row.period}
                </td>
                <td className="px-6 py-4 text-right font-mono text-dash-cyan">
                  ${Math.round(row.revenue).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right font-mono text-dash-text">
                  {row.users.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right font-mono text-dash-success">
                  {row.conversionRate.toFixed(1)}%
                </td>
                <td className="px-6 py-4 text-right font-mono text-dash-warning">
                  {Math.round(row.avgResponseTime)}ms
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
