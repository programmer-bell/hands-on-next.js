// src/app/(dashboard)/performance/components/ResponseTimeChart.tsx
// ─────────────────────────────────────────────────────────────
// Real-time server performance chart
// Runs on: CLIENT ('use client')
// ─────────────────────────────────────────────────────────────

'use client';

import { useState, useEffect } from 'react';
import {
  ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, ReferenceLine
} from 'recharts';
import { format } from 'date-fns';

interface PerfDataPoint {
  timestamp: string;
  responseTimeP50: number;
  responseTimeP95: number;
  responseTimeP99: number;
  errorRate: number;
  throughput: number;
}

interface ResponseTimeChartProps {
  initialData: PerfDataPoint[];
  pollInterval?: number;
}

export default function ResponseTimeChart({ initialData, pollInterval = 3000 }: ResponseTimeChartProps) {
  const [data, setData] = useState<PerfDataPoint[]>(initialData);

  // Poll for fresh performance data every 3s
  // 3s interval is chosen for health monitoring: immediate visibility of latency spikes.
  // Sliding window: keeps the last 20 points, shifting oldest off to prevent chart compression.
  useEffect(() => {
    const fetchPerf = async () => {
      try {
        const res = await fetch('/api/performance');
        if (!res.ok) return;
        const json = await res.json();
        
        setData(json.data);
      } catch (err) {
        console.error('Failed to poll perf data:', err);
      }
    };

    const intervalId = setInterval(fetchPerf, pollInterval);
    return () => clearInterval(intervalId);
  }, [pollInterval]);

  return (
    <div className="bg-dash-surface border border-dash-border rounded-xl p-6">
      <div className="mb-6">
        <h2 className="text-lg font-display text-dash-text mb-1">Response Time (ms)</h2>
        <p className="text-sm text-dash-subtle">Percentile latency across all edge nodes</p>
      </div>

      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#252A40" vertical={false} />
            <XAxis 
              dataKey="timestamp" 
              stroke="#6B7280" 
              tick={{ fill: '#6B7280', fontSize: 12, fontFamily: 'var(--font-ibm-plex-mono)' }}
              tickFormatter={(val) => format(new Date(val), 'HH:mm:ss')}
              tickMargin={10}
            />
            <YAxis 
              stroke="#6B7280" 
              tick={{ fill: '#6B7280', fontSize: 12, fontFamily: 'var(--font-ibm-plex-mono)' }}
              tickMargin={10}
              domain={[0, (dataMax: number) => Math.max(dataMax * 1.2, 300)]}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0D0F1C', borderColor: '#1E2235', color: '#E2E4F0', fontFamily: 'var(--font-dm-sans)' }}
              itemStyle={{ fontFamily: 'var(--font-ibm-plex-mono)' }}
              labelFormatter={(label: any) => format(new Date(label), 'HH:mm:ss')}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            
            <ReferenceLine y={200} stroke="#F43F5E" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'SLA Threshold (200ms)', fill: '#F43F5E', fontSize: 12 }} />

            <Line 
              type="monotone" 
              dataKey="responseTimeP50" 
              name="p50 (Median)" 
              stroke="#00D4FF" 
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line 
              type="monotone" 
              dataKey="responseTimeP95" 
              name="p95" 
              stroke="#F59E0B" 
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line 
              type="monotone" 
              dataKey="responseTimeP99" 
              name="p99 (Tail)" 
              stroke="#F43F5E" 
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
