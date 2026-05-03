// src/app/(dashboard)/layout.tsx
// ─────────────────────────────────────────────────────────────
// Dashboard shell — wraps all metric pages
// Runs on: SERVER
//
// Renders: Sidebar (client) + main content area
// The layout itself is a server component — only Sidebar is 'use client'
// Sidebar receives nav config as serialized props (no Date objects here)
// ─────────────────────────────────────────────────────────────

import LiveClock from '@/components/layout/LiveClock';
import Sidebar from '@/components/layout/Sidebar';

// Static nav config — no DB, just route definitions
const NAV_ITEMS = [
  { href: '/overview',     label: 'Overview',     icon: 'LayoutDashboard' },
  { href: '/revenue',      label: 'Revenue',       icon: 'DollarSign'     },
  { href: '/users',        label: 'Users',         icon: 'Users'          },
  { href: '/performance',  label: 'Performance',   icon: 'Activity'       },
  { href: '/activity',     label: 'Activity',      icon: 'Zap'            },
  { href: '/reports',      label: 'Reports',       icon: 'FileBarChart'   },
] as const;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-dash-bg grid-bg">
      {/* Sidebar: 'use client' — receives static nav config */}
      <Sidebar navItems={NAV_ITEMS} />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-dash-border shrink-0">
          <div className="text-sm text-dash-subtle font-display uppercase tracking-widest">
            Analytics Dashboard
          </div>
          {/* LiveClock: 'use client' — ticking clock, needs browser timer */}
          <LiveClock />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
