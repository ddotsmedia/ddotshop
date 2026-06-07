# Blockers — DdotsShop

Tasks stubbed or deferred during the autonomous build. Each is marked `[~]` in code with a TODO.

## Phase 0
- **PostgreSQL not provisioned locally.** `prisma migrate` cannot run in this environment. `prisma generate` succeeds (client is generated from schema). Run `npm run db:migrate` once a Postgres 16 instance is reachable via `DATABASE_URL`. The app builds without a live DB.
- **Redis not provisioned locally.** `ioredis` client uses `lazyConnect`; AI quota + BullMQ require a running Redis at runtime. Build is unaffected.

## Phases 13–16
- **Meta WhatsApp Flows publish [~]** needs `META_WABA_TOKEN` + `META_WABA_ID`. Without them, `/api/flows/[id]/publish` marks the flow published locally (stub). See `app/api/flows/[id]/publish/route.ts`.
- **Flow send [~]** falls back to a templated text message; real interactive-flow send needs Twilio Content API. See `workers/whatsapp.worker.ts` FLOW_SEND.
- **Voice ordering** needs live `OPENAI_API_KEY` (Whisper) + `TWILIO_AUTH_TOKEN` (audio download) + `ANTHROPIC_API_KEY` (intent). Stubbed creds → transcription fails gracefully.
- **Inbound webhook** requires the public URL `${NEXT_PUBLIC_APP_URL}/api/webhooks/twilio` registered in Twilio; signature check is skipped only while `TWILIO_AUTH_TOKEN=placeholder`.
