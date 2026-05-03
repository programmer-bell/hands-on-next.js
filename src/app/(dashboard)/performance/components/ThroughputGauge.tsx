// src/app/(dashboard)/performance/components/ThroughputGauge.tsx
// ─────────────────────────────────────────────────────────────
// Real-time server throughput gauge
// Runs on: CLIENT ('use client')
// ─────────────────────────────────────────────────────────────

'use client';

import { useState, useEffect } from 'react';
import { ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts';

interface ThroughputGaugeProps {
  initialThroughput: number;
  pollInterval?: number;
}

export default function ThroughputGauge({ initialThroughput, pollInterval = 3000 }: ThroughputGaugeProps) {
  const [throughput, setThroughput] = useState(initialThroughput);

  useEffect(() => {
    const fetchPerf = async () => {
      try {
        const res = await fetch('/api/performance');
        if (!res.ok) return;
        const json = await res.json();
        
        // Extract throughput from latest data point
        const latest = json.data[json.data.length - 1];
        if (latest) {
          setThroughput(latest.throughput);
        }
      } catch (err) {
        // silent catch
      }
    };

    const intervalId = setInterval(fetchPerf, pollInterval);
    return () => clearInterval(intervalId);
  }, [pollInterval]);

  // Color logic
  let color = '#10B981'; // green (< 1000)
  if (throughput >= 1000 && throughput <= 1500) color = '#F59E0B'; // amber (1000-1500)
  if (throughput < 500) color = '#F43F5E'; // rose (< 500) per instructions

  const data = [
    {
      name: 'Throughput',
      value: throughput,
      fill: color,
    }
  ];

  return (
    <div className="bg-dash-surface border border-dash-border rounded-xl p-6 flex flex-col items-center justify-center">
      <div className="text-center mb-2">
        <h2 className="text-lg font-display text-dash-text">Throughput</h2>
        <p className="text-sm text-dash-subtle">Requests per second (rps)</p>
      </div>

      <div className="w-full h-64 relative flex items-center justify-center mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart 
            cx="50%" 
            cy="50%" 
            innerRadius="70%" 
            outerRadius="100%" 
            barSize={15} 
            data={data}
            startAngle={180}
            endAngle={0}
          >
            <RadialBar
              background={{ fill: '#1E2235' }}
              dataKey="value"
              cornerRadius={10}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pt-12 text-center">
          <div className="text-4xl font-mono text-dash-text mb-1">{Math.round(throughput)}</div>
          <div className="text-xs text-dash-subtle tracking-widest uppercase">REQ/SEC</div>
        </div>
      </div>
    </div>
  );
}
