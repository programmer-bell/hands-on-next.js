// src/app/(dashboard)/performance/components/ErrorRateChart.tsx
'use client';
import { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Area } from 'recharts';
import { format } from 'date-fns';

interface PerfDataPoint {
  timestamp: string;
  errorRate: number;
}

export default function ErrorRateChart({ initialData, pollInterval = 3000 }: { initialData: PerfDataPoint[], pollInterval?: number }) {
  const [data, setData] = useState<PerfDataPoint[]>(initialData);

  useEffect(() => {
    const fetchPerf = async () => {
      try {
        const res = await fetch('/api/performance');
        if (!res.ok) return;
        const json = await res.json();
        setData(json.data);
      } catch (err) {}
    };
    const id = setInterval(fetchPerf, pollInterval);
    return () => clearInterval(id);
  }, [pollInterval]);

  return (
    <div className="bg-dash-surface border border-dash-border rounded-xl p-6">
      <div className="mb-6">
        <h2 className="text-lg font-display text-dash-text mb-1">Error Rate (%)</h2>
      </div>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#252A40" vertical={false} />
            <XAxis dataKey="timestamp" stroke="#6B7280" tick={{ fill: '#6B7280', fontSize: 12, fontFamily: 'var(--font-ibm-plex-mono)' }} tickFormatter={(val) => format(new Date(val), 'HH:mm:ss')} tickMargin={10} />
            <YAxis stroke="#6B7280" tick={{ fill: '#6B7280', fontSize: 12, fontFamily: 'var(--font-ibm-plex-mono)' }} tickMargin={10} domain={[0, 'auto']} />
            <Tooltip contentStyle={{ backgroundColor: '#0D0F1C', borderColor: '#1E2235', color: '#E2E4F0' }} itemStyle={{ fontFamily: 'var(--font-ibm-plex-mono)' }} labelFormatter={(label: any) => format(new Date(label), 'HH:mm:ss')} formatter={(val: any) => [`${val}%`, undefined]} />
            <Area type="monotone" dataKey="errorRate" stroke="#F43F5E" fillOpacity={1} fill="url(#colorError)" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
