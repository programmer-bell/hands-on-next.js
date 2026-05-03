// src/components/layout/LiveClock.tsx
'use client';

import { useState, useEffect } from 'react';

export default function LiveClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!time) return <div className="text-dash-cyan font-mono text-sm tracking-wider opacity-0">00:00:00</div>;

  return (
    <div className="text-dash-cyan font-mono text-sm tracking-wider">
      {time.toLocaleTimeString('en-US', { hour12: false })}
    </div>
  );
}
