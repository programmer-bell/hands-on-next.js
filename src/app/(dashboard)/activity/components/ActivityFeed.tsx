// src/app/(dashboard)/activity/components/ActivityFeed.tsx
// ─────────────────────────────────────────────────────────────
// Live event feed
// Runs on: CLIENT ('use client')
// ─────────────────────────────────────────────────────────────

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface ActivityEvent {
  id: string;
  timestamp: string;
  type: string;
  user: string;
  detail: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  amount?: number;
}

interface ActivityFeedProps {
  initialEvents: ActivityEvent[];
  pollInterval?: number;
}

const severityColors = {
  info: 'bg-dash-cyan',
  success: 'bg-dash-success',
  warning: 'bg-dash-warning',
  error: 'bg-dash-danger',
};

export default function ActivityFeed({ initialEvents, pollInterval = 3000 }: ActivityFeedProps) {
  const [events, setEvents] = useState<ActivityEvent[]>(initialEvents);
  const [now, setNow] = useState(Date.now());
  const [mounted, setMounted] = useState(false);

  // Update "time ago" every minute
  useEffect(() => {
    setMounted(true);
    const ticker = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(ticker);
  }, []);

  // Poll for fresh activity events every 3 seconds
  // Cleanup: clearInterval on unmount prevents zombie fetches.
  // De-duplication: we merge new events with old ones, filtering by ID.
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await fetch('/api/activity?count=10'); // Fetch last 10
        if (!res.ok) return;
        const json = await res.json();
        const incoming: ActivityEvent[] = json.events;
        
        setEvents((prev) => {
          const newEvents = incoming.filter(inv => !prev.some(p => p.id === inv.id));
          if (newEvents.length === 0) return prev;
          
          // Max 50 events memory management: prevents unbounded memory growth 
          // when leaving dashboard open for days.
          const combined = [...newEvents, ...prev];
          return combined.slice(0, 50);
        });
      } catch (err) {
        // Silent error handling for polling
      }
    };

    const intervalId = setInterval(fetchActivity, pollInterval);
    return () => clearInterval(intervalId);
  }, [pollInterval]);

  return (
    <div className="bg-dash-surface border border-dash-border rounded-xl flex flex-col h-full max-h-[800px] overflow-hidden">
      <div className="flex justify-between items-center p-6 border-b border-dash-border shrink-0">
        <h2 className="text-lg font-display text-dash-text flex items-center gap-3">
          Activity Feed
          <span className="bg-dash-muted text-dash-subtle text-xs px-2 py-0.5 rounded-full font-mono">
            {events.length}
          </span>
        </h2>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-dash-success animate-pulse" />
          <span className="text-dash-text tracking-widest uppercase">LIVE</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 relative">
        <AnimatePresence initial={false}>
          {events.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-start gap-4 p-3 rounded-lg hover:bg-dash-elevated transition-colors border border-transparent hover:border-dash-border"
            >
              <div className="shrink-0 mt-1.5">
                <span className={`block w-2 h-2 rounded-full ${severityColors[event.severity]}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm font-medium text-dash-text truncate pr-4">
                    {event.user}
                  </p>
                  <span className="text-xs text-dash-subtle font-mono shrink-0">
                    {mounted ? formatDistanceToNow(new Date(event.timestamp), { addSuffix: true }) : ''}
                  </span>
                </div>
                <p className="text-sm text-dash-subtle">
                  <span className="uppercase text-xs font-display tracking-wider text-dash-text mr-2">
                    {event.type.replace('_', ' ')}
                  </span>
                  {event.detail}
                  {event.amount && (
                    <span className="ml-2 font-mono text-dash-success">
                      +${event.amount.toLocaleString()}
                    </span>
                  )}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
