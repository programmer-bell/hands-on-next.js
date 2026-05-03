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
