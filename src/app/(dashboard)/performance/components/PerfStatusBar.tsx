// src/app/(dashboard)/performance/components/PerfStatusBar.tsx
'use client';
import { useState, useEffect } from 'react';
import { PerfStatus } from '@/types';

export default function PerfStatusBar({ status: initialStatus }: { status: PerfStatus }) {
  const [status, setStatus] = useState<PerfStatus>(initialStatus);

  useEffect(() => {
    const fetchPerf = async () => {
      try {
        const res = await fetch('/api/performance');
        if (!res.ok) return;
        const json = await res.json();
        setStatus(json.status);
      } catch (err) {}
    };
    const id = setInterval(fetchPerf, 3000);
    return () => clearInterval(id);
  }, []);

  const colorMap = {
    healthy: 'bg-dash-success text-dash-bg',
    degraded: 'bg-dash-warning text-dash-bg',
    critical: 'bg-dash-danger text-dash-text',
  };

  return (
    <div className="flex gap-4">
      {Object.entries(status).map(([key, val]) => (
        <div key={key} className={`px-4 py-2 rounded-lg text-sm font-display uppercase tracking-widest ${colorMap[val as keyof typeof colorMap]}`}>
          {key}: {val}
        </div>
      ))}
    </div>
  );
}
