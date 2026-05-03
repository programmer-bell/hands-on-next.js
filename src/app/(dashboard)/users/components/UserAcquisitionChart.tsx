// src/app/(dashboard)/users/components/UserAcquisitionChart.tsx
'use client';

import { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { format } from 'date-fns';
import { UserDataPoint } from '@/types';

interface UserAcquisitionChartProps {
  initialData: UserDataPoint[];
  filter: { from: string; to: string; source: string };
  pollInterval?: number;
}

export default function UserAcquisitionChart({ initialData, filter, pollInterval = 10000 }: UserAcquisitionChartProps) {
  const [data, setData] = useState<UserDataPoint[]>(initialData);

  useEffect(() => {
    setData(initialData); // Update data if filter props change via SSR hydration
  }, [initialData]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const params = new URLSearchParams();
        if (filter.from) params.set('from', filter.from);
        if (filter.to) params.set('to', filter.to);
        if (filter.source && filter.source !== 'all') params.set('source', filter.source);

        const res = await fetch(`/api/users?${params.toString()}`);
        if (!res.ok) return;
        const json = await res.json();
        setData(json.data);
      } catch (err) {}
    };

    const id = setInterval(fetchUsers, pollInterval);
    return () => clearInterval(id);
  }, [filter, pollInterval]);

  return (
    <div className="bg-dash-surface border border-dash-border rounded-xl p-6">
      <div className="mb-6">
        <h2 className="text-lg font-display text-dash-text mb-1">Acquisition & Churn</h2>
      </div>
      <div className="w-full h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#252A40" vertical={false} />
            <XAxis dataKey="date" stroke="#6B7280" tick={{ fill: '#6B7280', fontSize: 12, fontFamily: 'var(--font-ibm-plex-mono)' }} tickFormatter={(val) => format(new Date(val), 'MMM dd')} tickMargin={10} />
            <YAxis stroke="#6B7280" tick={{ fill: '#6B7280', fontSize: 12, fontFamily: 'var(--font-ibm-plex-mono)' }} tickMargin={10} />
            <Tooltip contentStyle={{ backgroundColor: '#0D0F1C', borderColor: '#1E2235', color: '#E2E4F0' }} itemStyle={{ fontFamily: 'var(--font-ibm-plex-mono)' }} labelFormatter={(label: any) => format(new Date(label), 'MMM dd, yyyy')} cursor={{ fill: '#1E2235' }} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="newUsers" name="New Users" fill="#00D4FF" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="churnedUsers" name="Churned Users" fill="#F43F5E" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
