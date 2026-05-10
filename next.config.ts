// next.config.ts
// ─────────────────────────────────────────────────────────────
// Next.js configuration
// Runs at: BUILD TIME and dev server start
// No special configuration needed — keeping clean for learning clarity
// ─────────────────────────────────────────────────────────────

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Produce a standalone build for Docker deployments.
  // This copies only the necessary files (including select node_modules)
  // into .next/standalone/ so the production image doesn't need the full
  // node_modules directory. See: https://nextjs.org/docs/app/api-reference/config/next-config-js/output
  output: 'standalone',
};

export default nextConfig;
