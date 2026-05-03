// src/app/(dashboard)/overview/components/KpiCard.tsx
// ─────────────────────────────────────────────────────────────
// Individual KPI metric card with animated counter
// Runs on: CLIENT ('use client')
// 
// Why CSR? framer-motion animations rely on the browser's DOM 
// and `requestAnimationFrame`. They cannot run on the server.
// ─────────────────────────────────────────────────────────────

'use client';

import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricData {
  id: string;
  label: string;
  value: number;
  unit: 'currency' | 'number' | 'percent' | 'ms';
  trend: number;
  trendDirection: 'up' | 'down' | 'flat';
  sparkline: number[];
}

interface KpiCardProps {
  metric: MetricData;
}

export default function KpiCard({ metric }: KpiCardProps) {
  // Use framer-motion spring for smooth counting animation
  const springValue = useSpring(0, {
    bounce: 0,
    duration: 1500,
  });

  // Whenever the metric value updates (from polling), animate to the new value
  useEffect(() => {
    springValue.set(metric.value);
  }, [metric.value, springValue]);

  // Format the animated value based on its unit
  const displayValue = useTransform(springValue, (current) => {
    if (metric.unit === 'currency') return `$${Math.round(current).toLocaleString()}`;
    if (metric.unit === 'percent') return `${current.toFixed(1)}%`;
    if (metric.unit === 'ms') return `${Math.round(current)}ms`;
    
    // number
    if (current >= 1000) return `${(current / 1000).toFixed(1)}k`;
    return Math.round(current).toString();
  });

  const isUp = metric.trendDirection === 'up';
  const isDown = metric.trendDirection === 'down';
  const isFlat = metric.trendDirection === 'flat';

  const sparklineData = metric.sparkline.map((v, i) => ({ value: v, index: i }));

  return (
    <div className="bg-dash-surface border-t-2 border-t-dash-cyan border border-dash-border rounded-xl p-5 relative overflow-hidden group">
      {/* Subtle background glow on hover */}
      <div className="absolute inset-0 bg-dash-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <h3 className="text-sm font-display text-dash-subtle mb-3 uppercase tracking-wider">{metric.label}</h3>
      
      <div className="flex items-end justify-between mb-4">
        <motion.div className="text-3xl font-mono text-dash-text">
          {displayValue}
        </motion.div>
        
        <div className={`flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-md bg-dash-elevated ${
          isUp ? 'text-dash-success' : isDown ? 'text-dash-danger' : 'text-dash-subtle'
        }`}>
          {isUp ? <TrendingUp size={14} /> : isDown ? <TrendingDown size={14} /> : <Minus size={14} />}
          {Math.abs(metric.trend).toFixed(1)}%
        </div>
      </div>

      {/* Mini Sparkline */}
      <div className="h-10 w-full mt-auto opacity-70 group-hover:opacity-100 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparklineData}>
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={isUp ? '#10B981' : isDown ? '#F43F5E' : '#6B7280'} 
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
