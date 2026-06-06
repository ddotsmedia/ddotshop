# Architecture Decisions — DdotsShop

## Phase 0

- **Next.js 14.2.x** (App Router) per spec. Scaffolded with `create-next-app@14`.
- **Prisma v6** (not v7). npm resolved `@prisma/client` to v7 initially; pinned to v6 to avoid the v7 config/generator breaking changes mid-build. v6 is mature and stable.
- **next-auth v5** installed as `next-auth@beta` (v5 is published under the beta tag).
- **Tenant ↔ User split.** NextAuth's `PrismaAdapter` requires models literally named `User`/`Account`/`Session`/`VerificationToken`. We keep those standard models and add a `Tenant` (1:1 with `User`) holding `plan` + billing, and `Shop` (1:1 with `Tenant`). Credentials signup creates `User` (passwordHash) + `Tenant` in one transaction. JWT session strategy; `tenantId`/`shopId`/`plan` injected into the token via a DB lookup in the `jwt` callback.
- **Session strategy: JWT** (not database sessions) — lighter, works with CredentialsProvider, and the adapter still persists OAuth account links.
- **UI primitives hand-written** in `components/ui/*` (shadcn-style, Radix-backed) instead of running `npx shadcn init` — avoids the interactive CLI in an autonomous build and pins behaviour. No `class-variance-authority` dependency; variants done with `cn()`.
- **lucide-react pinned to ^0.460** — npm initially resolved a bogus 1.x; pinned to a known-good range.
- **R2 via @aws-sdk/client-s3** S3-compatible endpoint. Store full public URL in DB; `extractR2Key()` recovers the key for deletes.
- **AI quota** metered in Redis per tenant/month/model-tier; fails open if Redis is down (dev) so the app stays usable without infra.
