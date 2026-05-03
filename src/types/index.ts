// src/types/index.ts
// ─────────────────────────────────────────────────────────────
// Global TypeScript type definitions
// Used by: generators.ts, route handlers, page.tsx files, chart components
// These types define the data contract between server generators
// and client chart components — every data shape flows through these.
// ─────────────────────────────────────────────────────────────

// ── KPI / Overview ──────────────────────────────────────────
export interface KpiMetric {
  id: string;
  label: string;
  value: number;
  unit: 'currency' | 'number' | 'percent' | 'ms';
  trend: number;         // percentage change vs previous period
  trendDirection: 'up' | 'down' | 'flat';
  sparkline: number[];   // last 7 data points for mini chart
}

// ── Revenue ─────────────────────────────────────────────────
export interface RevenueDataPoint {
  date: string;          // ISO string — never Date object across boundary
  revenue: number;
  target: number;
  category: string;
}

export interface RevenueFilter {
  from: string;          // ISO date string
  to: string;            // ISO date string
  category: string;      // 'all' | 'saas' | 'enterprise' | 'marketplace'
}

// ── Users ────────────────────────────────────────────────────
export interface UserDataPoint {
  date: string;
  newUsers: number;
  activeUsers: number;
  churnedUsers: number;
  source: string;        // 'organic' | 'paid' | 'referral' | 'direct'
}

export interface UserCohort {
  cohort: string;        // e.g. "Jan 2024"
  size: number;
  retentionD7: number;   // percentage
  retentionD30: number;
  retentionD90: number;
}

// ── Performance ──────────────────────────────────────────────
export interface PerfDataPoint {
  timestamp: string;     // ISO string — time of measurement
  responseTimeP50: number;  // milliseconds
  responseTimeP95: number;
  responseTimeP99: number;
  errorRate: number;        // percentage (0-100)
  throughput: number;       // requests per second
}

export interface PerfStatus {
  overall: 'healthy' | 'degraded' | 'critical';
  responseTime: 'healthy' | 'degraded' | 'critical';
  errorRate: 'healthy' | 'degraded' | 'critical';
  throughput: 'healthy' | 'degraded' | 'critical';
}

// ── Activity ─────────────────────────────────────────────────
export interface ActivityEvent {
  id: string;
  timestamp: string;     // ISO string
  type: 'signup' | 'purchase' | 'upgrade' | 'cancellation' | 'login' | 'api_call';
  user: string;          // fake name
  detail: string;        // descriptive string
  severity: 'info' | 'success' | 'warning' | 'error';
  amount?: number;       // only for purchase/upgrade events
}

// ── Reports ──────────────────────────────────────────────────
export interface ReportRow {
  period: string;
  revenue: number;
  users: number;
  conversionRate: number;
  avgResponseTime: number;
  errorRate: number;
}

// ── Filter Params (shared across features) ───────────────────
export interface DateRangeFilter {
  from: string;
  to: string;
}
