# Docker Setup Guide

This document covers the complete Docker setup for Stonehaven: containerising the backend, frontend, MongoDB, and Redis; development vs production compose configurations; health checks; and how the local Redis broker maps to AWS SQS/ElastiCache in production.

See also:
- [AWS_ARCHITECTURE.md](./AWS_ARCHITECTURE.md) — cloud infrastructure plan
- [ARCHITECTURE_MIGRATION.md](./ARCHITECTURE_MIGRATION.md) — architecture migration

---

## 1. Container Overview

```text
  ┌──────────────────────────────────────────────────────────┐
  │                   stonehaven-network                     │
  │                                                          │
  │  ┌──────────────┐       ┌──────────────────────────┐    │
  │  │   frontend   │──────▶│        backend           │    │
  │  │  (Next.js)   │ :3001 │    (Express / Node)      │    │
  │  │   port 3001  │       │       port 3000          │    │
  │  └──────────────┘       └───────┬──────────────────┘    │
  │                                 │                        │
  │                         ┌───────┴──────────────────┐    │
  │                         │                          │    │
  │                  ┌──────┴──────┐         ┌─────────┴──┐ │
  │                  │   mongodb   │         │   redis    │ │
  │                  │   port 27017│         │  port 6379 │ │
  │                  └─────────────┘         └────────────┘ │
  └──────────────────────────────────────────────────────────┘
```

| Container | Image / Build | Role |
|-----------|-------------|------|
| `backend` | `infra/docker/Dockerfile.backend` | Express 5 API, TypeScript |
| `frontend` | `infra/docker/Dockerfile.frontend` | Next.js (standalone output) |
| `mongodb` | `mongo:7` | Primary database |
| `redis` | `redis:7-alpine` | Session store, task queue (maps to ElastiCache/SQS on AWS) |

---

## 2. Existing Dockerfiles

The Dockerfiles already live in `infra/docker/` and use a correct multi-stage build pattern. Key notes:

### 2.1 Backend (`infra/docker/Dockerfile.backend`)

- **Stage `deps`**: installs `node_modules` from `package*.json`
- **Stage `builder`**: compiles TypeScript → `dist/backend/`
- **Stage `runner`**: copies only `dist/` + `node_modules`; runs as a non-root `nodejs` user on port 3000

What to add for Redis and health check support:

```dockerfile
# Add to the runner stage, after EXPOSE 3000:
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1
```

### 2.2 Frontend (`infra/docker/Dockerfile.frontend`)

- Uses `output: 'standalone'` in `next.config.js` (already configured) — Next.js emits a self-contained `server.js`
- **Stage `runner`** copies `.next/standalone`, `.next/static`, and `public/`; runs `server.js` on port 3001

What to add:

```dockerfile
# Add to the runner stage, after EXPOSE 3001:
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1
```

---

## 3. Adding Redis to Docker Compose

Redis serves two purposes locally:
1. **Session store** — replace `connect-mongo` with `connect-redis` to make sessions stateless-friendly (required for Lambda later)
2. **Task queue / broker** — local stand-in for AWS SQS; a worker container consumes jobs from Redis queues using [BullMQ](https://docs.bullmq.io/)

### 3.1 Updated `docker-compose.yml` (production-like)

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    container_name: stonehaven-mongodb
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: stonehaven
    volumes:
      - mongodb_data:/data/db
    networks:
      - stonehaven-network
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 20s

  redis:
    image: redis:7-alpine
    container_name: stonehaven-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    networks:
      - stonehaven-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 15s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: infra/docker/Dockerfile.backend
      target: runner
    container_name: stonehaven-backend
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env
    environment:
      NODE_ENV: production
      DB_URL: mongodb://mongodb:27017/stonehaven
      REDIS_URL: redis://redis:6379
    depends_on:
      mongodb:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - stonehaven-network
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 15s

  frontend:
    build:
      context: .
      dockerfile: infra/docker/Dockerfile.frontend
      target: runner
    container_name: stonehaven-frontend
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: http://backend:3000
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - stonehaven-network
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3001"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 20s

  # Worker: consumes async jobs from Redis (BullMQ queues)
  # Locally it replaces what SQS + Lambda workers do on AWS.
  worker:
    build:
      context: .
      dockerfile: infra/docker/Dockerfile.backend
      target: runner
    container_name: stonehaven-worker
    restart: unless-stopped
    env_file:
      - .env
    environment:
      NODE_ENV: production
      DB_URL: mongodb://mongodb:27017/stonehaven
      REDIS_URL: redis://redis:6379
      WORKER_MODE: "true"
    command: ["node", "dist/backend/worker.js"]
    depends_on:
      mongodb:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - stonehaven-network

volumes:
  mongodb_data:
  redis_data:

networks:
  stonehaven-network:
    driver: bridge
```

### 3.2 Updated `docker-compose.dev.yml` (development — hot reload)

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    container_name: stonehaven-mongodb-dev
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: stonehaven
    volumes:
      - mongodb_data:/data/db
    networks:
      - stonehaven-network
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 30s
      timeout: 10s
      retries: 5
      start_period: 20s

  redis:
    image: redis:7-alpine
    container_name: stonehaven-redis-dev
    restart: unless-stopped
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - stonehaven-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 15s
      timeout: 5s
      retries: 5

volumes:
  mongodb_data:
  redis_data:

networks:
  stonehaven-network:
    driver: bridge
```

> **Dev workflow:** MongoDB and Redis run in Docker. Backend and frontend run locally with `npm run dev` (hot reload via `ts-node-dev` / `next dev`). The backends connect to `localhost:27017` and `localhost:6379`.

---

## 4. Environment Variables

| Variable | Backend | Frontend | Description |
|----------|---------|----------|-------------|
| `NODE_ENV` | ✓ | ✓ | `development` / `production` |
| `PORT` | ✓ | — | Backend port (default 3000) |
| `DB_URL` | ✓ | — | MongoDB connection string |
| `REDIS_URL` | ✓ | — | Redis connection string |
| `SECRET` | ✓ | — | Session / cookie secret |
| `MAPBOX_TOKEN` | ✓ | — | Mapbox geocoding API key |
| `CLOUDINARY_CLOUD_NAME` | ✓ | — | Cloudinary config |
| `CLOUDINARY_KEY` | ✓ | — | Cloudinary config |
| `CLOUDINARY_SECRET` | ✓ | — | Cloudinary config |
| `FRONTEND_URL` | ✓ | — | CORS origin allowlist |
| `NEXT_PUBLIC_API_URL` | — | ✓ | Backend API base URL |

In Docker Compose, sensitive values are loaded via `env_file: .env`. Non-sensitive values are inlined in the `environment` block.

**Never commit `.env` to git.** Use `.env.example` as a template.

---

## 5. Redis as a Local Broker

### What Redis replaces locally

| AWS service | Local equivalent | Purpose |
|-------------|-----------------|---------|
| **SQS** | Redis + BullMQ queue | Async task queue (image processing, emails) |
| **ElastiCache (Redis)** | Redis container | Session store, rate-limit counters |
| **SNS** | Redis pub/sub or BullMQ events | Domain event fan-out |

### Installing BullMQ in the backend

```bash
npm install bullmq ioredis
```

### Producer (backend — inside a use case or adapter)

```typescript
// adapters/outbound/queue/BullMQTaskQueue.ts
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL!);

export const imageQueue = new Queue('image-processing', { connection });
export const emailQueue = new Queue('email', { connection });

// Called from CreateCampground use case adapter:
await imageQueue.add('resize-campground-image', { campgroundId, imageUrl });
```

### Consumer (worker.ts — runs in the `worker` container)

```typescript
// src/backend/src/worker.ts
import { Worker } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL!);

new Worker('image-processing', async (job) => {
  const { campgroundId, imageUrl } = job.data;
  // process image...
}, { connection });

new Worker('email', async (job) => {
  // send email...
}, { connection });
```

### On AWS

- The `imageQueue` producer sends to **SQS** instead of Redis
- The worker Lambda function is triggered by **SQS event source mapping**
- No code change in the use case — only the adapter (`BullMQTaskQueue` → `SQSTaskQueue`) is swapped

This is exactly why **Clean Architecture + Hexagonal** matters: the queue adapter is behind an interface (`ITaskQueue`), so swapping Redis for SQS requires changing only one file.

---

## 6. Health Check Endpoints

Add a `/health` route to the backend. It should be one of the first routes registered (before authentication middleware):

```typescript
// src/backend/src/api/routes/health.routes.ts
import { Router } from 'express';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
```

Register in `index.ts` before other routes:

```typescript
import healthRoutes from './api/routes/health.routes';
app.use(healthRoutes); // before auth/session middleware
```

---

## 7. Networking

All containers share the `stonehaven-network` bridge network. Container DNS resolution uses service names:

| From container | To container | DNS name |
|----------------|-------------|---------|
| backend | mongodb | `mongodb:27017` |
| backend | redis | `redis:6379` |
| frontend | backend | `backend:3000` |
| worker | mongodb | `mongodb:27017` |
| worker | redis | `redis:6379` |

External ports exposed to the host (`localhost`):
- `3000` → backend API (for direct testing, Postman)
- `3001` → frontend UI
- `27017` → MongoDB (for MongoDB Compass / Studio 3T)
- `6379` → Redis (for redis-cli / RedisInsight)

---

## 8. Common Commands

```bash
# Start everything (production-like build)
docker compose up --build

# Development: only MongoDB + Redis in Docker, apps run locally
docker compose -f docker-compose.dev.yml up -d
npm run dev           # or your root dev script

# Rebuild a single service
docker compose build backend

# View logs
docker compose logs -f backend
docker compose logs -f worker

# Connect to MongoDB shell
docker exec -it stonehaven-mongodb mongosh stonehaven

# Connect to Redis CLI
docker exec -it stonehaven-redis redis-cli

# Stop everything and clean volumes (full reset)
docker compose down -v
```

---

## 9. What Changes When Deploying to AWS

| Local (Docker) | AWS equivalent | Notes |
|----------------|---------------|-------|
| `mongodb` container | MongoDB Atlas or DocumentDB | See AWS_ARCHITECTURE.md |
| `redis` container | ElastiCache (Redis) | Same ioredis client, just different URL |
| Redis queues (BullMQ) | SQS queues | Swap queue adapter only |
| `worker` container | Lambda (SQS trigger) | Worker logic becomes Lambda handler |
| `frontend` container | S3 + CloudFront (static export) or Lambda@Edge | See AWS_ARCHITECTURE.md |
| `backend` container | Lambda (API Gateway trigger) or ECS Fargate | See AWS_ARCHITECTURE.md |
| Bridge network | VPC with private subnets | DB and cache in private subnets |
