# DdotsShop — Getting Started

Multi-tenant WhatsApp Commerce SaaS for UAE/GCC. Sellers get a branded catalog at
`{slug}.ddotsshop.com`; customers browse and order via WhatsApp.

## 1. Local development

Prerequisites: Node ≥ 22, PostgreSQL 16, Redis 7.

```bash
npm install
cp .env.example .env.local      # fill in values (placeholders are fine for build)
npm run db:push                 # create tables in your local Postgres
npm run dev                     # Next.js on http://localhost:3000
npx tsx workers/index.ts        # in a second terminal: BullMQ workers (needs Redis)
```

Local routing (no subdomains):
- Marketing: `/`
- Auth: `/login`, `/signup`, `/onboarding`
- Dashboard: `/dashboard/*`
- Storefront: `/shop/{slug}`, checkout at `/shop/{slug}/checkout`

> In production, `middleware.ts` rewrites `app.ddotsshop.com → /dashboard` and
> `{slug}.ddotsshop.com → /shop/{slug}`.

## 2. Environment variables for go-live

Real values required for full functionality:

| Var | Used for |
|-----|----------|
| `DATABASE_URL` | PostgreSQL 16 connection |
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | Auth.js session signing (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Canonical app URL |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` / `R2_PUBLIC_URL` | Cloudflare R2 image + invoice storage |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_WHATSAPP_FROM` | WhatsApp messaging |
| `ANTHROPIC_API_KEY` | Claude AI features |
| `TELR_STORE_ID` / `TELR_AUTH_KEY` | Telr payments (or set per-shop in Settings) |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe payments |
| `REDIS_URL` | BullMQ queues + AI quota |
| `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SHOP_DOMAIN` | Absolute URLs + subdomain routing |

Webhooks to register:
- Telr → `POST /api/webhooks/telr`
- Stripe → `POST /api/webhooks/stripe`

## 3. VPS deployment (PM2)

```bash
cd /var/www/ddotsshop
git pull origin main
npm ci
npx prisma migrate deploy
npm run build
pm2 restart ddotsshop || pm2 start npm --name ddotsshop -- start
pm2 restart ddotsshop-workers || pm2 start npm --name ddotsshop-workers -- run workers
pm2 save
```

## 4. Post-deploy checklist

- [ ] DNS: `*.ddotsshop.com` + `app.ddotsshop.com` → VPS
- [ ] `npm run build` passes (✅ verified) and `npx tsc --noEmit` clean (✅ verified)
- [ ] Sign up → onboarding → shop created
- [ ] Add product (try AI description) → publish → visible on `/shop/{slug}`
- [ ] Add to cart → WhatsApp order opens with formatted message
- [ ] Checkout via Telr/Stripe → webhook flips order to PAID, stock decremented
- [ ] Worker sends order confirmation + generates invoice PDF
- [ ] Analytics + AI insights populate (Growth+ plan)

See `BLOCKERS.md` for items requiring live infrastructure and `DECISIONS.md` for
architecture choices.
