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

## Phase 1

- **Routing deviates from the spec's subdomain-at-root scheme.** The spec implies dashboard pages live at `/` on `app.ddotsshop.com` and shops at `/` on `{slug}.ddotsshop.com` — but Next.js route groups cannot both resolve to `/` (build collision). Instead: marketing at `/`, dashboard at `/dashboard/*`, auth at `/login|/signup|/onboarding`, shops at `/shop/[slug]`. `middleware.ts` rewrites production subdomains onto these paths (`app.*/` → `/dashboard`, `{slug}.*/path` → `/shop/{slug}/path`). Local dev uses the real paths directly.
- **Middleware auth gate is cookie-presence only** (edge-safe). It checks for the `authjs.session-token` cookie to gate `/dashboard`; the authoritative session/role check runs in server components/handlers via `auth()` (Node runtime, Prisma access). Avoids running Prisma on the edge.
- **next-auth JWT augmentation** didn't fully override the `JWT` index signature under strict mode, so token fields are cast (`token.uid as string`) in callbacks.

## Phase 12

- **i18n is a lightweight dictionary, not full next-intl routing.** The spec asks for next-intl, but its locale middleware/routing conflicts with our custom subdomain `middleware.ts` (which already rewrites hosts → paths). Stacking next-intl's `[locale]` segment routing on top would break the shop subdomain rewrites. Instead: `messages/en.json` + `messages/ar.json` are consumed via `lib/i18n.ts getDict(locale)`, and RTL is applied via `dir="rtl"` on the shop layout from `shop.locale`. This delivers EN/AR + RTL without the routing conflict. (`next-intl` remains installed for future use.)
- **Plans/billing are read-only** — usage metering and plan gating are live, but no payment processor for subscriptions is wired (out of scope); upgrade buttons are disabled with a "contact support" note.
- **Stripe API version** left at the SDK default (pinned by the installed `stripe` package) rather than hard-coding a version string, which drifts across SDK majors.

## Phases 24, 27–32 (gap build, 2026-06-08)

- **Repo was already built through ~prompt-phase 26.** The COMPLETE_PROMPT is a greenfield spec (Phase 0 = `create-next-app .`), but the repo is a live, deployed app (Docker container healthy, on VPS). Did NOT re-scaffold — built only the genuinely missing pieces: Super Admin Panel (P2), AI segments (P27), wholesale (P28), vendors (P29), CTWA (P30), import (P31), CI deploy (P24), final QA (P32). Git "phase" commit numbers differ from prompt phase numbers.
- **Role system added late.** `User.role` defaulted `TENANT`; `SUPER_ADMIN` seeded. JWT now hydrates `role` once; admin users skip tenant/shop hydration. `requireSuperAdmin()` enforces in every `/api/admin/*` handler; `/admin-panel/layout.tsx` re-checks server-side (middleware only gates on cookie presence, matching the existing dashboard pattern).
- **Impersonation token** signed with `node:crypto` HMAC-SHA256 compact JWT (15 min) — avoided adding the `jose` dependency.
- **Start script kept as `next start`.** The prompt (P24.4) wants `node .next/standalone/server.js`, but the repo Dockerfile does NOT copy `.next/static`/`public` into the standalone dir, so switching would break asset serving on the healthy production container. `next start` works with `output: standalone` (warns only). Left unchanged deliberately.
- **deploy.yml** uses real container name `ddotsshop-app-1` (double-s) and path `/opt/ddotsshop`; requires repo secret `VPS_SSH_KEY`. Confirm the VPS path before first run.
- **All new `/api` route handlers marked `export const dynamic = "force-dynamic"`** — they are auth-gated and must never be statically prerendered (build was executing them and hitting DB/Redis).
- **Lint:** project was scaffolded `--no-eslint`; standalone `next lint` is unconfigured/interactive. The type+lint pass inside `next build` is green and serves as the gate.
