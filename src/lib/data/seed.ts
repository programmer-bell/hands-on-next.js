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
