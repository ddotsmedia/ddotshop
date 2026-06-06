# Blockers — DdotsShop

Tasks stubbed or deferred during the autonomous build. Each is marked `[~]` in code with a TODO.

## Phase 0
- **PostgreSQL not provisioned locally.** `prisma migrate` cannot run in this environment. `prisma generate` succeeds (client is generated from schema). Run `npm run db:migrate` once a Postgres 16 instance is reachable via `DATABASE_URL`. The app builds without a live DB.
- **Redis not provisioned locally.** `ioredis` client uses `lazyConnect`; AI quota + BullMQ require a running Redis at runtime. Build is unaffected.
