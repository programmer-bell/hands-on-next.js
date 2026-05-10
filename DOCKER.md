# Docker Guide — realtime-dashboard

Production-ready Docker setup for the Next.js 16 Analytics Dashboard.

---

## Quick Start

```bash
# Production — build & run
docker compose --profile prod up --build -d

# Development — hot reload
docker compose --profile dev up --build

# Stop
docker compose --profile prod down
docker compose --profile dev down
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  docker-compose.yml                                     │
│                                                         │
│  ┌─────────────────────┐  ┌──────────────────────────┐  │
│  │  app (prod profile) │  │  app-dev (dev profile)   │  │
│  │                     │  │                          │  │
│  │  Dockerfile         │  │  Dockerfile.dev          │  │
│  │  4-stage build      │  │  Single stage            │  │
│  │  standalone output  │  │  Volume-mounted source   │  │
│  │  non-root user      │  │  Hot reload              │  │
│  │  healthcheck        │  │  Full devDependencies    │  │
│  │  ~312 MB image      │  │                          │  │
│  └─────────────────────┘  └──────────────────────────┘  │
│                                                         │
│  Network: dashboard-net (bridge)                        │
└─────────────────────────────────────────────────────────┘
```

---

## File Structure

```
realtime-dashboard/
├── Dockerfile              # Multi-stage production build
├── Dockerfile.dev          # Development with hot reload
├── docker-compose.yml      # Unified compose (dev + prod profiles)
├── .dockerignore           # Excludes node_modules, .git, etc.
├── .env                    # Local development env vars
├── .env.production         # Production env vars
├── .env.docker.example     # Template for Docker env configuration
└── next.config.ts          # output: 'standalone' enabled
```

---

## Production Mode

### Build & Run

```bash
# Build and start in background
docker compose --profile prod up --build -d

# View logs
docker logs dashboard-prod -f

# Check health
docker inspect --format='{{.State.Health.Status}}' dashboard-prod

# Stop
docker compose --profile prod down
```

### Standalone Build (without Compose)

```bash
# Build the image
docker build -t realtime-dashboard:latest .

# Run directly
docker run -d \
  --name dashboard \
  -p 3000:3000 \
  -e NODE_ENV=production \
  --restart unless-stopped \
  realtime-dashboard:latest
```

### Custom Build-Time Variables

`NEXT_PUBLIC_*` variables are inlined during `next build`. To customize:

```bash
docker build \
  --build-arg NEXT_PUBLIC_APP_NAME="My Dashboard" \
  --build-arg NEXT_PUBLIC_POLL_INTERVAL_ACTIVITY=5000 \
  -t realtime-dashboard:custom .
```

Or via Compose:

```bash
NEXT_PUBLIC_APP_NAME="My Dashboard" docker compose --profile prod up --build -d
```

---

## Development Mode

```bash
# Start with hot reload
docker compose --profile dev up --build

# Rebuild after dependency changes
docker compose --profile dev up --build --force-recreate
```

### How Dev Mode Works

- Source code is **volume-mounted** into the container — edits on your host are reflected instantly.
- `node_modules` uses an anonymous volume, so the container's deps don't conflict with your host's.
- `WATCHPACK_POLLING=true` enables file-watching on Windows/Mac (where inotify isn't available through Docker).
- Next.js cache is persisted in a named volume (`nextjs-cache`) for faster restarts.

> **Note:** Next.js docs recommend local `npm run dev` over Docker for development on Windows/Mac due to filesystem performance. Docker dev mode is provided for parity/CI, but native dev will be faster.

---

## Environment Variables

### Build-Time (`NEXT_PUBLIC_*`)

These are embedded into the JavaScript bundle during `next build`. Changing them **requires a full rebuild**.

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_APP_NAME` | `Analytics` | App title in sidebar |
| `NEXT_PUBLIC_POLL_INTERVAL_ACTIVITY` | `3000` | Activity poll (ms) |
| `NEXT_PUBLIC_POLL_INTERVAL_PERFORMANCE` | `3000` | Performance poll (ms) |
| `NEXT_PUBLIC_POLL_INTERVAL_REVENUE` | `10000` | Revenue poll (ms) |
| `NEXT_PUBLIC_POLL_INTERVAL_OVERVIEW` | `15000` | Overview poll (ms) |

### Runtime (Server-Side)

These can be changed without rebuilding the image:

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node environment |
| `PORT` | `3000` | Server port |
| `HOSTNAME` | `0.0.0.0` | Bind address |

### Adding Secrets

For server-side secrets (DB URLs, API keys), pass them at runtime — never bake them into the image:

```bash
docker run -d \
  -e DATABASE_URL="postgres://..." \
  -e API_SECRET_KEY="..." \
  realtime-dashboard:latest
```

Or in `docker-compose.yml`:

```yaml
environment:
  - DATABASE_URL=${DATABASE_URL}
```

---

## Dockerfile Stages Explained

| Stage | Base | Purpose | Carries Forward |
|-------|------|---------|-----------------|
| `base` | `node:22-alpine` | Alpine + libc6-compat | Shared by deps & builder |
| `deps` | `base` | `npm ci` (all dependencies) | `node_modules/` |
| `builder` | `base` | `next build` (standalone) | `.next/standalone/`, `.next/static/`, `public/` |
| `runner` | `node:22-alpine` | Minimal production server | Only what's needed to run |

The final image contains **no source code, no devDependencies, no build tools** — just the compiled app and its runtime dependencies.

---

## Security

- **Non-root user**: The container runs as `nextjs` (UID 1001), not root.
- **Minimal image**: Alpine-based, only runtime files included.
- **No secrets in image**: `NEXT_PUBLIC_*` vars are safe (they're public by design). Server-side secrets should be injected at runtime.
- **`.dockerignore`**: Prevents `.env*.local`, `.git`, `node_modules` from entering the build context.

---

## Troubleshooting

### Container starts but app doesn't load

```bash
# Check logs
docker logs dashboard-prod

# Verify the container is healthy
docker inspect --format='{{.State.Health.Status}}' dashboard-prod

# Shell into the container
docker exec -it dashboard-prod sh
```

### Port already in use

```bash
# Use a different host port
PORT=8080 docker compose --profile prod up -d

# Or edit docker-compose.yml ports: "8080:3000"
```

### Hot reload not working (dev mode)

1. Ensure `WATCHPACK_POLLING=true` is set (it is by default in compose).
2. Check the volume mounts are correct.
3. On Windows, ensure Docker Desktop has file sharing enabled for your drive.

### Build fails with "out of memory"

```bash
# Increase Docker Desktop memory limit
# Docker Desktop → Settings → Resources → Memory → 4GB+

# Or build with reduced concurrency
docker build --build-arg NODE_OPTIONS="--max-old-space-size=2048" .
```

### Image is too large

```bash
# Check image size
docker images realtime-dashboard

# Inspect layers
docker history realtime-dashboard:latest

# Current optimized size: ~312 MB
```

### Container keeps restarting

```bash
# Check exit code and logs
docker inspect --format='{{.State.ExitCode}}' dashboard-prod
docker logs dashboard-prod --tail 50
```

---

## Deployment Recommendations

### Cloud Platforms

| Platform | Approach |
|----------|----------|
| **AWS ECS/Fargate** | Push to ECR, create task definition with healthcheck |
| **Google Cloud Run** | `gcloud run deploy --image realtime-dashboard` |
| **Azure Container Apps** | Push to ACR, deploy via CLI or portal |
| **DigitalOcean App Platform** | Connect repo, auto-build from Dockerfile |
| **Railway / Fly.io** | Auto-detect Dockerfile, deploy from repo |

### CI/CD Pipeline Example (GitHub Actions)

```yaml
- name: Build and push
  run: |
    docker build -t registry.example.com/dashboard:${{ github.sha }} .
    docker push registry.example.com/dashboard:${{ github.sha }}
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure real `NEXT_PUBLIC_*` values at build time
- [ ] Inject secrets via environment variables (not `.env` files)
- [ ] Enable restart policy (`unless-stopped` or `always`)
- [ ] Configure log rotation (`--log-opt max-size=10m`)
- [ ] Set memory limits (`deploy.resources.limits.memory`)
- [ ] Use a reverse proxy (nginx/Traefik) for TLS termination
- [ ] Monitor healthcheck endpoint

---

## Useful Commands

```bash
# Build only (no run)
docker compose --profile prod build

# Rebuild from scratch (no cache)
docker compose --profile prod build --no-cache

# View running containers
docker ps

# Follow logs in real-time
docker logs -f dashboard-prod

# Execute a command inside the container
docker exec -it dashboard-prod sh

# Check image size
docker images realtime-dashboard

# Remove all stopped containers and dangling images
docker system prune

# Remove everything (nuclear option)
docker system prune -a --volumes
```
