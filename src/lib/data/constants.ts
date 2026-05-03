// src/lib/data/constants.ts
// ─────────────────────────────────────────────────────────────
// Shared constants for fake data generation and filter options
// Used by: generators.ts, FilterBar component (for dropdown options),
//          route handlers (for validation)
// ─────────────────────────────────────────────────────────────

export const REVENUE_CATEGORIES = ['saas', 'enterprise', 'marketplace', 'services'] as const;
export type RevenueCategory = typeof REVENUE_CATEGORIES[number];

export const USER_SOURCES = ['organic', 'paid', 'referral', 'direct'] as const;
export type UserSource = typeof USER_SOURCES[number];

export const ACTIVITY_TYPES = [
  'signup', 'purchase', 'upgrade', 'cancellation', 'login', 'api_call',
] as const;
export type ActivityType = typeof ACTIVITY_TYPES[number];

// Filter display labels — used in CategorySelect dropdown
export const CATEGORY_FILTER_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'saas', label: 'SaaS' },
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'services', label: 'Services' },
] as const;

export const SOURCE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Sources' },
  { value: 'organic', label: 'Organic' },
  { value: 'paid', label: 'Paid' },
  { value: 'referral', label: 'Referral' },
  { value: 'direct', label: 'Direct' },
] as const;

// Chart color palette — used consistently across all Recharts charts
export const CHART_COLORS = {
  primary: '#00D4FF',    // electric cyan
  secondary: '#7C3AED', // purple
  success: '#10B981',   // emerald
  warning: '#F59E0B',   // amber
  danger: '#F43F5E',    // rose
  muted: '#334155',     // slate-700
} as const;

// Recharts color array for multi-series charts
export const CHART_COLOR_SEQUENCE = [
  '#00D4FF', '#7C3AED', '#10B981', '#F59E0B', '#F43F5E',
] as const;
