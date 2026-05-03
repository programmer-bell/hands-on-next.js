# GEMINI.README
## Real-time Analytics Dashboard — Fake Data
### Execution Document for AI-Driven Development

---

> **HOW TO USE THIS FILE**
> You are Gemini. You will build this entire application step by step, phase by phase.
> Never skip a phase. Never skip a step inside a phase.
> Every code file you create must include workflow comments so the developer can understand
> what is happening at each layer — server, client, polling, filter state, and boundary crossing.
> All code must be TypeScript. All UI must use the **Stitch MCP** for component generation.
> All terminal operations, scaffolding, and setup must use the **Antigravity MCP**.
> Read the CONSTRAINTS section before writing a single line of code.

---

## TABLE OF CONTENTS

1. [Project Overview](#1-project-overview)
2. [Architecture & Mental Model](#2-architecture--mental-model)
3. [Tech Stack](#3-tech-stack)
4. [Complete Folder Structure](#4-complete-folder-structure)
5. [MCP Tool Instructions](#5-mcp-tool-instructions)
6. [CONSTRAINTS — Read First](#6-constraints--read-first)
7. [Phase 0 — Environment Bootstrap](#phase-0--environment-bootstrap)
8. [Phase 1 — Fake Data Generation Layer](#phase-1--fake-data-generation-layer)
9. [Phase 2 — Root Layout, Fonts & Global Styles](#phase-2--root-layout-fonts--global-styles)
10. [Phase 3 — Middleware & Rate Limiting](#phase-3--middleware--rate-limiting)
11. [Phase 4 — Route Handlers (API Layer)](#phase-4--route-handlers-api-layer)
12. [Phase 5 — Server Components & Initial SSR Data](#phase-5--server-components--initial-ssr-data)
13. [Phase 6 — Client Components (Charts & Live Updates)](#phase-6--client-components-charts--live-updates)
14. [Phase 7 — Filter System (URL State)](#phase-7--filter-system-url-state)
15. [Phase 8 — Page Routes (Full App)](#phase-8--page-routes-full-app)
16. [Phase 9 — UI Polish with Stitch MCP](#phase-9--ui-polish-with-stitch-mcp)
17. [Phase 10 — Error, Loading & Not-Found States](#phase-10--error-loading--not-found-states)
18. [Phase 11 — Final Verification Checklist](#phase-11--final-verification-checklist)

---

## 1. PROJECT OVERVIEW

### What You Are Building
A **Real-time Analytics Dashboard** — a production-grade, data-dense monitoring interface
powered entirely by deterministic fake data. No real database. The focus is on
data flow architecture, live polling, filter state management, and chart rendering.

| Section | What it shows |
|---|---|
| Overview | KPI cards (revenue, users, conversion, uptime) + sparklines |
| Revenue | Line/bar chart, date range filter, category filter, trend indicator |
| Users | Area chart of acquisition, cohort breakdown, source filter |
| Performance | Server response time, error rate, throughput — all live-updating |
| Activity | Live feed of fake events, auto-polls every 3 seconds |
| Reports | Static SSR snapshot, exportable summary table |

### Core Next.js Concepts Being Practiced

| Concept | Where it appears |
|---|---|
| Server components (SSR) | All page.tsx — initial data snapshot from fake generators |
| Client components | Every chart, live counter, filter bar, activity feed |
| CSR (legitimate) | Polling with setInterval — charts update every N seconds |
| Route handlers | `/api/metrics`, `/api/revenue`, `/api/users`, `/api/activity`, `/api/performance` |
| Middleware | Request logging + simulated rate-limit header injection |
| File-based routing | `/`, `/revenue`, `/users`, `/performance`, `/activity`, `/reports` |
| URL param state | Filters stored in URL via `nuqs` — shareable, bookmarkable |
| Dynamic rendering | `cache: 'no-store'` on all metric endpoints — always fresh |
| Parallel data fetch | `Promise.all()` in overview page.tsx for all KPI data |
| Suspense + streaming | Each chart section streams in independently |
| Route groups | `(dashboard)` group wraps all metric pages with shared layout |
| Nested layouts | Root → dashboard shell → page content |
| loading.tsx | Chart skeleton on every route |
| error.tsx | Graceful degradation when polling fails |
| Colocation | generators, types, hooks inside each feature folder |
| Serialization | Date objects → ISO strings before crossing server→client boundary |

### Why Fake Data?
This project intentionally has no database. The lesson is architecture, not storage.
Fake data is generated deterministically on the server — the same seed produces the same
numbers, so SSR output is stable and predictable. Live polling calls the route handlers,
which return slightly varied data to simulate real metric drift.

---

## 2. ARCHITECTURE & MENTAL MODEL

```
BROWSER
  │
  ├── Initial load (SSR)
  │     GET /revenue
  │       ▼
  │     Next.js server renders page.tsx
  │       ▼
  │     generateRevenueData() called on server
  │       ▼
  │     HTML with chart data baked in → browser
  │       ▼
  │     React hydrates → RevenueChart becomes interactive
  │
  └── Live polling (CSR — legitimate browser need)
        setInterval every 5s
          ▼
        fetch('/api/revenue?from=...&to=...&category=...')
          ▼
        Next.js route handler (route.ts)
          ▼
        generateRevenueData() called again → slightly different numbers
          ▼
        JSON response → chart state updates → smooth re-render
```

### Server vs Client Boundary

```
SERVER SIDE (no JS shipped)              CLIENT SIDE ('use client')
────────────────────────────             ─────────────────────────────────
page.tsx (all pages)                     RevenueChart.tsx (Recharts — browser only)
layout.tsx                               UserChart.tsx (Recharts)
lib/data/generators.ts (fake data)       PerformanceChart.tsx (Recharts)
lib/data/seed.ts (determinism)           ActivityFeed.tsx (polling, useState)
app/api/*/route.ts (handlers)            KpiCard.tsx (animated counter)
middleware.ts (edge)                     FilterBar.tsx (nuqs URL state)
                                         LiveIndicator.tsx (pulse animation)
                                         DateRangePicker.tsx (date inputs)
                                         CategorySelect.tsx (dropdown)
```

### Why Charts Must Be Client Components
Recharts (and all charting libraries) use browser APIs — SVG rendering, DOM
measurement, ResizeObserver for responsive sizing. They cannot run on the server.
This is the canonical legitimate use case for 'use client'.

The pattern for every chart page:
```
page.tsx (SERVER)
  │  generates initial data with fake generator
  │  serializes to plain objects (no Date instances)
  ▼
ChartComponent.tsx ('use client')
  │  receives initialData as props (SSR snapshot)
  │  renders Recharts immediately (no loading flash)
  │  starts polling interval on mount (useEffect)
  │  fetches /api/[metric] every N seconds
  │  merges new data into chart state
  ▼
User sees live-updating chart, no initial blank state
```

### Filter State Flow

```
User changes date range filter
  │
  ▼
FilterBar.tsx ('use client') — uses nuqs
  │  updates URL: /revenue?from=2024-01-01&to=2024-03-31&category=saas
  ▼
Next.js router detects URL change
  │
  ▼
page.tsx re-renders on server with new searchParams
  │  reads ?from= and ?to= from searchParams prop
  │  generates filtered fake data
  ▼
New HTML streams to browser
  │
  ▼
ChartComponent receives new initialData prop
  │  resets polling with new filter params baked into fetch URL
  ▼
Chart shows filtered data, live polling continues with same filter
```

---

## 3. TECH STACK

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 14 (App Router) | SSR initial data, route handlers for polling |
| Language | TypeScript (strict mode) | Type-safe data shapes across server+client |
| Styling | Tailwind CSS | Utility-first, Stitch MCP compatible |
| Charts | Recharts | React-native charts, responsive, Composable API |
| Fake data | @faker-js/faker | Realistic seeded random data generation |
| Date handling | date-fns | Date arithmetic for time-series generation |
| URL state | nuqs | Type-safe URL search params as React state |
| Animations | framer-motion | KPI counter animations, chart transitions |
| UI Components | Stitch MCP | Production-grade component generation |
| Terminal ops | Antigravity MCP | Scaffolding, installs, build commands |
| Icons | lucide-react | Consistent icon system |

---

## 4. COMPLETE FOLDER STRUCTURE

> Build EXACTLY this structure. Do not deviate. Colocation is mandatory.
> There is NO database, NO Prisma, NO ORM. Fake data lives in `lib/data/`.

```
realtime-dashboard/
│
├── public/
│   └── favicon.ico
│
├── src/
│   ├── app/                          ← Next.js App Router root
│   │   │
│   │   ├── (dashboard)/              ← Route group: all metric pages
│   │   │   ├── layout.tsx            ← Dashboard shell (sidebar + topbar)
│   │   │   │
│   │   │   ├── page.tsx              ← GET / (overview — redirects to /overview)
│   │   │   │
│   │   │   ├── overview/
│   │   │   │   ├── page.tsx          ← GET /overview (SSR, parallel KPI fetch)
│   │   │   │   ├── loading.tsx       ← KPI skeleton grid
│   │   │   │   ├── error.tsx         ← Error boundary
│   │   │   │   └── components/
│   │   │   │       ├── KpiGrid.tsx           ← server: KPI card grid
│   │   │   │       ├── KpiCard.tsx           ← 'use client': animated counter
│   │   │   │       ├── MiniSparkline.tsx     ← 'use client': tiny inline chart
│   │   │   │       └── OverviewCharts.tsx    ← 'use client': summary charts
│   │   │   │
│   │   │   ├── revenue/
│   │   │   │   ├── page.tsx          ← GET /revenue (SSR initial data)
│   │   │   │   ├── loading.tsx       ← Chart skeleton
│   │   │   │   ├── error.tsx
│   │   │   │   ├── types.ts          ← RevenueDataPoint, RevenueFilter types
│   │   │   │   └── components/
│   │   │   │       ├── RevenueChart.tsx      ← 'use client': live line/bar chart
│   │   │   │       ├── RevenueSummary.tsx    ← 'use client': totals + trend
│   │   │   │       └── RevenueTable.tsx      ← server: top entries table
│   │   │   │
│   │   │   ├── users/
│   │   │   │   ├── page.tsx          ← GET /users
│   │   │   │   ├── loading.tsx
│   │   │   │   ├── error.tsx
│   │   │   │   ├── types.ts          ← UserDataPoint, UserFilter types
│   │   │   │   └── components/
│   │   │   │       ├── UserAcquisitionChart.tsx  ← 'use client': area chart
│   │   │   │       ├── CohortTable.tsx           ← server: cohort breakdown
│   │   │   │       └── SourceBreakdown.tsx       ← 'use client': donut chart
│   │   │   │
│   │   │   ├── performance/
│   │   │   │   ├── page.tsx          ← GET /performance
│   │   │   │   ├── loading.tsx
│   │   │   │   ├── error.tsx
│   │   │   │   ├── types.ts          ← PerfDataPoint, PerfMetric types
│   │   │   │   └── components/
│   │   │   │       ├── ResponseTimeChart.tsx   ← 'use client': live line, polls 3s
│   │   │   │       ├── ErrorRateChart.tsx      ← 'use client': live bar, polls 3s
│   │   │   │       ├── ThroughputGauge.tsx     ← 'use client': gauge chart
│   │   │   │       └── PerfStatusBar.tsx       ← 'use client': status indicators
│   │   │   │
│   │   │   ├── activity/
│   │   │   │   ├── page.tsx          ← GET /activity (SSR first 20 events)
│   │   │   │   ├── loading.tsx
│   │   │   │   ├── error.tsx
│   │   │   │   ├── types.ts          ← ActivityEvent types
│   │   │   │   └── components/
│   │   │   │       ├── ActivityFeed.tsx    ← 'use client': polls /api/activity 3s
│   │   │   │       ├── ActivityItem.tsx    ← server: single event row
│   │   │   │       └── LiveBadge.tsx      ← 'use client': pulse animation
│   │   │   │
│   │   │   └── reports/
│   │   │       ├── page.tsx          ← GET /reports (SSR static snapshot — SSG)
│   │   │       ├── loading.tsx
│   │   │       ├── error.tsx
│   │   │       └── components/
│   │   │           ├── ReportSummary.tsx     ← server: static summary cards
│   │   │           └── ReportTable.tsx       ← server: full data table
│   │   │
│   │   ├── api/                       ← Route handlers — polled by client components
│   │   │   ├── metrics/
│   │   │   │   └── route.ts          ← GET /api/metrics (all KPIs, no-store cache)
│   │   │   ├── revenue/
│   │   │   │   └── route.ts          ← GET /api/revenue?from=&to=&category=
│   │   │   ├── users/
│   │   │   │   └── route.ts          ← GET /api/users?from=&to=&source=
│   │   │   ├── performance/
│   │   │   │   └── route.ts          ← GET /api/performance (polls every 3s)
│   │   │   └── activity/
│   │   │       └── route.ts          ← GET /api/activity?cursor= (latest events)
│   │   │
│   │   ├── layout.tsx                ← Root layout (html, body, fonts)
│   │   ├── not-found.tsx
│   │   └── global-error.tsx
│   │
│   ├── components/                   ← Truly shared UI primitives
│   │   ├── ui/                       ← Base components (from Stitch MCP)
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── Tooltip.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx           ← 'use client': collapsible nav
│   │   │   ├── Topbar.tsx            ← server: breadcrumb + live clock area
│   │   │   └── LiveClock.tsx         ← 'use client': ticking clock display
│   │   └── shared/
│   │       ├── FilterBar.tsx         ← 'use client': date range + category (nuqs)
│   │       ├── DateRangePicker.tsx   ← 'use client': from/to date inputs
│   │       ├── CategorySelect.tsx    ← 'use client': dropdown filter
│   │       ├── TrendIndicator.tsx    ← server: up/down arrow + percentage
│   │       ├── EmptyState.tsx        ← server: empty chart placeholder
│   │       └── LiveIndicator.tsx     ← 'use client': green pulse dot
│   │
│   ├── lib/
│   │   ├── data/                     ← Fake data generation — SERVER ONLY
│   │   │   ├── generators.ts         ← All fake data generator functions
│   │   │   ├── seed.ts               ← Seeded random for deterministic SSR
│   │   │   └── constants.ts          ← Categories, sources, event types
│   │   └── utils.ts                  ← Shared formatting utilities
│   │
│   └── types/
│       └── index.ts                  ← Global TypeScript types
│
├── middleware.ts                     ← PROJECT ROOT — request logging + headers
├── .env
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── GEMINI.README-dashboard.md       ← This file
```

---

## 5. MCP TOOL INSTRUCTIONS

### Stitch MCP — UI Component Generation
Use Stitch MCP for every UI component. When generating components:
- Aesthetic: **data-dense dark analytics dashboard, industrial precision feel**
- Font pairing: **`Syne` for headings/labels, `IBM Plex Mono` for all numbers/metrics, `DM Sans` for body text**
- Color palette: deep navy (`#07080F`) backgrounds, electric cyan (`#00D4FF`) accent, emerald (`#10B981`) positive trend, rose (`#F43F5E`) negative trend, slate borders
- Recharts color palette: `['#00D4FF', '#7C3AED', '#10B981', '#F59E0B', '#F43F5E']`
- Always request TypeScript props interface with each component
- Always request Tailwind classes — no inline styles except for dynamic chart colors
- Always request responsive behavior (charts resize with container)

**Prompt pattern for Stitch:**
```
Generate a [ComponentName] React component using TypeScript and Tailwind CSS.
Aesthetic: industrial dark analytics dashboard, navy-950 background (#07080F),
electric cyan (#00D4FF) accent, IBM Plex Mono for all numeric values,
Syne for labels and headings, DM Sans for body. Data-dense layout.
Props: [describe props].
Must be: accessible, responsive (ResponsiveContainer from recharts where applicable),
handles loading state, handles empty/error state.
```

### Antigravity MCP — Terminal & Setup Operations
Use Antigravity MCP for:
- Running `npx create-next-app`
- Installing npm packages
- Running `npm run dev`, `npm run build`
- Running TypeScript checks (`npx tsc --noEmit`)

**Prompt pattern for Antigravity:**
```
Run: [exact command]
Working directory: project root (realtime-dashboard/)
Environment: development
```

---

## 6. CONSTRAINTS — Read First

These are hard rules. Breaking any of them produces incorrect architecture.

### Execution Environment Rules
```
Rule 1: Every file in app/ is a SERVER COMPONENT by default.
        Do NOT add 'use client' unless the component needs:
        - useState, useEffect, useRef, useCallback, or any React hook
        - onClick, onChange, onSubmit, or any event handler
        - Browser APIs (window, document, ResizeObserver)
        - Recharts components (they use browser DOM measurement)

Rule 2: Recharts components ALWAYS require 'use client'.
        LineChart, BarChart, AreaChart, PieChart — all browser-only.
        Wrap them in a component with 'use client', never in page.tsx.

Rule 3: 'use client' goes at the VERY TOP of the file — line 1.
        Before any imports. No exceptions.

Rule 4: error.tsx ALWAYS has 'use client' — no exceptions.
        React error boundaries require client-side lifecycle.

Rule 5: middleware.ts lives at the PROJECT ROOT.
        Not inside src/. Not inside app/. The project root, same level
        as package.json.

Rule 6: lib/data/generators.ts must import 'server-only' at the top.
        Fake data generation includes seeding logic that is server-only.
        This prevents generators from being bundled into the client.
```

### Data Fetching Rules
```
Rule 7: Initial chart data — fetch on SERVER in page.tsx using generators.ts.
        Pass serialized data as props to the chart client component.
        This gives users immediate chart render — no blank state on load.

Rule 8: Live polling — fetch in CLIENT component using setInterval + fetch().
        This is the ONE legitimate use case for useEffect + fetch in this app.
        Every polling fetch calls a route handler (/api/[metric]).

Rule 9: ALL route handlers must return { cache: 'no-store' } behavior.
        Use: return new Response(JSON.stringify(data), {
          headers: { 'Cache-Control': 'no-store' }
        });
        Polling clients need fresh data on every request — cached data defeats
        the entire purpose of live updates.

Rule 10: Filters are stored in URL search params via nuqs — NOT in useState.
         Reason: URL params are readable by page.tsx on the server.
         When filter changes, page.tsx re-runs on server with new params.
         The chart component ALSO reads params to build polling fetch URLs.

Rule 11: Multiple independent data fetches in one page.tsx? Use Promise.all().
         Overview page fetches KPI metrics, sparklines, and summary — in parallel.
         Sequential awaits are a waterfall bug even with fake data.

Rule 12: Cleanup polling intervals on component unmount.
         Every setInterval must return a clearInterval in the useEffect cleanup.
         Missing cleanup = memory leak + ghost intervals stacking up.
```

### Security & Performance Rules
```
Rule 13: NEVER import generators.ts in a 'use client' component.
         'server-only' import will cause a build error — intentionally.
         Client components get data via fetch('/api/...'), not generators.

Rule 14: Route handlers do NOT need auth for this app (fake public data).
         But they MUST validate query params before using them.
         Invalid date strings or unknown category values → 400 response.

Rule 15: Polling intervals must be appropriate per metric type:
         - Activity feed: 3 seconds (high frequency events)
         - Performance metrics: 3 seconds (server health)
         - Revenue / users: 10 seconds (business metrics, slower drift)
         - Overview KPIs: 15 seconds (summary, low priority)
         Do NOT set all intervals to the same value — staggers server load.

Rule 16: Charts must use ResponsiveContainer from recharts.
         Hard-coded width/height breaks layout on different screen sizes.
         ResponsiveContainer + width="100%" + height={300} is the pattern.
```

### TypeScript Rules
```
Rule 17: tsconfig.json must have "strict": true.
         No implicit any. No unchecked indexing.

Rule 18: Every data shape from generators.ts must have a matching TypeScript
         interface in the feature's types.ts file.
         Never use `any` for chart data — Recharts accepts typed data arrays.

Rule 19: Date objects from generators must be converted to ISO strings before
         passing as props to client components.
         Rule: if it's a Date in TypeScript → .toISOString() before the boundary.

Rule 20: nuqs parseAsIsoDate and parseAsString must be used for all filter params.
         Never manually parse URL strings with new Date(searchParams.from).
         nuqs handles validation and type coercion safely.
```

### Code Comment Rules
```
Rule 21: Every file must have a top-of-file comment block explaining:
         - What this file does
         - Where it runs (server / client / edge)
         - What it consumes (data source: generator / route handler / props)
         - What imports from it

Rule 22: Every chart component must have a comment explaining:
         - The polling interval (or 'no polling — static')
         - The API endpoint it polls
         - The filter params it reads from URL

Rule 23: Every route handler must have a comment explaining:
         - The query params it accepts
         - The response shape
         - Why cache: 'no-store' is required

Rule 24: Every useEffect with setInterval must have a comment explaining:
         - What it polls and why
         - The interval duration and reasoning
         - The cleanup behavior
```

---

## PHASE 0 — Environment Bootstrap

> **Goal:** Create the Next.js project with correct configuration from day one.
> **MCP:** Antigravity for all terminal commands.
> **Verify:** `npm run dev` starts without errors on http://localhost:3000

### Step 0.1 — Scaffold the project
```bash
# Use Antigravity MCP to run:
npx create-next-app@latest realtime-dashboard \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-turbopack
```

### Step 0.2 — Install dependencies
```bash
# Use Antigravity MCP to run:
cd realtime-dashboard

npm install \
  recharts \
  @faker-js/faker \
  date-fns \
  nuqs \
  framer-motion \
  server-only \
  lucide-react \
  clsx \
  tailwind-merge \
  zod

npm install --save-dev \
  @types/node
```

### Step 0.3 — Configure tsconfig.json
Replace the contents of `tsconfig.json` with:
```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Step 0.4 — Configure .env
```bash
# .env file:
NEXT_PUBLIC_APP_NAME="Analytics"
NEXT_PUBLIC_POLL_INTERVAL_ACTIVITY=3000
NEXT_PUBLIC_POLL_INTERVAL_PERFORMANCE=3000
NEXT_PUBLIC_POLL_INTERVAL_REVENUE=10000
NEXT_PUBLIC_POLL_INTERVAL_OVERVIEW=15000
NODE_ENV="development"
```

### Step 0.5 — Configure next.config.ts
```typescript
// next.config.ts
// ─────────────────────────────────────────────────────────────
// Next.js configuration
// Runs at: BUILD TIME and dev server start
// No special configuration needed — keeping clean for learning clarity
// ─────────────────────────────────────────────────────────────

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Ensure server-only is respected across all modules
  // No special flags needed — server-only package handles enforcement
};

export default nextConfig;
```

---

## PHASE 1 — Fake Data Generation Layer

> **Goal:** Build the server-only data generation layer. This is the substitute for a real DB.
> **Runs on:** SERVER ONLY — has `import 'server-only'` at top.
> **Verify:** Import a generator in a page.tsx, confirm it returns typed data.

### Step 1.1 — Global types
Create `src/types/index.ts`:
```typescript
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
```

### Step 1.2 — Seeded random for deterministic SSR
Create `src/lib/data/seed.ts`:
```typescript
// src/lib/data/seed.ts
// ─────────────────────────────────────────────────────────────
// Deterministic seeded random number generator
// Runs on: SERVER ONLY (imported by generators.ts which has server-only)
//
// Why seeded random?
//   SSR renders the page on the server. Hydration renders it again
//   in the browser. If random() produces different numbers each time,
//   you get a HYDRATION MISMATCH error.
//   A seeded generator produces the SAME sequence every time given
//   the same seed — server and client agree on the initial values.
//
// For live polling: route handlers use Date.now() as seed →
//   different on each poll call → metrics drift over time.
//   That's the intended behavior for "live" data.
// ─────────────────────────────────────────────────────────────

/**
 * mulberry32 — fast, deterministic 32-bit PRNG
 * Given the same seed, produces identical sequences every time.
 * Used for: SSR initial data (stable, no hydration mismatch)
 */
export function createSeededRandom(seed: number): () => number {
  let s = seed;
  return function () {
    s |= 0;
    s = s + 0x6d2b79f5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * STATIC_SEED — fixed seed for initial SSR renders
 * Every page load gets the same initial numbers → no hydration mismatch
 * Change this value to get a different "universe" of fake data
 */
export const STATIC_SEED = 42;

/**
 * getDailySeed — returns a seed that changes once per day
 * Used for: SSG/ISR pages where data should look consistent for a day
 */
export function getDailySeed(): number {
  const today = new Date();
  return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
}

/**
 * getLiveSeed — returns a seed based on current minute
 * Used for: polling route handlers — data drifts every minute
 */
export function getLiveSeed(): number {
  const now = new Date();
  return now.getFullYear() * 1000000 + now.getMonth() * 10000 + now.getDate() * 100 + now.getMinutes();
}
```

### Step 1.3 — Fake data generators
Create `src/lib/data/generators.ts`:
```typescript
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
```

### Step 1.4 — Constants
Create `src/lib/data/constants.ts`:
```typescript
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
```

### Step 1.5 — Shared utilities
Create `src/lib/utils.ts`:
```typescript
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
```

---

## PHASE 2 — Root Layout, Fonts & Global Styles

> **Goal:** Visual foundation. Dashboard-grade aesthetics — data-dense, dark, precise.
> **MCP:** Stitch for Tailwind config. Antigravity for Google Fonts setup.
> **Verify:** `npm run dev` renders the app with correct fonts and navy background.

### Step 2.1 — Configure Tailwind
Replace `tailwind.config.ts`:
```typescript
// tailwind.config.ts
// ─────────────────────────────────────────────────────────────
// Tailwind CSS configuration
// Aesthetic: industrial dark analytics dashboard
// Palette: navy backgrounds, electric cyan accent, semantic colors
// Fonts: Syne (headings), IBM Plex Mono (numbers), DM Sans (body)
// ─────────────────────────────────────────────────────────────

import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-syne)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-ibm-plex-mono)', 'Courier New', 'monospace'],
      },
      colors: {
        dash: {
          bg:       '#07080F',   // near-black navy base
          surface:  '#0D0F1C',   // card/panel surface
          elevated: '#131629',   // slightly raised surface
          border:   '#1E2235',   // subtle border
          muted:    '#252A40',   // muted/hover bg
          text:     '#E2E4F0',   // primary text
          subtle:   '#6B7280',   // secondary/muted text
          // Accent
          cyan:     '#00D4FF',   // electric cyan — primary accent
          'cyan-dim': '#0A4A5C', // dimmed cyan for backgrounds
          // Semantic
          success:  '#10B981',   // emerald — positive trend
          warning:  '#F59E0B',   // amber — caution
          danger:   '#F43F5E',   // rose — negative trend, errors
          purple:   '#7C3AED',   // secondary data series
        },
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'pulse-live': 'pulseLive 2s ease-in-out infinite',
        'count-up':   'countUp 0.8s ease-out',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        pulseLive: { '0%, 100%': { opacity: '1', transform: 'scale(1)' }, '50%': { opacity: '0.5', transform: 'scale(0.85)' } },
      },
    },
  },
  plugins: [],
};

export default config;
```

### Step 2.2 — Global CSS
Replace `src/app/globals.css`:
```css
/* src/app/globals.css
 * ─────────────────────────────────────────────────────────────
 * Global styles for Real-time Analytics Dashboard
 * Imported by: root layout.tsx → applied to every page
 * ─────────────────────────────────────────────────────────────
 */

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    @apply bg-dash-bg text-dash-text;
    color-scheme: dark;
  }

  /* Thin, styled scrollbar — matches dark dashboard feel */
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { @apply bg-dash-surface; }
  ::-webkit-scrollbar-thumb { @apply bg-dash-muted rounded-full; }
  ::-webkit-scrollbar-thumb:hover { @apply bg-dash-cyan; }

  /* Cyan selection */
  ::selection { @apply bg-dash-cyan text-dash-bg; }

  /* Focus ring — cyan on dark */
  :focus-visible {
    @apply outline-none ring-2 ring-dash-cyan ring-offset-2 ring-offset-dash-bg;
  }
}

@layer components {
  /* Metric number display — IBM Plex Mono, prominent */
  .metric-value {
    @apply font-mono text-dash-text tabular-nums;
  }

  /* Chart container base — always fills its parent */
  .chart-container {
    @apply w-full h-full min-h-0;
  }

  /* Status indicator dot */
  .status-healthy { @apply bg-dash-success; }
  .status-degraded { @apply bg-dash-warning; }
  .status-critical { @apply bg-dash-danger; }

  /* Grid pattern background — subtle data-centre feel */
  .grid-bg {
    background-image:
      linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px);
    background-size: 32px 32px;
  }
}
```

### Step 2.3 — Root Layout
Create `src/app/layout.tsx`:
```typescript
// src/app/layout.tsx
// ─────────────────────────────────────────────────────────────
// Root layout — wraps EVERY page in the application
// Runs on: SERVER (no 'use client')
//
// Loads fonts via next/font/google:
//   - Syne: display headings and section labels
//   - IBM Plex Mono: all numeric/metric values
//   - DM Sans: body text and UI labels
//
// CSS variables are injected into <html> for Tailwind var() usage
// ─────────────────────────────────────────────────────────────

import type { Metadata } from 'next';
import { Syne, IBM_Plex_Mono, DM_Sans } from 'next/font/google';
import './globals.css';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Analytics Dashboard',
    template: '%s | Analytics',
  },
  description: 'Real-time analytics dashboard — live metrics, charts, and performance monitoring.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`
          ${syne.variable}
          ${ibmPlexMono.variable}
          ${dmSans.variable}
          font-sans bg-dash-bg text-dash-text antialiased min-h-screen
        `}
      >
        {children}
      </body>
    </html>
  );
}
```

---

## PHASE 3 — Middleware & Rate Limiting

> **Goal:** Middleware that runs at the edge — logs requests, adds response headers.
> **Note:** No auth in this app (public fake data). Middleware demonstrates the Edge runtime
>           pattern and request inspection without a DB lookup.
> **Verify:** Check browser network tab — response headers include `X-Request-Id`.

Create `middleware.ts` at the **project root** (same level as package.json):
```typescript
// middleware.ts  ← PROJECT ROOT — not inside src/ or app/
// ─────────────────────────────────────────────────────────────
// Request middleware — runs on EDGE runtime
//
// What it does:
//   1. Generates a unique request ID for tracing
//   2. Logs the request method and pathname
//   3. Adds observability headers to every response
//   4. Simulates a rate-limit header (for learning purposes)
//
// Edge runtime constraints:
//   - No Node.js APIs (no fs, no crypto module)
//   - No Prisma, no DB access
//   - Uses Web Crypto API (crypto.randomUUID() is available on Edge)
//   - Runs BEFORE any route handler or page
//
// This middleware never blocks — it always calls NextResponse.next().
// It demonstrates the Edge middleware pattern without auth complexity.
// ─────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, method } = request.nextUrl;
  const start = Date.now();

  // Generate a unique trace ID for this request
  // crypto.randomUUID() is available in the Edge runtime (Web Crypto API)
  const requestId = crypto.randomUUID();

  // Log to edge worker stdout — visible in `npm run dev` terminal
  console.log(`[${new Date().toISOString()}] ${request.method} ${pathname} — id:${requestId.slice(0, 8)}`);

  // Continue to the actual handler
  const response = NextResponse.next();

  // Add observability headers — visible in browser DevTools → Network tab
  // These teach how middleware can enrich responses without touching route logic
  response.headers.set('X-Request-Id', requestId);
  response.headers.set('X-Response-Time', `${Date.now() - start}ms`);

  // Simulate a rate limit header — shows remaining capacity
  // In production this would read from Redis or a KV store
  const fakeRemaining = Math.floor(Math.random() * 50) + 50;
  response.headers.set('X-RateLimit-Limit', '100');
  response.headers.set('X-RateLimit-Remaining', String(fakeRemaining));

  return response;
}

// Matcher: run on all routes except Next.js internals and static files
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

---

## PHASE 4 — Route Handlers (API Layer)

> **Goal:** Build all route handlers. These are the endpoints that client components poll.
> **Rule:** Every handler returns `Cache-Control: no-store`. Stale polling data is wrong data.
> **Rule:** Validate all query params with Zod before using them in generators.

### Step 4.1 — Metrics route handler
Create `src/app/api/metrics/route.ts`:
```typescript
// src/app/api/metrics/route.ts
// ─────────────────────────────────────────────────────────────
// KPI metrics endpoint — GET /api/metrics
// Runs on: NODE.JS server runtime
//
// Consumed by: KpiCard components (polling every 15 seconds)
// Response shape: { metrics: KpiMetric[] }
// Cache policy: no-store — every poll must return fresh numbers
//
// Why no query params here?
//   KPI overview shows all-time/current metrics without filtering.
//   Filters apply at the individual metric pages (revenue, users).
//
// Polling interval: 15 seconds (slowest — summary data)
// ─────────────────────────────────────────────────────────────

import { generateKpiMetrics } from '@/lib/data/generators';
import { createSeededRandom, getLiveSeed } from '@/lib/data/seed';

export async function GET() {
  // getLiveSeed() changes every minute — metrics drift slowly over time
  // This simulates a real dashboard where numbers gradually change
  const random = createSeededRandom(getLiveSeed());
  const metrics = generateKpiMetrics(random);

  return Response.json(
    { metrics },
    {
      headers: {
        // no-store: polling clients MUST get fresh data every call
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
```

### Step 4.2 — Revenue route handler
Create `src/app/api/revenue/route.ts`:
```typescript
// src/app/api/revenue/route.ts
// ─────────────────────────────────────────────────────────────
// Revenue time-series endpoint — GET /api/revenue
// Runs on: NODE.JS server runtime
//
// Query params:
//   from     — ISO date string (default: 30 days ago)
//   to       — ISO date string (default: today)
//   category — 'all' | 'saas' | 'enterprise' | 'marketplace' | 'services'
//
// Consumed by: RevenueChart.tsx (polling every 10 seconds)
// Response shape: { data: RevenueDataPoint[], summary: { total, target, trend } }
// Cache policy: no-store
//
// Validation: Zod validates all params before generator call
//   Invalid params → 400 response, never passed to generator
// ─────────────────────────────────────────────────────────────

import { z } from 'zod';
import { generateRevenueData } from '@/lib/data/generators';
import { createSeededRandom, getLiveSeed } from '@/lib/data/seed';
import { REVENUE_CATEGORIES } from '@/lib/data/constants';
import { getDefaultDateRange } from '@/lib/utils';

// Validation schema for query params
const QuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  category: z.enum(['all', ...REVENUE_CATEGORIES]).optional().default('all'),
});

export async function GET(request: Request) {
  // Parse and validate query params
  const { searchParams } = new URL(request.url);
  const defaults = getDefaultDateRange();

  const parsed = QuerySchema.safeParse({
    from: searchParams.get('from') ?? defaults.from,
    to: searchParams.get('to') ?? defaults.to,
    category: searchParams.get('category') ?? 'all',
  });

  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid query parameters', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const { from, to, category } = parsed.data;
  const random = createSeededRandom(getLiveSeed());
  const data = generateRevenueData({ from, to, category }, random);

  // Compute summary stats from the generated data
  const total = data.reduce((sum, d) => sum + d.revenue, 0);
  const target = data.reduce((sum, d) => sum + d.target, 0);
  const trend = parseFloat(((total - target) / target * 100).toFixed(1));

  return Response.json(
    { data, summary: { total, target, trend } },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}
```

### Step 4.3 — Users route handler
Create `src/app/api/users/route.ts`:
```typescript
// src/app/api/users/route.ts
// ─────────────────────────────────────────────────────────────
// User acquisition endpoint — GET /api/users
// Runs on: NODE.JS server runtime
//
// Query params:
//   from   — ISO date string
//   to     — ISO date string
//   source — 'all' | 'organic' | 'paid' | 'referral' | 'direct'
//
// Consumed by: UserAcquisitionChart.tsx, SourceBreakdown.tsx
// Response shape: { data: UserDataPoint[], cohorts: UserCohort[] }
// Cache policy: no-store
// ─────────────────────────────────────────────────────────────

import { z } from 'zod';
import { generateUserData, generateCohortData } from '@/lib/data/generators';
import { createSeededRandom, getLiveSeed } from '@/lib/data/seed';
import { USER_SOURCES } from '@/lib/data/constants';
import { getDefaultDateRange } from '@/lib/utils';

const QuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  source: z.enum(['all', ...USER_SOURCES]).optional().default('all'),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const defaults = getDefaultDateRange();

  const parsed = QuerySchema.safeParse({
    from: searchParams.get('from') ?? defaults.from,
    to: searchParams.get('to') ?? defaults.to,
    source: searchParams.get('source') ?? 'all',
  });

  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid query parameters', details: parsed.error.errors },
      { status: 400 }
    );
  }

  const { from, to, source } = parsed.data;
  const random = createSeededRandom(getLiveSeed());

  // Parallel generation — cohorts don't depend on time range data
  const [data, cohorts] = await Promise.all([
    Promise.resolve(generateUserData(new Date(from), new Date(to), source, random)),
    Promise.resolve(generateCohortData(random)),
  ]);

  return Response.json(
    { data, cohorts },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}
```

### Step 4.4 — Performance route handler
Create `src/app/api/performance/route.ts`:
```typescript
// src/app/api/performance/route.ts
// ─────────────────────────────────────────────────────────────
// Server performance metrics — GET /api/performance
// Runs on: NODE.JS server runtime
//
// Query params: none — always returns latest rolling 20 data points
//
// Consumed by: ResponseTimeChart.tsx, ErrorRateChart.tsx, ThroughputGauge.tsx
// Polling interval: 3 seconds (fastest — health monitoring)
// Response shape: { data: PerfDataPoint[], status: PerfStatus }
// Cache policy: no-store — 3-second polling needs fresh data every time
// ─────────────────────────────────────────────────────────────

import { generatePerfData, generatePerfStatus } from '@/lib/data/generators';
import { createSeededRandom, getLiveSeed } from '@/lib/data/seed';

export async function GET() {
  // getLiveSeed() changes per minute — combined with random drift in generator
  // this produces realistic metric variation on every poll
  const random = createSeededRandom(getLiveSeed());
  const data = generatePerfData(20, random);
  const status = generatePerfStatus(random);

  return Response.json(
    { data, status },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}
```

### Step 4.5 — Activity route handler
Create `src/app/api/activity/route.ts`:
```typescript
// src/app/api/activity/route.ts
// ─────────────────────────────────────────────────────────────
// Live activity feed — GET /api/activity
// Runs on: NODE.JS server runtime
//
// Query params:
//   count — number of events to return (default: 20, max: 50)
//
// Consumed by: ActivityFeed.tsx (polling every 3 seconds)
// Response shape: { events: ActivityEvent[], generatedAt: string }
// Cache policy: no-store
//
// Note: generatedAt timestamp tells the client component when this
//   batch was generated — used to animate new events sliding in
// ─────────────────────────────────────────────────────────────

import { z } from 'zod';
import { generateActivityEvents } from '@/lib/data/generators';
import { createSeededRandom, getLiveSeed } from '@/lib/data/seed';

const QuerySchema = z.object({
  count: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const parsed = QuerySchema.safeParse({
    count: searchParams.get('count'),
  });

  if (!parsed.success) {
    return Response.json({ error: 'Invalid count parameter' }, { status: 400 });
  }

  const random = createSeededRandom(getLiveSeed());
  const events = generateActivityEvents(parsed.data.count, random);

  return Response.json(
    { events, generatedAt: new Date().toISOString() },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}
```

---

## PHASE 5 — Server Components & Initial SSR Data

> **Goal:** Build all page.tsx files. These are server components that generate the
>           initial data snapshot for each chart. Charts receive this data as props — no
>           loading flash on first render.
> **Key pattern:** page.tsx (server) → generateData() → serialized props → ChartComponent (client)

### Step 5.1 — Dashboard shell layout
Create `src/app/(dashboard)/layout.tsx`:
```typescript
// src/app/(dashboard)/layout.tsx
// ─────────────────────────────────────────────────────────────
// Dashboard shell — wraps all metric pages
// Runs on: SERVER
//
// Renders: Sidebar (client) + main content area
// The layout itself is a server component — only Sidebar is 'use client'
// Sidebar receives nav config as serialized props (no Date objects here)
// ─────────────────────────────────────────────────────────────

import Sidebar from '@/components/layout/Sidebar';
import LiveClock from '@/components/layout/LiveClock';

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
```

### Step 5.2 — Overview page (parallel SSR fetch)
Create `src/app/(dashboard)/overview/page.tsx`:
```typescript
// src/app/(dashboard)/overview/page.tsx
// ─────────────────────────────────────────────────────────────
// Overview page — GET /overview
// Runs on: SERVER (async server component)
// Rendering mode: SSR (dynamic — metrics drift over time)
//
// Data strategy: PARALLEL FETCH (Promise.all)
//   Generates KPI metrics, sparkline data, and summary charts simultaneously.
//   Each generator call takes ~0ms (pure computation), but the pattern
//   demonstrates the correct architecture for real DB calls.
//
// Data flow:
//   generateKpiMetrics() → KpiGrid (server) → KpiCard (client, animated counter)
//   generateRevenueData() → OverviewCharts (client, summary chart)
//
// Why dynamic and not static (SSG)?
//   KPIs drift over time via getLiveSeed() — caching them permanently
//   would show stale numbers. 'force-dynamic' ensures fresh SSR.
// ─────────────────────────────────────────────────────────────

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { generateKpiMetrics, generateRevenueData } from '@/lib/data/generators';
import { createSeededRandom, STATIC_SEED } from '@/lib/data/seed';
import { getDefaultDateRange } from '@/lib/utils';
import KpiGrid from './components/KpiGrid';
import OverviewCharts from './components/OverviewCharts';
import { Skeleton } from '@/components/ui/Skeleton';

export const metadata: Metadata = { title: 'Overview' };
// Force dynamic: KPIs change — never serve a cached HTML snapshot
export const dynamic = 'force-dynamic';

export default async function OverviewPage() {
  const defaults = getDefaultDateRange();

  // PARALLEL FETCH — all generators fire simultaneously
  // In a real app these would be DB queries; the pattern is identical
  const [metrics, revenueData] = await Promise.all([
    Promise.resolve(generateKpiMetrics(createSeededRandom(STATIC_SEED))),
    Promise.resolve(generateRevenueData(defaults, createSeededRandom(STATIC_SEED))),
  ]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl text-dash-text mb-1">Overview</h1>
        <p className="text-sm text-dash-subtle">Live metrics — updates every 15 seconds</p>
      </div>

      {/* KPI Cards grid — server component, passes data to animated client cards */}
      <Suspense fallback={<Skeleton className="h-36 w-full rounded-xl" />}>
        <KpiGrid initialMetrics={metrics} />
      </Suspense>

      {/* Summary charts — client component with polling */}
      <Suspense fallback={<Skeleton className="h-80 w-full rounded-xl" />}>
        <OverviewCharts initialRevenueData={revenueData} />
      </Suspense>
    </div>
  );
}
```

### Step 5.3 — Revenue page
Create `src/app/(dashboard)/revenue/page.tsx`:
```typescript
// src/app/(dashboard)/revenue/page.tsx
// ─────────────────────────────────────────────────────────────
// Revenue page — GET /revenue
// Runs on: SERVER (async server component)
// Rendering mode: SSR — re-runs on server when URL filter params change
//
// Filter state lives in URL params (managed by FilterBar via nuqs).
// When user changes date range: URL updates → Next.js re-runs this page
// on the server with new searchParams → generates filtered data →
// new HTML with filtered chart data → RevenueChart hydrates with it.
//
// searchParams prop:
//   from     — ISO date string from URL
//   to       — ISO date string from URL
//   category — category filter from URL
// ─────────────────────────────────────────────────────────────

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { generateRevenueData } from '@/lib/data/generators';
import { createSeededRandom, STATIC_SEED } from '@/lib/data/seed';
import { getDefaultDateRange } from '@/lib/utils';
import { REVENUE_CATEGORIES } from '@/lib/data/constants';
import RevenueChart from './components/RevenueChart';
import RevenueSummary from './components/RevenueSummary';
import FilterBar from '@/components/shared/FilterBar';
import { Skeleton } from '@/components/ui/Skeleton';

export const metadata: Metadata = { title: 'Revenue' };
export const dynamic = 'force-dynamic';

export default async function RevenuePage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string; category?: string };
}) {
  const defaults = getDefaultDateRange();

  // Read filter values from URL — these come from FilterBar (nuqs)
  // Validate: unknown category falls back to 'all'
  const from = searchParams.from ?? defaults.from;
  const to = searchParams.to ?? defaults.to;
  const category = REVENUE_CATEGORIES.includes(searchParams.category as never)
    ? (searchParams.category ?? 'all')
    : 'all';

  // Generate initial SSR data with current filter values
  const initialData = generateRevenueData(
    { from, to, category },
    createSeededRandom(STATIC_SEED)
  );

  // Compute summary for RevenueSummary component (server-rendered)
  const total = initialData.reduce((sum, d) => sum + d.revenue, 0);
  const targetTotal = initialData.reduce((sum, d) => sum + d.target, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl text-dash-text mb-1">Revenue</h1>
          <p className="text-sm text-dash-subtle">Polls every 10 seconds</p>
        </div>
        {/* FilterBar: 'use client' — manages URL params via nuqs */}
        <FilterBar
          categoryOptions={[
            { value: 'all', label: 'All Categories' },
            { value: 'saas', label: 'SaaS' },
            { value: 'enterprise', label: 'Enterprise' },
            { value: 'marketplace', label: 'Marketplace' },
            { value: 'services', label: 'Services' },
          ]}
          showDateRange
          showCategory
        />
      </div>

      {/* Summary stats — server rendered, static for this SSR pass */}
      <RevenueSummary total={total} target={targetTotal} from={from} to={to} />

      {/* Chart — client component, receives SSR data + polls for updates */}
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        <RevenueChart
          initialData={initialData}
          filter={{ from, to, category }}
          pollInterval={10000}
        />
      </Suspense>
    </div>
  );
}
```

### Step 5.4 — Reports page (SSG — the only static page)
Create `src/app/(dashboard)/reports/page.tsx`:
```typescript
// src/app/(dashboard)/reports/page.tsx
// ─────────────────────────────────────────────────────────────
// Reports page — GET /reports
// Runs on: SERVER
// Rendering mode: SSG (static generation at build time)
//
// Why SSG here?
//   Reports are historical summaries — they don't change per request.
//   The same monthly report data is valid for any user at any time.
//   Pre-generating at build time → zero server cost per visit.
//
// This is the ONE page in this app that is NOT 'force-dynamic'.
// No polling. No client components. Pure server-rendered static HTML.
// Demonstrates the contrast between SSG and SSR in the same codebase.
// ─────────────────────────────────────────────────────────────

import type { Metadata } from 'next';
import { generateReportRows } from '@/lib/data/generators';
import { createSeededRandom, STATIC_SEED } from '@/lib/data/seed';
import ReportSummary from './components/ReportSummary';
import ReportTable from './components/ReportTable';

export const metadata: Metadata = { title: 'Reports' };
// SSG: no 'force-dynamic' export — Next.js pre-renders at build time
// revalidate: 86400 → rebuild this page once per day at most
export const revalidate = 86400;

export default function ReportsPage() {
  // NOT async — no await needed. Generators are pure synchronous functions.
  // At build time this runs once and the output is saved as HTML.
  const rows = generateReportRows(createSeededRandom(STATIC_SEED));

  const totals = {
    revenue: rows.reduce((s, r) => s + r.revenue, 0),
    users: rows.reduce((s, r) => s + r.users, 0),
    avgConversion: rows.reduce((s, r) => s + r.conversionRate, 0) / rows.length,
    avgResponseTime: rows.reduce((s, r) => s + r.avgResponseTime, 0) / rows.length,
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl text-dash-text mb-1">Reports</h1>
        <p className="text-sm text-dash-subtle">
          Static snapshot — generated at build time (SSG)
        </p>
      </div>

      <ReportSummary totals={totals} />
      <ReportTable rows={rows} />
    </div>
  );
}
```

---

## PHASE 6 — Client Components (Charts & Live Updates)

> **Goal:** Build all 'use client' chart and polling components.
> **MCP:** Use Stitch MCP for every component. Be explicit about Recharts + dark aesthetic.
> **Rule:** Every polling component has cleanup on unmount. Every chart uses ResponsiveContainer.

### Step 6.1 — Revenue Chart (Stitch MCP)
Prompt Stitch MCP:
```
Generate a RevenueChart React component (TypeScript, Tailwind CSS, 'use client').
This is the main chart for the /revenue page.

Props interface:
  initialData: RevenueDataPoint[]   (from server SSR — renders immediately)
  filter: { from: string; to: string; category: string }
  pollInterval: number              (milliseconds, e.g. 10000)

Where RevenueDataPoint = { date: string; revenue: number; target: number; category: string }

Behaviour:
  - Renders a Recharts ComposedChart: Line for revenue, ReferenceLine for target
  - On mount: starts setInterval(pollInterval) that fetches /api/revenue
  - Fetch URL builds from filter prop: /api/revenue?from=...&to=...&category=...
  - On new data: smooth state update (no flash — merge not replace)
  - On unmount: clearInterval (REQUIRED — prevents memory leak)
  - Shows last-updated timestamp in top-right corner
  - Loading indicator: subtle pulse on the "live" badge while fetching

Recharts components to use:
  ResponsiveContainer (width="100%" height={380})
  ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend
  Line (dataKey="revenue", stroke="#00D4FF")
  Area (dataKey="target", stroke="#334155", fill="#1E2235", strokeDasharray="4 4")

Comment requirements:
  - Top of file: explain what this polls and why CSR is correct here
  - Above useEffect: explain polling interval and cleanup
  - Above fetch call: explain why filter params are baked into URL

Aesthetic: dark dashboard, cyan revenue line, muted target area, IBM Plex Mono axis labels.
Save as: src/app/(dashboard)/revenue/components/RevenueChart.tsx
```

### Step 6.2 — Activity Feed (Stitch MCP)
Prompt Stitch MCP:
```
Generate an ActivityFeed React component (TypeScript, Tailwind CSS, 'use client').
This is the live event feed for the /activity page.

Props interface:
  initialEvents: ActivityEvent[]   (SSR snapshot — 20 events)
  pollInterval?: number            (default: 3000ms)

Where ActivityEvent = {
  id: string; timestamp: string; type: string; user: string;
  detail: string; severity: 'info' | 'success' | 'warning' | 'error'; amount?: number
}

Behaviour:
  - Renders a scrollable list of activity events
  - Polls /api/activity every 3 seconds
  - On new data: prepend new events to top with slide-in animation
  - De-duplicate by event id (prevent flash of duplicate items)
  - Keep max 50 events in state (trim oldest to prevent memory growth)
  - Shows "LIVE" badge with green pulse animation in the header
  - Shows event count in header

Event row display:
  - Severity icon (coloured): ● success=emerald, ● warning=amber, ● error=rose, ● info=cyan
  - User name (truncated)
  - Detail text
  - Relative timestamp ("2 minutes ago") — updates on each poll

Comment requirements:
  - Above useEffect: explain 3s interval + cleanup + de-duplication strategy
  - Above trim: explain max 50 events memory management

Aesthetic: dark, compact rows, coloured severity dots, monospace timestamps.
Save as: src/app/(dashboard)/activity/components/ActivityFeed.tsx
```

### Step 6.3 — Performance Charts (Stitch MCP)
Prompt Stitch MCP:
```
Generate a ResponseTimeChart React component (TypeScript, Tailwind CSS, 'use client').
This is a real-time server performance chart that polls every 3 seconds.

Props interface:
  initialData: PerfDataPoint[]
  pollInterval?: number  (default: 3000)

Where PerfDataPoint = {
  timestamp: string; responseTimeP50: number; responseTimeP95: number;
  responseTimeP99: number; errorRate: number; throughput: number
}

Behaviour:
  - Recharts LineChart with 3 lines: P50 (cyan), P95 (amber), P99 (rose)
  - Polls /api/performance every 3 seconds
  - Sliding window: keep last 20 data points (shift oldest off)
  - SLA threshold line at 200ms (red dashed ReferenceLine)
  - Tooltip shows all three percentile values

Comment:
  - Above setInterval: explain sliding window + why 3s for perf monitoring

Aesthetic: dark, danger-coded lines (faster=safer=cyan, slower=danger=rose).
Save as: src/app/(dashboard)/performance/components/ResponseTimeChart.tsx
```

Prompt Stitch MCP again for the gauge:
```
Generate a ThroughputGauge React component (TypeScript, Tailwind CSS, 'use client').
Shows current requests/second as a Recharts RadialBarChart gauge.

Props interface:
  initialThroughput: number
  pollInterval?: number  (default: 3000)

Behaviour:
  - RadialBarChart showing current throughput (0 to 2000 rps)
  - Polls /api/performance, extracts throughput from latest data point
  - Color: green below 1500, amber 1000-1500, rose below 500
  - Center text: current RPS value in large IBM Plex Mono font

Save as: src/app/(dashboard)/performance/components/ThroughputGauge.tsx
```

### Step 6.4 — KPI Card with animated counter (Stitch MCP)
Prompt Stitch MCP:
```
Generate a KpiCard React component (TypeScript, Tailwind CSS, 'use client').
This is an individual metric card with an animated counter on initial load.

Props interface:
  metric: {
    id: string; label: string; value: number; unit: 'currency'|'number'|'percent'|'ms';
    trend: number; trendDirection: 'up'|'down'|'flat'; sparkline: number[]
  }
  onUpdate?: (newValue: number) => void

Behaviour:
  - On mount: animates numeric value from 0 to final value using framer-motion
  - Shows trend arrow: ↑ emerald for up, ↓ rose for down, → slate for flat
  - MiniSparkline inline below the value (tiny 60px Recharts Sparklines)
  - Unit formatting: currency → $48,750, percent → 99.7%, ms → 120ms, number → 12.8K

Comment:
  - Above animation: explain why CSR is needed (framer-motion is browser-only)

Aesthetic: dark card, cyan value, trend badge, monospace number, subtle top accent line.
Save as: src/app/(dashboard)/overview/components/KpiCard.tsx
```

### Step 6.5 — Filter Bar (Stitch MCP)
Prompt Stitch MCP:
```
Generate a FilterBar React component (TypeScript, Tailwind CSS, 'use client').
This manages date range and category filters — state lives in the URL (nuqs).

Props interface:
  categoryOptions: Array<{ value: string; label: string }>
  showDateRange?: boolean   (default: true)
  showCategory?: boolean    (default: true)

Behaviour:
  - Uses nuqs useQueryState for all filter values
  - from/to: parseAsIsoDate — validated date picker inputs
  - category: parseAsString — dropdown select
  - Changing any filter updates URL immediately (shallow navigation)
  - "Reset" button clears all params back to defaults
  - Debounce date inputs by 500ms (avoid URL spam while typing)

Comment:
  - Top of file: explain why URL state instead of useState
    ('URL state is readable by page.tsx on server — enables SSR filtering')
  - Above useQueryState: explain how nuqs syncs to URL

Aesthetic: compact inline toolbar, dark inputs with cyan focus ring, small text.
Save as: src/components/shared/FilterBar.tsx
```

---

## PHASE 7 — Filter System (URL State)

> **Goal:** Understand and verify the full filter round-trip.
>           This is the most architecturally interesting flow in the app.

### Step 7.1 — The full filter flow (verify this works end-to-end)

After building FilterBar and the revenue page.tsx, verify this exact flow:

```
1. User visits /revenue
   → page.tsx runs on server with no searchParams
   → defaults applied (last 30 days, all categories)
   → SSR data generated → HTML sent to browser

2. User selects "Enterprise" in CategorySelect
   → FilterBar calls nuqs setCategory('enterprise')
   → URL changes to /revenue?category=enterprise
   → Next.js router detects URL change

3. Next.js re-runs page.tsx on server with searchParams.category = 'enterprise'
   → generateRevenueData({ category: 'enterprise' }) called
   → enterprise-filtered HTML sent to browser
   → RevenueChart receives new initialData prop

4. RevenueChart sees filter prop changed (useEffect dependency)
   → Resets polling interval with new URL: /api/revenue?category=enterprise
   → Live polling continues with enterprise filter applied
```

Verify this by:
- Opening the browser network tab
- Changing the category filter
- Confirming a new page request fires (not just a client-side fetch)
- Confirming subsequent API polls include the correct category param

### Step 7.2 — nuqs Provider setup
Add to `src/app/layout.tsx` after installing nuqs:
```typescript
// src/app/layout.tsx — add NuqsAdapter wrapper
// nuqs requires a provider to sync URL state — wrap the body content

import { NuqsAdapter } from 'nuqs/adapters/next/app';

// Inside the <body>:
<NuqsAdapter>
  {children}
</NuqsAdapter>
```

---

## PHASE 8 — Page Routes (Full App)

> **Goal:** Complete all remaining page.tsx files following the same SSR pattern.
> **Every page:** async server component, generateData() call, serialized props to chart.

### Step 8.1 — Users page
Create `src/app/(dashboard)/users/page.tsx` following the same pattern as revenue/page.tsx:
- Reads `searchParams.from`, `searchParams.to`, `searchParams.source`
- Calls `generateUserData()` and `generateCohortData()` in `Promise.all()`
- Passes initial data to `UserAcquisitionChart` (client) and `CohortTable` (server)
- Includes `FilterBar` with source options instead of category options
- `export const dynamic = 'force-dynamic'`

### Step 8.2 — Performance page
Create `src/app/(dashboard)/performance/page.tsx`:
- No filter params — performance always shows rolling window
- Calls `generatePerfData()` and `generatePerfStatus()` in `Promise.all()`
- Passes initial data to `ResponseTimeChart`, `ErrorRateChart`, `ThroughputGauge`
- Passes status to `PerfStatusBar` (server component — renders health badges)
- `export const dynamic = 'force-dynamic'`

### Step 8.3 — Activity page
Create `src/app/(dashboard)/activity/page.tsx`:
- Calls `generateActivityEvents(20)` for initial SSR snapshot
- Passes to `ActivityFeed` (client — takes over polling)
- `export const dynamic = 'force-dynamic'`

### Step 8.4 — Root redirect
Create `src/app/page.tsx`:
```typescript
// src/app/page.tsx
// Runs on: SERVER
// Purpose: redirect root to /overview
import { redirect } from 'next/navigation';
export default function RootPage() {
  redirect('/overview');
}
```

---

## PHASE 9 — UI Polish with Stitch MCP

### Step 9.1 — Sidebar (Stitch MCP)
Prompt Stitch MCP:
```
Generate a Sidebar React component (TypeScript, Tailwind CSS, 'use client').
Aesthetic: deep navy (dash-bg), electric cyan accents, Syne display font.

Props interface:
  navItems: ReadonlyArray<{ href: string; label: string; icon: string }>

Features:
  - Collapsible (icon-only mode) with toggle button
  - Brand mark at top: geometric icon + "Analytics" in Syne font
  - Active state: cyan left border + cyan text + cyan icon glow
  - Hover state: elevated background
  - Icon rendering: use lucide-react, map string icon names to components
  - Bottom section: version indicator "v1.0 — LIVE" with green pulse dot

Uses: usePathname from next/navigation for active detection.
Save as: src/components/layout/Sidebar.tsx
```

### Step 9.2 — LiveClock (Stitch MCP)
Prompt Stitch MCP:
```
Generate a LiveClock React component (TypeScript, Tailwind CSS, 'use client').
Shows current time, ticking every second.

No props.

Behaviour:
  - useState for current time
  - useEffect: sets interval every 1000ms to update state
  - Cleanup: clearInterval on unmount
  - Format: "14:32:07 UTC" in IBM Plex Mono font

Comment:
  - Explain why this MUST be 'use client': time differs server vs browser
    (if server-rendered, clock would be frozen at SSR time → hydration mismatch)

Aesthetic: monospace, subtle cyan, small text.
Save as: src/components/layout/LiveClock.tsx
```

### Step 9.3 — LiveIndicator (Stitch MCP)
Prompt Stitch MCP:
```
Generate a LiveIndicator React component (TypeScript, Tailwind CSS, 'use client').
Shows a "LIVE" badge with pulsing green dot.

Props interface:
  label?: string        (default: "LIVE")
  isActive?: boolean    (default: true — controls pulse animation)

Aesthetic: emerald pulse dot, uppercase monospace label, dark badge.
Save as: src/components/shared/LiveIndicator.tsx
```

### Step 9.4 — TrendIndicator (server component)
Create `src/components/shared/TrendIndicator.tsx`:
```typescript
// src/components/shared/TrendIndicator.tsx
// ─────────────────────────────────────────────────────────────
// Trend indicator — server component (no 'use client')
// Renders an up/down arrow with percentage change
// Can run on server because it has no interactivity — pure display
// ─────────────────────────────────────────────────────────────

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendIndicatorProps {
  value: number;           // percentage change
  direction: 'up' | 'down' | 'flat';
  className?: string;
}

export default function TrendIndicator({ value, direction, className }: TrendIndicatorProps) {
  const isPositive = direction === 'up';
  const isFlat = direction === 'flat';

  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-xs font-mono',
      isPositive && 'text-dash-success',
      !isPositive && !isFlat && 'text-dash-danger',
      isFlat && 'text-dash-subtle',
      className
    )}>
      {isFlat ? <Minus size={12} /> : isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}
```

### Step 9.5 — Loading skeletons (Stitch MCP)
Prompt Stitch MCP for each loading.tsx:
```
Generate a Skeleton component base (TypeScript, Tailwind CSS).
Renders a pulsing dark rectangle placeholder.
Props: className?: string
Animation: CSS pulse (bg-dash-muted animate-pulse)
Save as: src/components/ui/Skeleton.tsx

Also generate these preset exports:
  - KpiGridSkeleton: 4-column grid of KPI card skeletons
  - ChartSkeleton: full-width chart area skeleton (h-96)
  - TableSkeleton: rows of skeleton lines
  - ActivityFeedSkeleton: list of activity row skeletons
```

Create a `loading.tsx` for each route using these presets:
- `src/app/(dashboard)/overview/loading.tsx` → `<KpiGridSkeleton />` + `<ChartSkeleton />`
- `src/app/(dashboard)/revenue/loading.tsx` → `<ChartSkeleton />`
- `src/app/(dashboard)/users/loading.tsx` → `<ChartSkeleton />`
- `src/app/(dashboard)/performance/loading.tsx` → grid of `<ChartSkeleton />` × 3
- `src/app/(dashboard)/activity/loading.tsx` → `<ActivityFeedSkeleton />`
- `src/app/(dashboard)/reports/loading.tsx` → `<TableSkeleton />`

**Each loading.tsx rule:**
- NO `'use client'` directive — server component
- Import skeleton presets from `@/components/ui/Skeleton`
- Match exact page layout proportions

---

## PHASE 10 — Error, Loading & Not-Found States

### Step 10.1 — Error boundaries for each route
Create `error.tsx` for every route. Use this template:

```typescript
// src/app/(dashboard)/[route]/error.tsx
// ─────────────────────────────────────────────────────────────
// Error boundary for /[route]
// Runs on: CLIENT ('use client' — mandatory for error boundaries)
//
// Catches: errors thrown during rendering or from polling failures
// Shows: error message + retry button + link to overview
//
// NOTE: This catches rendering errors but NOT fetch errors in
//   useEffect. Polling errors should be handled inside the
//   chart component with local error state (setError).
// ─────────────────────────────────────────────────────────────

'use client';

import Link from 'next/link';

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">⚠</div>
        <h2 className="font-display text-xl text-dash-text mb-2">
          Failed to load
        </h2>
        <p className="text-sm text-dash-subtle mb-6">
          {error.message ?? 'An error occurred while loading this section.'}
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg bg-dash-cyan text-dash-bg text-sm font-medium hover:bg-cyan-300 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/overview"
            className="px-4 py-2 rounded-lg border border-dash-border text-dash-subtle text-sm hover:text-dash-text transition-colors"
          >
            Overview
          </Link>
        </div>
        {error.digest && (
          <p className="mt-4 text-xs text-dash-subtle font-mono">
            {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
```

Create this file for: overview, revenue, users, performance, activity, reports.

### Step 10.2 — Global 404
Create `src/app/not-found.tsx`:
```typescript
// src/app/not-found.tsx — SERVER component, no 'use client'
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-dash-bg grid-bg flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="font-mono text-8xl text-dash-subtle mb-4">404</div>
        <h1 className="font-display text-3xl text-dash-text mb-3">
          Route not found
        </h1>
        <p className="text-dash-subtle mb-8 text-sm">
          This metric doesn't exist in the dashboard.
        </p>
        <Link
          href="/overview"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-dash-cyan text-dash-bg font-medium text-sm hover:bg-cyan-300 transition-colors"
        >
          Back to Overview
        </Link>
      </div>
    </div>
  );
}
```

### Step 10.3 — Global error boundary
Create `src/app/global-error.tsx`:
```typescript
// src/app/global-error.tsx
// ─────────────────────────────────────────────────────────────
// Root-level error boundary
// Runs on: CLIENT ('use client' mandatory)
// Must include <html> and <body> — replaces entire page on root error
// ─────────────────────────────────────────────────────────────

'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-dash-bg text-dash-text min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="font-mono text-6xl text-dash-danger mb-4">ERR</div>
          <h1 className="font-display text-3xl mb-3">Critical error</h1>
          <p className="text-dash-subtle mb-2 text-sm">
            {error.message ?? 'An unexpected error has occurred.'}
          </p>
          {error.digest && (
            <p className="text-xs text-dash-subtle mb-8 font-mono">
              Digest: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-lg bg-dash-cyan text-dash-bg font-medium hover:bg-cyan-300 transition-colors"
          >
            Reload dashboard
          </button>
        </div>
      </body>
    </html>
  );
}
```

---

## PHASE 11 — Final Verification Checklist

> Run every item in this checklist before declaring the project complete.
> Use Antigravity MCP for all build commands.

### Build verification
```bash
# Use Antigravity MCP:
npm run build
npx tsc --noEmit
# Expected: zero TypeScript errors, zero build failures
```

### Runtime verification checklist

| # | Test | Expected result |
|---|---|---|
| 1 | Visit `/` | Redirects to `/overview` |
| 2 | Overview loads | 4 KPI cards render with data immediately (SSR) |
| 3 | Overview — wait 15 seconds | KPI values update (polling visible in network tab) |
| 4 | View Source on `/overview` | Real numbers in HTML — not empty divs or 0s |
| 5 | Network tab: `/overview` load | ONE document request — data baked in HTML |
| 6 | Network tab after 15s | Repeated calls to `/api/metrics` every 15s |
| 7 | `/revenue` loads | Chart renders immediately with 30-day data |
| 8 | Change category filter to "Enterprise" | URL changes to `?category=enterprise`, chart updates |
| 9 | Change date range | URL updates, page re-SSRs with filtered data |
| 10 | Network tab: revenue polling | Calls `/api/revenue?from=...&to=...&category=...` with correct params |
| 11 | `/performance` loads | 3 charts render immediately |
| 12 | Performance — wait 3 seconds | Charts update (3s polling visible in network tab) |
| 13 | `/activity` loads | 20 events visible immediately (SSR) |
| 14 | Activity — wait 3 seconds | New events prepend with animation |
| 15 | `/reports` — View Source | Static HTML — data baked at build time (SSG) |
| 16 | `/reports` — network tab | Single request, no polling intervals |
| 17 | Resize browser window | All charts resize smoothly (ResponsiveContainer) |
| 18 | Open DevTools → Network | Response headers include `X-Request-Id` (middleware) |
| 19 | Close tab and reopen `/revenue?category=enterprise` | Filter state restored from URL — SSR with filter applied |
| 20 | JS bundle inspection | No generators.ts code in bundle (server-only enforced) |

### Code review checklist (AI bugs to verify)

```
□ Every page.tsx: no 'use client' — server component
□ Every chart component: has 'use client' at line 1
□ Every error.tsx: has 'use client' at top — no exceptions
□ Every useEffect with setInterval: has clearInterval return in cleanup
□ lib/data/generators.ts: has 'import server-only' at top
□ All route handlers: return Cache-Control: no-store header
□ All route handlers: validate query params with Zod before generator call
□ Overview page: uses Promise.all() — not sequential awaits
□ All chart components: use ResponsiveContainer — no hard-coded width/height
□ FilterBar: uses nuqs useQueryState — NOT useState for filter values
□ RevenueChart: polling URL includes filter params from props
□ ActivityFeed: de-duplicates events by id — no duplicate rendering
□ ActivityFeed: trims state to max 50 events — no unbounded memory growth
□ Reports page: no 'force-dynamic' export — is correctly SSG
□ middleware.ts: at PROJECT ROOT — not inside src/ or app/
□ LiveClock: has useEffect cleanup (clearInterval) — prevents ghost ticks
□ Date objects: converted to .toISOString() before passing as props
□ nuqs NuqsAdapter: wrapping children in root layout.tsx
□ No generators imported in any 'use client' file
□ No process.env.NEXT_PUBLIC_ secrets (there are none — no sensitive data)
```

---

## APPENDIX — Environment Quick Reference

```bash
# Development
npm run dev        # Start dev server on :3000

# Build & Check
npm run build      # Production build
npm run start      # Start production server
npm run lint       # ESLint check
npx tsc --noEmit   # TypeScript check without building

# Useful dev commands
npm run dev -- --turbo   # Faster HMR (optional)
```

---

## APPENDIX — Polling Architecture Summary

| Component | Endpoint | Interval | Why this interval |
|---|---|---|---|
| KpiCard (overview) | `/api/metrics` | 15s | Summary KPIs — low urgency |
| RevenueChart | `/api/revenue` | 10s | Business metrics — medium drift |
| UserAcquisitionChart | `/api/users` | 10s | Business metrics — medium drift |
| ResponseTimeChart | `/api/performance` | 3s | Health monitoring — high urgency |
| ErrorRateChart | `/api/performance` | 3s | Health monitoring — high urgency |
| ThroughputGauge | `/api/performance` | 3s | Health monitoring — high urgency |
| ActivityFeed | `/api/activity` | 3s | Live events — high frequency |
| ReportTable | none | none | SSG — no polling |
| LiveClock | none | 1s | Browser Date.now() — no network |

---

## APPENDIX — Next.js Concept Map (for comment reference)

| Concept | Where it appears | Comment marker |
|---|---|---|
| SSR | All page.tsx except reports | `// Rendering mode: SSR — force-dynamic` |
| SSG | reports/page.tsx | `// Rendering mode: SSG — revalidate: 86400` |
| CSR (legitimate) | All chart components | `// Client fetch: polling every Ns` |
| Server component | All page.tsx, layout.tsx, static components | `// Runs on: SERVER` |
| Client component | All charts, feed, filter, clock | `// Runs on: CLIENT ('use client')` |
| Route handler | All api/*.route.ts | `// Route handler: polled by [Component]` |
| Middleware | middleware.ts | `// Runs at: Edge runtime — request logging` |
| Parallel fetch | overview/page.tsx | `// PARALLEL FETCH — Promise.all` |
| Suspense | Every page section | `// Stream: suspense boundary` |
| URL state | FilterBar via nuqs | `// URL state: readable by server page.tsx` |
| Serialization | Every page.tsx → chart component | `// Serialize: Date → ISO string` |
| Cache no-store | All route handlers | `// cache: no-store — polling needs fresh data` |
| Memory cleanup | Every setInterval | `// Cleanup: clearInterval on unmount` |
| Sliding window | Perf charts | `// Sliding window: last 20 points` |
| De-duplication | ActivityFeed | `// De-dup: filter by event id` |
| Colocation | Feature component folders | `// Colocated: types, components per feature` |

---

*End of GEMINI.README*
*Version: 1.0 | Stack: Next.js 14 · TypeScript · Recharts · Tailwind · nuqs · Stitch MCP · Antigravity MCP*
