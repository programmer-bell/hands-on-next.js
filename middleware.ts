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
  const { pathname } = request.nextUrl;
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
