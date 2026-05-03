// src/lib/data/generators.ts
// ─────────────────────────────────────────────────────────────
// All fake data generator functions
// Runs on: SERVER ONLY — 'server-only' prevents client bundle inclusion
//
// Called by:
//   - page.tsx files (SSR initial data — uses STATIC_SEED)
//   - route.ts handlers (polling responses — uses getLiveSeed())
//
// Pattern: every generator accepts a `random` function parameter.
//   This makes generators testable and seed-controllable.
//   Pass createSeededRandom(STATIC_SEED) for SSR.
//   Pass createSeededRandom(getLiveSeed()) for polling.
// ─────────────────────────────────────────────────────────────

import 'server-only';
import { subDays, subHours, subMinutes, format, eachDayOfInterval } from 'date-fns';
import { faker } from '@faker-js/faker';
import type {
  KpiMetric, RevenueDataPoint, UserDataPoint, UserCohort,
  PerfDataPoint, PerfStatus, ActivityEvent, ReportRow, RevenueFilter,
} from '@/types';
import { createSeededRandom, STATIC_SEED, getLiveSeed } from './seed';
import { REVENUE_CATEGORIES, USER_SOURCES, ACTIVITY_TYPES } from './constants';

// ── KPI Metrics ──────────────────────────────────────────────

/**
 * generateKpiMetrics — produces the 4 overview KPI cards
 * For SSR: call with createSeededRandom(STATIC_SEED)
 * For polling: call with createSeededRandom(getLiveSeed())
 */
export function generateKpiMetrics(
  random: () => number = createSeededRandom(STATIC_SEED)
): KpiMetric[] {
  // Base values scaled to look realistic
  const baseRevenue = 48750 + random() * 5000;
  const baseUsers = 12840 + random() * 800;
  const baseConversion = 3.2 + random() * 0.8;
  const baseUptime = 99.7 + random() * 0.29;

  return [
    {
      id: 'revenue',
      label: 'Monthly Revenue',
      value: Math.round(baseRevenue),
      unit: 'currency',
      trend: parseFloat((random() * 12 - 2).toFixed(1)), // -2% to +10%
      trendDirection: random() > 0.25 ? 'up' : 'down',
      sparkline: Array.from({ length: 7 }, () => Math.round(40000 + random() * 15000)),
    },
    {
      id: 'users',
      label: 'Active Users',
      value: Math.round(baseUsers),
      unit: 'number',
      trend: parseFloat((random() * 8 - 1).toFixed(1)),
      trendDirection: random() > 0.2 ? 'up' : 'down',
      sparkline: Array.from({ length: 7 }, () => Math.round(10000 + random() * 4000)),
    },
    {
      id: 'conversion',
      label: 'Conversion Rate',
      value: parseFloat(baseConversion.toFixed(2)),
      unit: 'percent',
      trend: parseFloat((random() * 0.6 - 0.2).toFixed(2)),
      trendDirection: random() > 0.35 ? 'up' : 'down',
      sparkline: Array.from({ length: 7 }, () => parseFloat((3 + random() * 1.5).toFixed(2))),
    },
    {
      id: 'uptime',
      label: 'Uptime',
      value: parseFloat(baseUptime.toFixed(3)),
      unit: 'percent',
      trend: parseFloat((random() * 0.05 - 0.01).toFixed(3)),
      trendDirection: 'up',
      sparkline: Array.from({ length: 7 }, () => parseFloat((99.5 + random() * 0.5).toFixed(3))),
    },
  ];
}

// ── Revenue ─────────────────────────────────────────────────

/**
 * generateRevenueData — produces time-series revenue data
 * Accepts a filter to scope date range and category
 * For SSR: uses STATIC_SEED for reproducibility
 * For polling: uses getLiveSeed() for slight drift
 */
export function generateRevenueData(
  filter: Partial<RevenueFilter> = {},
  random: () => number = createSeededRandom(STATIC_SEED)
): RevenueDataPoint[] {
  const from = filter.from ? new Date(filter.from) : subDays(new Date(), 30);
  const to = filter.to ? new Date(filter.to) : new Date();
  const category = filter.category ?? 'all';

  const days = eachDayOfInterval({ start: from, end: to });

  return days.map((day) => {
    const base = 1200 + random() * 800;
    // Weekday boost: Mon-Fri higher than weekends
    const dayOfWeek = day.getDay();
    const weekdayMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 0.65 : 1.0;
    // Category multiplier
    const categoryMultiplier =
      category === 'enterprise' ? 2.4 :
      category === 'saas' ? 1.2 :
      category === 'marketplace' ? 0.7 : 1.0;

    return {
      date: format(day, 'yyyy-MM-dd'),
      revenue: Math.round(base * weekdayMultiplier * categoryMultiplier),
      target: Math.round(1500 * categoryMultiplier),
      category: category === 'all'
        ? REVENUE_CATEGORIES[Math.floor(random() * REVENUE_CATEGORIES.length)] ?? 'saas'
        : category,
    };
  });
}

// ── Users ────────────────────────────────────────────────────

/**
 * generateUserData — produces user acquisition time series
 */
export function generateUserData(
  from: Date = subDays(new Date(), 30),
  to: Date = new Date(),
  source: string = 'all',
  random: () => number = createSeededRandom(STATIC_SEED)
): UserDataPoint[] {
  const days = eachDayOfInterval({ start: from, end: to });

  return days.map((day) => {
    const base = 80 + random() * 60;
    const sourceMultiplier =
      source === 'paid' ? 1.8 :
      source === 'organic' ? 1.2 :
      source === 'referral' ? 0.9 : 1.0;

    const newUsers = Math.round(base * sourceMultiplier);
    return {
      date: format(day, 'yyyy-MM-dd'),
      newUsers,
      activeUsers: Math.round(newUsers * (3 + random() * 2)),
      churnedUsers: Math.round(newUsers * (0.05 + random() * 0.08)),
      source: source === 'all'
        ? USER_SOURCES[Math.floor(random() * USER_SOURCES.length)] ?? 'organic'
        : source,
    };
  });
}

/**
 * generateCohortData — produces retention cohort table rows
 */
export function generateCohortData(
  random: () => number = createSeededRandom(STATIC_SEED)
): UserCohort[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const year = new Date().getFullYear();
  return months.map((month) => ({
    cohort: `${month} ${year}`,
    size: Math.round(800 + random() * 400),
    retentionD7: parseFloat((60 + random() * 20).toFixed(1)),
    retentionD30: parseFloat((35 + random() * 20).toFixed(1)),
    retentionD90: parseFloat((20 + random() * 15).toFixed(1)),
  }));
}

// ── Performance ──────────────────────────────────────────────

/**
 * generatePerfData — produces server performance time series
 * This is called by the polling endpoint every 3 seconds
 * getLiveSeed() ensures each call returns slightly different values
 */
export function generatePerfData(
  points: number = 20,
  random: () => number = createSeededRandom(getLiveSeed())
): PerfDataPoint[] {
  return Array.from({ length: points }, (_, i) => {
    const timestamp = subMinutes(new Date(), (points - i) * 3);
    // Simulate occasional spikes — realistic pattern
    const spike = random() > 0.85;
    return {
      timestamp: timestamp.toISOString(),
      responseTimeP50: Math.round(80 + random() * 40 + (spike ? 200 : 0)),
      responseTimeP95: Math.round(150 + random() * 80 + (spike ? 500 : 0)),
      responseTimeP99: Math.round(250 + random() * 150 + (spike ? 1000 : 0)),
      errorRate: parseFloat((random() * 2 + (spike ? 5 : 0)).toFixed(2)),
      throughput: Math.round(800 + random() * 400 - (spike ? 300 : 0)),
    };
  });
}

/**
 * generatePerfStatus — derives health status from latest perf point
 */
export function generatePerfStatus(
  random: () => number = createSeededRandom(getLiveSeed())
): PerfStatus {
  const p = generatePerfData(1, random)[0]!;
  return {
    overall: p.errorRate > 5 ? 'critical' : p.responseTimeP95 > 400 ? 'degraded' : 'healthy',
    responseTime: p.responseTimeP95 > 400 ? 'degraded' : p.responseTimeP95 > 700 ? 'critical' : 'healthy',
    errorRate: p.errorRate > 5 ? 'critical' : p.errorRate > 2 ? 'degraded' : 'healthy',
    throughput: p.throughput < 400 ? 'degraded' : 'healthy',
  };
}

// ── Activity ─────────────────────────────────────────────────

/**
 * generateActivityEvents — produces a live event feed
 * Called by: /api/activity route handler (polls every 3s)
 * Each call with getLiveSeed() produces a slightly different set of events
 */
export function generateActivityEvents(
  count: number = 20,
  random: () => number = createSeededRandom(getLiveSeed())
): ActivityEvent[] {
  faker.seed(Math.floor(random() * 100000));

  return Array.from({ length: count }, (_, i) => {
    const type = ACTIVITY_TYPES[Math.floor(random() * ACTIVITY_TYPES.length)] ?? 'login';
    const severity =
      type === 'cancellation' ? 'warning' :
      type === 'purchase' || type === 'upgrade' ? 'success' :
      type === 'api_call' && random() > 0.9 ? 'error' : 'info';

    const amount = (type === 'purchase' || type === 'upgrade')
      ? Math.round(49 + random() * 951)
      : undefined;

    return {
      id: faker.string.uuid(),
      timestamp: subMinutes(new Date(), i * (random() * 2)).toISOString(),
      type: type as ActivityEvent['type'],
      user: faker.person.fullName(),
      detail: generateActivityDetail(type, amount, faker),
      severity: severity as ActivityEvent['severity'],
      amount,
    };
  });
}

function generateActivityDetail(
  type: string,
  amount: number | undefined,
  f: typeof faker
): string {
  switch (type) {
    case 'signup': return `New account created via ${f.helpers.arrayElement(['Google', 'Email', 'GitHub'])}`;
    case 'purchase': return `Purchased ${f.helpers.arrayElement(['Pro', 'Starter', 'Business'])} plan — $${amount}`;
    case 'upgrade': return `Upgraded to ${f.helpers.arrayElement(['Enterprise', 'Pro Max'])} — $${amount}/mo`;
    case 'cancellation': return `Cancelled ${f.helpers.arrayElement(['Pro', 'Business'])} subscription`;
    case 'login': return `Signed in from ${f.location.city()}, ${f.location.countryCode()}`;
    case 'api_call': return `API rate limit ${f.datatype.boolean() ? 'warning' : 'exceeded'} on ${f.internet.domainName()}`;
    default: return 'System event';
  }
}

// ── Reports ──────────────────────────────────────────────────

/**
 * generateReportRows — produces monthly summary rows for the reports page
 * This page is static (SSG) — uses STATIC_SEED, never drifts
 */
export function generateReportRows(
  random: () => number = createSeededRandom(STATIC_SEED)
): ReportRow[] {
  const months = ['January', 'February', 'March', 'April', 'May', 'June'];
  return months.map((period) => ({
    period,
    revenue: Math.round(35000 + random() * 20000),
    users: Math.round(8000 + random() * 5000),
    conversionRate: parseFloat((2.5 + random() * 2).toFixed(2)),
    avgResponseTime: Math.round(90 + random() * 60),
    errorRate: parseFloat((0.1 + random() * 1.5).toFixed(2)),
  }));
}
