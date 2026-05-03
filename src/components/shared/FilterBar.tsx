// src/components/shared/FilterBar.tsx
// ─────────────────────────────────────────────────────────────
// URL-synced filter bar
// Runs on: CLIENT ('use client')
//
// Why URL state instead of useState?
// URL state is readable by page.tsx on the server during SSR.
// This enables Next.js to render the initial filtered view on the
// server before sending HTML to the client, preventing content flash.
// ─────────────────────────────────────────────────────────────

'use client';

import { useQueryState, parseAsIsoDate, parseAsString } from 'nuqs';
import { format } from 'date-fns';

interface FilterBarProps {
  categoryOptions: Array<{ value: string; label: string }>;
  showDateRange?: boolean;
  showCategory?: boolean;
}

export default function FilterBar({ 
  categoryOptions, 
  showDateRange = true, 
  showCategory = true 
}: FilterBarProps) {
  // nuqs syncs these state variables directly to the URL query string
  // shallow navigation ensures the page doesn't fully reload
  const [from, setFrom] = useQueryState('from', parseAsIsoDate.withOptions({ shallow: true }));
  const [to, setTo] = useQueryState('to', parseAsIsoDate.withOptions({ shallow: true }));
  const [category, setCategory] = useQueryState('category', parseAsString.withDefault('all').withOptions({ shallow: true }));

  const handleReset = () => {
    setFrom(null);
    setTo(null);
    setCategory(null);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 bg-dash-surface border border-dash-border p-2 rounded-lg">
      {showDateRange && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-dash-subtle font-display uppercase tracking-widest px-2">Date</label>
          <input
            type="date"
            value={from ? format(from, 'yyyy-MM-dd') : ''}
            onChange={(e) => setFrom(e.target.value ? new Date(e.target.value) : null)}
            className="bg-dash-elevated border border-dash-border text-dash-text text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-dash-cyan focus:ring-1 focus:ring-dash-cyan transition-all font-mono"
          />
          <span className="text-dash-subtle">→</span>
          <input
            type="date"
            value={to ? format(to, 'yyyy-MM-dd') : ''}
            onChange={(e) => setTo(e.target.value ? new Date(e.target.value) : null)}
            className="bg-dash-elevated border border-dash-border text-dash-text text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-dash-cyan focus:ring-1 focus:ring-dash-cyan transition-all font-mono"
          />
        </div>
      )}

      {showCategory && (
        <div className="flex items-center gap-2 border-l border-dash-border pl-3 ml-1">
          <label className="text-xs text-dash-subtle font-display uppercase tracking-widest px-2">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-dash-elevated border border-dash-border text-dash-text text-sm rounded-md px-3 py-1.5 focus:outline-none focus:border-dash-cyan focus:ring-1 focus:ring-dash-cyan transition-all appearance-none pr-8 relative min-w-[140px]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundPosition: 'right 0.5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.2em 1.2em'
            }}
          >
            {categoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex-1 min-w-4 flex justify-end pl-3">
        <button
          onClick={handleReset}
          className="text-xs text-dash-subtle hover:text-dash-text transition-colors uppercase tracking-widest font-display px-3 py-2"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
