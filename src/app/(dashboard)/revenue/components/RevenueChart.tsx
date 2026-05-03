// src/app/(dashboard)/revenue/components/RevenueChart.tsx
// ─────────────────────────────────────────────────────────────
// Revenue time-series chart
// Runs on: CLIENT ('use client')
// 
// Polling: every 10 seconds (CSR) to get fresh revenue numbers
// without having to refresh the page or trigger a full SSR render.
// ─────────────────────────────────────────────────────────────

'use client';

import { useState, useEffect } from 'react';
import {
  ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, Area
} from 'recharts';
import { format } from 'date-fns';

interface RevenueDataPoint {
  date: string;
  revenue: number;
  target: number;
  category: string;
}

interface RevenueChartProps {
  initialData: RevenueDataPoint[];
  filter: { from: string; to: string; category: string };
  pollInterval?: number;
}

export default function RevenueChart({ initialData, filter, pollInterval = 10000 }: RevenueChartProps) {
  const [data, setData] = useState<RevenueDataPoint[]>(initialData);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLastUpdated(new Date());
  }, []);

  // Poll for fresh data
  // The polling interval ensures we don't spam the server.
  // Cleanup (clearInterval) is REQUIRED to prevent memory leaks and zombie intervals on unmount.
  useEffect(() => {
    // Reset data when filter changes, before polling resumes
    setData(initialData);
    setLastUpdated(new Date());

    const fetchRevenue = async () => {
      setIsPolling(true);
      try {
        // Filter params are baked into the URL so the API can return data specific to this component's view state
        const params = new URLSearchParams({
          from: filter.from,
          to: filter.to,
          category: filter.category,
        });
        const res = await fetch(`/api/revenue?${params.toString()}`);
        if (!res.ok) throw new Error('Network error');
        const json = await res.json();
        // Smooth state update
        setData(json.data);
        setLastUpdated(new Date());
      } catch (err) {
        console.error('Failed to poll revenue:', err);
      } finally {
        setIsPolling(false);
      }
    };

    const intervalId = setInterval(fetchRevenue, pollInterval);
    return () => clearInterval(intervalId); // Cleanup
  }, [filter, initialData, pollInterval]);

  return (
    <div className="bg-dash-surface border border-dash-border rounded-xl p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-display text-dash-text">Revenue Over Time</h2>
        <div className="flex items-center gap-3 text-xs font-mono text-dash-subtle">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isPolling ? 'bg-dash-cyan animate-pulse' : 'bg-dash-cyan/50'}`} />
            <span className="text-dash-text tracking-widest uppercase">LIVE</span>
          </div>
          <span>Updated: {mounted && lastUpdated ? format(lastUpdated, 'HH:mm:ss') : '--:--:--'}</span>
        </div>
      </div>

      <div className="w-full h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1E2235" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#1E2235" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#252A40" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#6B7280" 
              tick={{ fill: '#6B7280', fontSize: 12, fontFamily: 'var(--font-ibm-plex-mono)' }}
              tickFormatter={(val) => format(new Date(val), 'MMM dd')}
              tickMargin={10}
            />
            <YAxis 
              stroke="#6B7280" 
              tick={{ fill: '#6B7280', fontSize: 12, fontFamily: 'var(--font-ibm-plex-mono)' }}
              tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
              tickMargin={10}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0D0F1C', borderColor: '#1E2235', color: '#E2E4F0', fontFamily: 'var(--font-dm-sans)' }}
              itemStyle={{ fontFamily: 'var(--font-ibm-plex-mono)' }}
              formatter={(value: any) => [`$${value.toLocaleString()}`, undefined]}
              labelFormatter={(label: any) => format(new Date(label), 'MMM dd, yyyy')}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Area 
              type="monotone" 
              dataKey="target" 
              name="Target Revenue" 
              stroke="#334155" 
              strokeDasharray="4 4" 
              fill="url(#targetGradient)" 
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              name="Actual Revenue" 
              stroke="#00D4FF" 
              strokeWidth={2}
              dot={{ r: 3, fill: '#0D0F1C', stroke: '#00D4FF', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#00D4FF' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
