// src/lib/utils.ts
// ─────────────────────────────────────────────────────────────
// Shared utility functions — safe on both server and client
// (No server-only import — these run anywhere)
// ─────────────────────────────────────────────────────────────

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

/**
 * cn — merges Tailwind classes safely (resolves conflicts)
 * Use this instead of template strings for conditional Tailwind classes
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * formatCurrency — formats a number as USD currency
 * Used in KPI cards, revenue tables
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * formatNumber — compact number formatting (12,840 → 12.8K)
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: value >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * formatPercent — formats a decimal as a percentage string
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * formatMs — formats milliseconds with unit
 */
export function formatMs(value: number): string {
  return `${Math.round(value)}ms`;
}

/**
 * formatRelativeTime — "2 minutes ago"
 * Takes an ISO string — safe to use in client components
 */
export function formatRelativeTime(isoString: string): string {
  return formatDistanceToNow(new Date(isoString), { addSuffix: true });
}

/**
 * formatChartDate — short date for chart x-axis labels
 */
export function formatChartDate(isoDateString: string): string {
  return format(new Date(isoDateString), 'MMM d');
}

/**
 * getDefaultDateRange — returns ISO strings for last 30 days
 * Used as default filter values when none are in the URL
 */
export function getDefaultDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: format(from, 'yyyy-MM-dd'),
    to: format(to, 'yyyy-MM-dd'),
  };
}
