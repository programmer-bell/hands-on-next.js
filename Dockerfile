# ─────────────────────────────────────────────────────────────
# Dockerfile — realtime-dashboard (Next.js 16)
# Multi-stage production build with standalone output
# Final image ≈ 120-180 MB (vs ~1 GB naive approach)
# ─────────────────────────────────────────────────────────────

# ═══════════════════════════════════════════════════════════════
# Stage 1: BASE — shared Alpine base with system deps
# ═══════════════════════════════════════════════════════════════
FROM node:22-alpine AS base

# libc6-compat is needed for some native Node.js modules on Alpine
# https://github.com/nodejs/docker-node#nodealpine
RUN apk add --no-cache libc6-compat

WORKDIR /app

# ═══════════════════════════════════════════════════════════════
# Stage 2: DEPS — install production + dev dependencies
# ═══════════════════════════════════════════════════════════════
FROM base AS deps

# Copy only package manifests first (Docker layer caching).
# If these files haven't changed, Docker reuses the cached
# node_modules layer — saving minutes on rebuilds.
COPY package.json package-lock.json ./

# Clean install for reproducible builds (respects lockfile exactly)
RUN npm ci

# ═══════════════════════════════════════════════════════════════
# Stage 3: BUILDER — compile the Next.js application
# ═══════════════════════════════════════════════════════════════
FROM base AS builder

WORKDIR /app

# Bring in node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the full source tree
COPY . .

# NEXT_PUBLIC_* vars are inlined at build time by Next.js.
# Provide sensible defaults that can be overridden via
# `docker build --build-arg NEXT_PUBLIC_APP_NAME=MyApp`
ARG NEXT_PUBLIC_APP_NAME="Analytics"
ARG NEXT_PUBLIC_POLL_INTERVAL_ACTIVITY=3000
ARG NEXT_PUBLIC_POLL_INTERVAL_PERFORMANCE=3000
ARG NEXT_PUBLIC_POLL_INTERVAL_REVENUE=10000
ARG NEXT_PUBLIC_POLL_INTERVAL_OVERVIEW=15000

ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_POLL_INTERVAL_ACTIVITY=$NEXT_PUBLIC_POLL_INTERVAL_ACTIVITY
ENV NEXT_PUBLIC_POLL_INTERVAL_PERFORMANCE=$NEXT_PUBLIC_POLL_INTERVAL_PERFORMANCE
ENV NEXT_PUBLIC_POLL_INTERVAL_REVENUE=$NEXT_PUBLIC_POLL_INTERVAL_REVENUE
ENV NEXT_PUBLIC_POLL_INTERVAL_OVERVIEW=$NEXT_PUBLIC_POLL_INTERVAL_OVERVIEW

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application — produces .next/standalone/
RUN npm run build

# ═══════════════════════════════════════════════════════════════
# Stage 4: RUNNER — minimal production image
# ═══════════════════════════════════════════════════════════════
FROM node:22-alpine AS runner

WORKDIR /app

# Production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root user for security
# UID/GID 1001 avoids conflicts with system accounts
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy the public assets
COPY --from=builder /app/public ./public

# The standalone output includes a minimal server.js and
# only the node_modules files actually needed at runtime.
# We set ownership to nextjs:nodejs so the non-root user
# can write to the .next/cache directory at runtime.
RUN mkdir -p .next
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# The standalone server listens on port 3000 by default.
# HOSTNAME=0.0.0.0 is required so Docker can route traffic
# into the container (without this, it only binds to 127.0.0.1).
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

# Healthcheck — verifies the app is actually responding
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/').then(r => { if (!r.ok) throw r.status; process.exit(0); }).catch(() => process.exit(1))"

# Start the standalone Next.js server
CMD ["node", "server.js"]
