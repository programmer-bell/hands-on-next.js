// src/components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export default function Sidebar({ navItems }: { navItems: readonly NavItem[] }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-dash-surface border-r border-dash-border flex flex-col h-full shrink-0">
      <div className="h-14 flex items-center px-6 border-b border-dash-border">
        <div className="flex items-center gap-2 text-dash-cyan">
          <Icons.Activity size={24} />
          <span className="font-display font-bold tracking-wider text-dash-text">Analytics</span>
        </div>
      </div>
      
      <nav className="flex-1 py-6 px-4 space-y-1">
        {navItems.map((item) => {
          // @ts-ignore
          const Icon = Icons[item.icon] || Icons.Circle;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive 
                  ? "bg-dash-cyan/10 text-dash-cyan shadow-[inset_3px_0_0_0_#00D4FF]" 
                  : "text-dash-subtle hover:text-dash-text hover:bg-dash-elevated"
              )}
            >
              <Icon size={18} className={isActive ? "opacity-100 drop-shadow-[0_0_8px_#00D4FF]" : "opacity-70"} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-dash-border">
        <div className="flex items-center gap-2 text-xs font-mono text-dash-subtle">
          <span className="w-2 h-2 rounded-full bg-dash-success animate-pulse" />
          v1.0 — LIVE
        </div>
      </div>
    </aside>
  );
}
