// src/app/(dashboard)/users/components/CohortTable.tsx
import { UserCohort } from '@/types';

export default function CohortTable({ initialCohorts }: { initialCohorts: UserCohort[] }) {
  return (
    <div className="bg-dash-surface border border-dash-border rounded-xl overflow-hidden">
      <div className="p-6 border-b border-dash-border">
        <h2 className="text-lg font-display text-dash-text mb-1">Retention Cohorts</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-dash-elevated border-b border-dash-border text-dash-subtle font-display uppercase tracking-widest text-xs">
            <tr>
              <th className="px-6 py-4 font-medium">Cohort</th>
              <th className="px-6 py-4 font-medium text-right">Size</th>
              <th className="px-6 py-4 font-medium text-right">Day 7</th>
              <th className="px-6 py-4 font-medium text-right">Day 30</th>
              <th className="px-6 py-4 font-medium text-right">Day 90</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dash-border">
            {initialCohorts.map((row, i) => (
              <tr key={i} className="hover:bg-dash-elevated/50 transition-colors">
                <td className="px-6 py-4 font-medium text-dash-text">{row.cohort}</td>
                <td className="px-6 py-4 text-right font-mono text-dash-text">{row.size.toLocaleString()}</td>
                <td className="px-6 py-4 text-right font-mono text-dash-cyan">{row.retentionD7}%</td>
                <td className="px-6 py-4 text-right font-mono text-dash-cyan opacity-80">{row.retentionD30}%</td>
                <td className="px-6 py-4 text-right font-mono text-dash-cyan opacity-60">{row.retentionD90}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
