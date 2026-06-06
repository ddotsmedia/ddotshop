You are the lead engineer building DdotsShop — a multi-tenant WhatsApp Commerce SaaS for UAE/GCC businesses. Sellers get a branded product catalog at {slug}.ddotsshop.com. Customers browse products, add to cart, and order via WhatsApp. The platform includes AI-powered features, automated WhatsApp messaging, UAE payments, and a full seller dashboard.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AUTONOMY RULES — READ FIRST, NEVER BREAK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. NEVER stop between phases. NEVER ask "shall I continue?". NEVER wait for confirmation. After each phase commits, immediately start the next one.
2. NEVER ask the user to make decisions. Make all technical decisions yourself and log them in DECISIONS.md.
3. If blocked on any task: write the blocker to BLOCKERS.md, stub the function with a TODO comment, mark task [~], and immediately continue to the next task.
4. Keep your output terse. One line per completed task. No preamble. No "Great, let me now..." filler. No summaries between phases.
5. Existing files to READ then EXTEND (never overwrite blind):
   - prisma/schema.prisma
   - middleware.ts
   - lib/claude.ts
   - lib/whatsapp.ts
   - lib/model-router.ts
   - app/(marketing)/page.tsx
6. After every phase: run git add -A && git commit -m "feat(phaseN): description" then immediately start next phase.
7. At end of Phase 12: run npm run build and fix every TypeScript/lint error until it passes clean.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOKEN ECONOMY — CHECK BEFORE EVERY TASK GROUP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use the cheapest model capable of the task. State your model in one line before each task group.

HAIKU  → 70% of work: file reads, configs, boilerplate, CRUD routes,
          Prisma queries, simple components, env files, type definitions,
          test stubs, formatters, utility functions

SONNET → 25% of work: auth flows, payment integration, BullMQ workers,
          AI route handlers, multi-file debugging, complex business logic,
          TypeScript generics, security-sensitive code

OPUS   → 5% of work: ONE decision per phase maximum — only for
          architecture choices, security review of payment/auth,
          final pre-deploy audit after Phase 12. Never for coding tasks.

Cost rules:
- Batch all file reads for a phase into one context load at phase start
- Never re-read a file you already read in this phase
- Write code directly — do not explain what you are about to write first
- No markdown headers in your responses — just task lines and code

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROJECT CONFIG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Project:     DdotsShop — WhatsApp Commerce SaaS
Domains:     ddotsshop.com (marketing)
             app.ddotsshop.com (dashboard)
             {slug}.ddotsshop.com (shop storefronts)
Repo:        ddotsmedia/ddotsshop
VPS:         194.164.151.202
Local path:  C:\websites\Ddotsshop

Stack:
  Framework:   Next.js 14 App Router, TypeScript strict mode
  Database:    PostgreSQL 16 + Prisma ORM
  Cache/Queue: Redis + BullMQ
  Storage:     Cloudflare R2 (all product images — never local disk)
  Auth:        NextAuth.js v5 + Google OAuth + Credentials
  Styling:     Tailwind CSS + shadcn/ui
  Payments:    Telr (UAE/AED primary), Stripe (international), UPI QR
  WhatsApp:    Twilio WhatsApp Business API
  AI:          Anthropic Claude API via lib/model-router.ts
  i18n:        next-intl (English + Arabic RTL)
  Email:       Nodemailer
  Deploy:      GitHub Actions → SSH → PM2 on VPS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ARCHITECTURE RULES — NEVER VIOLATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DATABASE:
- Every query must include WHERE shopId = X or WHERE tenantId = X — no cross-tenant leaks ever
- Use Prisma transactions for order creation: Order + OrderItems must be atomic
- Always use select: {} to fetch only needed fields — never fetch entire models

WHATSAPP:
- Never call Twilio directly from an API route — always queue via BullMQ waQueue
- Abandoned cart job must be idempotent: jobId = "cart-{orderId}" prevents duplicates
- Cancel abandoned cart job immediately on successful payment

IMAGES:
- All uploads go to Cloudflare R2 via lib/r2.ts uploadToR2()
- Store only the R2 public URL in DB — never a local path

SHOP PAGES:
- Use Next.js ISR with revalidate: 60 — not pure SSR
- Shop pages must score 90+ Lighthouse mobile — optimize images, no layout shift

AI (in-app calls):
- Always call pickModel(task) from lib/model-router.ts before any Anthropic API call
- Always call checkAIQuota(tenantId, plan, model) before calling Claude — return 429 if exceeded
- Always log to AIUsageLog after every Claude call: model, inputTokens, outputTokens, cost, feature

TYPESCRIPT:
- Strict mode throughout — no "any" types
- All API route handlers must be typed: NextRequest → NextResponse<T>
- Zod validation on all POST/PUT request bodies before touching DB

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESIGN SYSTEM — APPLY TO EVERY UI COMPONENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Font: Plus Jakarta Sans — import in app/layout.tsx from Google Fonts

CSS variables (add to app/globals.css):
  --wa-green:   #25D366   primary CTA, WhatsApp brand
  --wa-dark:    #128C7E   hover states
  --wa-light:   #DCF8C6   backgrounds
  --surface:    #F9FAFB   page background
  --card:       #FFFFFF   card background
  --border:     #E5E7EB   borders
  --border-md:  #D1D5DB   stronger borders
  --text-1:     #111827   primary text
  --text-2:     #6B7280   secondary text
  --text-3:     #9CA3AF   muted text
  --danger:     #EF4444
  --success:    #10B981
  --warning:    #F59E0B
  --info:       #3B82F6
  --sidebar-bg: #0F1923   dashboard sidebar

Tailwind tokens (tailwind.config.ts extend.colors):
  'wa-green': '#25D366'
  'wa-dark':  '#128C7E'
  'surface':  '#F9FAFB'
  'sidebar':  '#0F1923'

Typography scale:
  Display: 3.5rem / 800 / tracking-[-2px]
  H1: 2.25rem / 800 / tracking-[-1.5px]
  H2: 1.75rem / 700 / tracking-[-1px]
  H3: 1.25rem / 600
  Body: 1rem / 400 / leading-[1.7]
  Small: 0.875rem / 400
  Caption: 0.75rem / 500

Spacing: 4px grid — use multiples of 4 only
Radius: sm=6px md=10px lg=14px xl=20px pill=9999px
Shadow: shadow-sm only (0 1px 3px rgba(0,0,0,0.08))

Component rules:
  Primary button:   bg-wa-green text-white rounded-lg px-5 py-2.5 font-semibold hover:bg-wa-dark
  Secondary button: bg-white border border-[--border-md] rounded-lg px-5 py-2.5
  Input:            border border-[--border] rounded-[10px] px-3 py-2 focus:ring-2 focus:ring-wa-green/20
  Card:             bg-white border border-[--border] rounded-xl p-5 shadow-sm
  Badge SALE:       bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded absolute top-2 left-2
  Badge verified:   bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full

Dashboard layout:
  Sidebar: 240px fixed, bg #0F1923, text #9CA3AF, active item: text #25D366 + left border 3px #25D366
  Topbar: 64px height, bg white, border-bottom
  Content: fluid, bg #F9FAFB, padding 24px

Shop storefront layout:
  Mobile-first. Max-width 480px centered on desktop. Full-width on mobile.
  Product grid: 2 columns mobile, 3 columns md+, gap-3, p-3
  WhatsApp green (#25D366) is the ONLY accent color on public shop pages.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHATSAPP ORDER MESSAGE FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🛍️ *New Order — {shopName}*

• {productName} ({variant}) × {qty} — {currency} {lineTotal}
[repeat for each item]

🏷️ *Promo {code}:* -{currency} {discount}   [only if discount applied]
💰 *Total: {currency} {total}*

📋 *Customer:* {customerName}
📱 *Phone:* {customerPhone}

_Powered by Ddotsshop.com_

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ENVIRONMENT VARIABLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create .env.local with these values (placeholders are fine for build):

DATABASE_URL=postgresql://ddotsshop:ddotsshop@localhost:5432/ddotsshop
NEXTAUTH_SECRET=ddotsshop-dev-secret-change-in-production
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=placeholder
GOOGLE_CLIENT_SECRET=placeholder
R2_ACCOUNT_ID=placeholder
R2_ACCESS_KEY_ID=placeholder
R2_SECRET_ACCESS_KEY=placeholder
R2_BUCKET_NAME=ddotsshop-assets
R2_PUBLIC_URL=https://assets.ddotsshop.com
TWILIO_ACCOUNT_SID=placeholder
TWILIO_AUTH_TOKEN=placeholder
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
ANTHROPIC_API_KEY=placeholder
TELR_STORE_ID=placeholder
TELR_AUTH_KEY=placeholder
STRIPE_SECRET_KEY=placeholder
STRIPE_WEBHOOK_SECRET=placeholder
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SHOP_DOMAIN=localhost:3000

Also create .env.example with the same keys but empty values — commit this, not .env.local.
Add .env.local to .gitignore immediately.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEPENDENCIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Run these exact commands in Phase 0 (split across two runs):

npm install \
  @prisma/client prisma \
  next-auth@5 @auth/prisma-adapter \
  bullmq ioredis \
  @aws-sdk/client-s3 @aws-sdk/lib-storage \
  twilio \
  @anthropic-ai/sdk \
  next-intl \
  zustand \
  recharts \
  pdfkit \
  zod react-hook-form @hookform/resolvers \
  lucide-react \
  clsx tailwind-merge \
  @radix-ui/react-dialog @radix-ui/react-dropdown-menu \
  @radix-ui/react-select @radix-ui/react-toast \
  @radix-ui/react-tabs \
  sharp \
  date-fns \
  nanoid

npm install -D \
  @types/node @types/pdfkit \
  tsx \
  concurrently

After install, run: npx shadcn@latest init (choose style: default, base color: neutral, CSS variables: yes)
Then add components: npx shadcn@latest add button input label card badge select tabs toast dropdown-menu dialog

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FOLDER STRUCTURE TO CREATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

app/
  (marketing)/page.tsx          ← already exists — extend only
  (auth)/login/page.tsx
  (auth)/signup/page.tsx
  (auth)/onboarding/page.tsx
  (dashboard)/layout.tsx
  (dashboard)/page.tsx
  (dashboard)/products/page.tsx
  (dashboard)/products/new/page.tsx
  (dashboard)/products/[id]/edit/page.tsx
  (dashboard)/categories/page.tsx
  (dashboard)/orders/page.tsx
  (dashboard)/orders/[id]/page.tsx
  (dashboard)/customers/page.tsx
  (dashboard)/customers/[id]/page.tsx
  (dashboard)/analytics/page.tsx
  (dashboard)/whatsapp/page.tsx
  (dashboard)/whatsapp/new/page.tsx
  (dashboard)/settings/page.tsx
  (dashboard)/settings/billing/page.tsx
  shop/[slug]/page.tsx
  shop/[slug]/layout.tsx
  shop/[slug]/checkout/page.tsx
  shop/[slug]/order/[id]/page.tsx
  api/health/route.ts
  api/auth/[...nextauth]/route.ts
  api/tenant/route.ts
  api/shop/route.ts
  api/shop/check/route.ts
  api/products/route.ts
  api/products/[id]/route.ts
  api/upload/route.ts
  api/categories/route.ts
  api/orders/route.ts
  api/orders/[id]/route.ts
  api/orders/[id]/invoice/route.ts
  api/customers/route.ts
  api/payments/telr/create/route.ts
  api/payments/stripe/create/route.ts
  api/webhooks/telr/route.ts
  api/webhooks/stripe/route.ts
  api/ai/describe/route.ts
  api/ai/search/route.ts
  api/ai/insights/route.ts
  api/ai/chat/route.ts
  api/analytics/view/route.ts
  api/broadcasts/route.ts
  api/broadcasts/[id]/send/route.ts
  api/discount-codes/route.ts
  api/discount-codes/validate/route.ts
  layout.tsx
  globals.css

components/
  dashboard/
    Sidebar.tsx
    Topbar.tsx
    MetricCard.tsx
    DataTable.tsx
    PageHeader.tsx
    StatsBadge.tsx
  shop/
    ShopHeader.tsx
    CategoryFilter.tsx
    ProductGrid.tsx
    ProductCard.tsx
    ProductModal.tsx
    CartDrawer.tsx
    CartItem.tsx
    CheckoutButton.tsx
    ChatWidget.tsx
    ChatMessage.tsx
  ui/                           ← shadcn/ui populates this

lib/
  prisma.ts                     ← singleton Prisma client
  redis.ts                      ← singleton Redis client
  r2.ts                         ← uploadToR2(), deleteFromR2()
  claude.ts                     ← already exists — extend only
  whatsapp.ts                   ← already exists — extend only
  model-router.ts               ← already exists — extend only
  telr.ts                       ← createTelrOrder(), verifyHMAC()
  stripe.ts                     ← createStripeSession()
  invoice.ts                    ← generateInvoicePDF()
  auth.ts                       ← NextAuth config
  utils.ts                      ← cn(), formatCurrency(), formatDate()
  validations.ts                ← all Zod schemas

workers/
  index.ts                      ← starts all workers
  whatsapp.worker.ts            ← processes WA queue jobs
  invoice.worker.ts             ← generates PDF invoices

prisma/
  schema.prisma                 ← already exists — do not modify models
  migrations/                   ← generated by prisma migrate

messages/
  en.json                       ← English i18n strings
  ar.json                       ← Arabic i18n strings

middleware.ts                   ← already exists — extend only
next.config.ts
tailwind.config.ts
tsconfig.json
.env.local                      ← gitignored
.env.example                    ← committed
.gitignore

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 0 — PROJECT BOOTSTRAP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[HAIKU] Bootstrap tasks — configs and scaffolding

P0.1  Run: npx create-next-app@14 . --typescript --tailwind --app --no-git --no-eslint
      (the . installs into current folder — existing files are preserved)

P0.2  Install all dependencies from DEPENDENCIES section above

P0.3  Read existing prisma/schema.prisma — run: npx prisma generate
      If PostgreSQL not available locally, log to BLOCKERS.md and skip migrate

P0.4  Create .env.local with all values from ENVIRONMENT VARIABLES section
      Create .env.example with same keys, empty values
      Add to .gitignore: .env.local, .env*.local, node_modules, .next

P0.5  Create next.config.ts:
      - images.domains: ['assets.ddotsshop.com', 'res.cloudinary.com']
      - images.remotePatterns for R2 bucket
      - experimental.serverActions: true
      - headers() for subdomain CORS: allow app.ddotsshop.com + *.ddotsshop.com

P0.6  Create tailwind.config.ts:
      - extend.colors: wa-green, wa-dark, wa-light, surface, sidebar, border-brand
      - extend.fontFamily: sans: ['Plus Jakarta Sans', ...defaultTheme.fontFamily.sans]
      - plugins: require('tailwindcss-animate')
      Install: npm install tailwindcss-animate

P0.7  Create app/globals.css:
      - Google Fonts import for Plus Jakarta Sans (400, 500, 600, 700, 800)
      - All CSS variables from DESIGN SYSTEM section
      - Base reset: * { box-sizing: border-box } body { font-family: var(--font) }
      - Scrollbar styles: thin, wa-green thumb

P0.8  Create lib/prisma.ts — singleton pattern:
      declare global { var prisma: PrismaClient }
      export const prisma = globalThis.prisma ?? new PrismaClient()
      if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma

P0.9  Create lib/redis.ts — singleton IORedis:
      export const redis = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: null })

P0.10 Create lib/r2.ts:
      uploadToR2(file: Buffer, key: string, contentType: string): Promise<string>
        → PutObjectCommand to R2 bucket
        → returns: ${process.env.R2_PUBLIC_URL}/${key}
      deleteFromR2(key: string): Promise<void>

P0.11 Create lib/utils.ts:
      cn(...inputs: ClassValue[]) → clsx + twMerge
      formatCurrency(amount: number, currency: string): string → Intl.NumberFormat
      formatDate(date: Date | string): string → date-fns format('dd MMM yyyy')
      generateSlug(name: string): string → lowercase + hyphens + nanoid(6) suffix
      extractR2Key(url: string): string → strips R2_PUBLIC_URL prefix

P0.12 Create lib/validations.ts — all Zod schemas:
      CreateTenantSchema, CreateShopSchema, CreateProductSchema,
      CreateOrderSchema, CreateBroadcastSchema, CreateDiscountSchema,
      LoginSchema, SignupSchema, OnboardingSchema

P0.13 Create app/api/health/route.ts:
      GET → NextResponse.json({ status: 'ok', ts: Date.now(), env: process.env.NODE_ENV })

P0.14 Create app/layout.tsx — root layout:
      - Plus Jakarta Sans font via next/font/google
      - Toaster from shadcn/ui
      - html lang="en" (changes to "ar" for shop pages with locale=AR)

P0.15 Commit: git add -A && git commit -m "feat(phase0): project bootstrap + prisma + design tokens"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 1 — AUTH + TENANT ONBOARDING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[SONNET] Auth is security-sensitive — use Sonnet for this phase

P1.1  Create lib/auth.ts — NextAuth v5 config:
      providers: [GoogleProvider, CredentialsProvider]
      adapter: PrismaAdapter(prisma)
      session: { strategy: 'jwt' }
      callbacks.jwt: add tenantId, shopId, plan to token from DB lookup
      callbacks.session: expose token fields on session.user
      pages: { signIn: '/login', error: '/login' }

P1.2  Create app/api/auth/[...nextauth]/route.ts:
      import { handlers } from '@/lib/auth'; export const { GET, POST } = handlers

P1.3  Extend middleware.ts (read first):
      Add auth check: if path starts with /dashboard and no session → redirect /login
      Subdomain routing logic (already present) — verify it handles:
        {slug}.ddotsshop.com → /shop/{slug}
        app.ddotsshop.com → /(dashboard)
        ddotsshop.com → /(marketing)

P1.4  Create app/(auth)/login/page.tsx:
      - Email/password form + "Continue with Google" button
      - Design: centered card, max-w-md, white bg, logo at top
      - Form validation with react-hook-form + LoginSchema
      - On submit: signIn('credentials', ...) or signIn('google')
      - Link to /signup

P1.5  Create app/(auth)/signup/page.tsx:
      - Name, email, password, confirm password
      - On submit: POST /api/tenant (creates Tenant record, hashes password with bcrypt)
      - On success: redirect to /onboarding
      Install: npm install bcryptjs && npm install -D @types/bcryptjs

P1.6  Create app/api/tenant/route.ts:
      POST: validate SignupSchema → check email unique → bcrypt.hash(password, 12)
            → prisma.tenant.create → return { tenantId }
      GET: return current tenant from session

P1.7  Create app/(auth)/onboarding/page.tsx:
      Step 1: Shop name + slug (with live availability check)
      Step 2: WhatsApp number (with country code selector — UAE +971 default)
      Step 3: Currency (AED default) + Language (EN default)
      - Slug field: debounced GET /api/shop/check?slug=xxx → show available/taken
      - On complete: POST /api/shop → redirect to /dashboard

P1.8  Create app/api/shop/route.ts:
      POST: validate CreateShopSchema → prisma.shop.create with tenantId from session
      GET: return shop for current tenant

P1.9  Create app/api/shop/check/route.ts:
      GET ?slug=xxx → { available: boolean } (check prisma.shop.findUnique by slug)
      Validate slug: /^[a-z0-9-]{3,30}$/ — reject invalid formats

P1.10 Commit: git add -A && git commit -m "feat(phase1): auth + tenant + shop onboarding"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 2 — DASHBOARD SHELL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[HAIKU] UI shell — straightforward layout components

P2.1  Create components/dashboard/Sidebar.tsx:
      - Fixed 240px, bg #0F1923, full height
      - Logo: green box (36px) + "DdotsShop" text (white, 800 weight)
      - Nav sections: STORE (Products, Orders, Customers) | GROWTH (Analytics, WhatsApp) | ACCOUNT (Settings)
      - NavItem: flex, icon (lucide 18px), label, active = green text + 3px left border + bg rgba(37,211,102,0.08)
      - Bottom: "View Shop →" link opens {slug}.ddotsshop.com in new tab
      - Mobile: hidden, toggled via hamburger in Topbar

P2.2  Create components/dashboard/Topbar.tsx:
      - Height 64px, bg white, border-bottom, px-6
      - Left: page title (passed as prop) + mobile hamburger
      - Right: shop badge (slug pill) + notification bell + avatar dropdown (Profile, Settings, Logout)

P2.3  Create components/dashboard/MetricCard.tsx:
      Props: title, value, change (number), changeLabel, icon (lucide), currency?
      - bg surface, border, rounded-xl, p-5
      - Icon top-right in colored circle (green for positive, red for negative)
      - Value: 28px/700, formatted with formatCurrency if currency prop
      - Change: green arrow up / red arrow down, percentage

P2.4  Create components/dashboard/PageHeader.tsx:
      Props: title, subtitle?, action? (button config)
      - flex justify-between items-center, mb-6
      - Title: H2, Subtitle: text-2 small

P2.5  Create components/dashboard/DataTable.tsx:
      Generic table component:
      Props: columns: { key, label, render? }[], data: T[], emptyMessage, loading?
      - Header: surface bg, 12px/600/uppercase
      - Rows: 52px height, hover surface, border-bottom
      - Empty state: centered icon + message + optional CTA slot
      - Loading: skeleton rows (3 rows, animated pulse)

P2.6  Create app/(dashboard)/layout.tsx:
      - Server component — getServerSession() → redirect /login if null
      - Flex layout: Sidebar (hidden md:flex) + main content (flex-1)
      - Topbar at top of content area
      - Pass shopData (slug, name) to Sidebar via context or props

P2.7  Create app/(dashboard)/page.tsx — Dashboard Home:
      - Fetch last 30 days: totalRevenue, totalOrders, avgOrderValue, conversionRate
      - 4 MetricCards in grid
      - Placeholder sections for charts (Phase 10 fills these)
      - Recent orders: last 5 rows using DataTable
      - "AI Insights" card with green left border — shows loading state (Phase 9 fills it)

P2.8  Commit: git add -A && git commit -m "feat(phase2): dashboard shell + layout + metrics"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 3 — PRODUCT MANAGEMENT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[HAIKU] CRUD + file upload — standard patterns

P3.1  Create app/api/upload/route.ts:
      POST multipart/form-data → extract file → validate (images only, max 5MB)
      → upload to R2 via uploadToR2() with key: shops/{shopId}/products/{nanoid()}.{ext}
      → return { url: string }

P3.2  Create app/api/categories/route.ts:
      GET: all categories for shopId from session
      POST: create category (name, nameAr, slug, imageUrl, sortOrder)

P3.3  Create app/api/products/route.ts:
      GET: paginated products for shopId — query params: page, limit, category, search, published
           Always filter by shopId. Return: { products, total, page, totalPages }
      POST: validate CreateProductSchema → prisma.product.create
            Handle variants as nested create in same transaction

P3.4  Create app/api/products/[id]/route.ts:
      GET: single product — verify product.shopId === session.shopId
      PUT: update product — same ownership check
      DELETE: soft-publish toggle OR hard delete + deleteFromR2() for each image

P3.5  Create app/(dashboard)/products/page.tsx:
      - PageHeader: "Products" + "+ Add Product" button → /products/new
      - Filter bar: search input (debounced), category select, published/draft toggle
      - DataTable with columns: image thumb (40px), name, category, price (formatted), stock badge, status toggle, actions (edit/delete)
      - Stock badge: green if >10, amber if 1-10, red if 0
      - Delete: confirm dialog before API call

P3.6  Create app/(dashboard)/categories/page.tsx:
      - Simple list with + Add Category, edit, delete
      - Category form: name (EN), name (AR), sort order, image upload

P3.7  Create app/(dashboard)/products/new/page.tsx and products/[id]/edit/page.tsx:
      2-column layout (desktop): LEFT 2/3 | RIGHT 1/3

      LEFT — "Basic Info" card:
        - name (EN), nameAr (AR) side by side
        - description textarea with "✨ Generate with AI" button (calls /api/ai/describe)
        - When AI button clicked: show spinner, fill description + nameAr on response
        - Show badge "Generated by Claude Haiku" after AI fill

      LEFT — "Pricing" card:
        - price, comparePrice side by side
        - currency display (matches shop currency, read-only)
        - When comparePrice > price: show "SALE badge will appear" hint

      LEFT — "Variants" card:
        - "Add variant type" → name input + values (chip input, press Enter to add)
        - Examples shown: Size [S, M, L, XL] | Color [Red, Blue, Black]
        - Add/remove variant types and values

      RIGHT — "Images" card:
        - Drag-drop zone: click or drag to upload, max 5 images
        - Image preview grid: show thumbnails, drag to reorder, X to remove
        - Progress bar during upload to R2
        - First image = cover image (labeled)

      RIGHT — "Category" card:
        - Select dropdown + "+ New category" link

      RIGHT — "Inventory" card:
        - Stock count number input
        - "Track stock" toggle
        - Low stock threshold (default 5)

      RIGHT — "Publish" card:
        - Featured toggle
        - Published toggle (default off for new, on for existing)
        - Save button (primary, full-width) + "Save as Draft" ghost button

P3.8  Commit: git add -A && git commit -m "feat(phase3): product CRUD + image upload + AI description"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 4 — SHOP STOREFRONT (PUBLIC)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[SONNET] Complex ISR + Zustand + WA checkout logic

P4.1  Create app/shop/[slug]/layout.tsx:
      - Read shop from DB by slug (if not found → 404)
      - Set <html lang={shop.locale === 'AR' ? 'ar' : 'en'} dir={rtl ? 'rtl' : 'ltr'}>
      - PWA meta: theme-color (#25D366), viewport, manifest link
      - OG tags: shop name, logo, tagline
      - JSON-LD: LocalBusiness schema with shop data

P4.2  Create public/manifest.json:
      name: "DdotsShop", short_name: "DdotsShop",
      theme_color: "#25D366", background_color: "#ffffff",
      display: "standalone", start_url: "/"

P4.3  Create app/shop/[slug]/page.tsx — ISR (export const revalidate = 60):
      Server component: fetch shop + published products + categories by slug
      Pass to client components via props
      Log page view async (don't await): fetch('/api/analytics/view', {...})
      404 if shop not found or isPublished === false

P4.4  Create components/shop/ShopHeader.tsx:
      - Sticky top-0, z-50
      - Background: shop.theme.primaryColor (default #0a5c36) or CSS variable
      - Left: shop logo (32px circle, white border) + shop name (white, 14px/700)
      - Right: search icon button + cart icon button with item count badge (wa-green circle)
      - Verified badge: small "✓ Verified" chip below name if shop.isVerified

P4.5  Create components/shop/CategoryFilter.tsx:
      - Horizontally scrollable, no scrollbar visible (overflow-x: auto, scrollbar-width: none)
      - Tabs: "All" + category names
      - Active: wa-green text + 2px bottom border
      - Inactive: text-2, hover text-1
      - Padding: px-4 py-3, gap-2

P4.6  Create components/shop/ProductGrid.tsx:
      Props: products (filtered by active category), currency
      - grid grid-cols-2 md:grid-cols-3 gap-3 p-3
      - Maps to ProductCard components
      - Empty state: centered "No products found" with emoji

P4.7  Create components/shop/ProductCard.tsx:
      - bg-white border rounded-xl overflow-hidden hover:-translate-y-0.5 transition-transform
      - Image: aspect-square object-cover w-full, Next/Image with R2 domain allowed
      - SALE badge: if product.comparePrice > product.price
      - Name: 13px/600, 2 lines max (line-clamp-2)
      - Price: 15px/700 wa-green
      - Compare price: 12px line-through text-3 (if exists)
      - Stock badge: "Out of Stock" gray overlay if stock === 0 and trackStock
      - "+ Cart" button: full-width, wa-green, 12px/600, rounded-md
        → if out of stock: disabled, bg-gray-200, "Out of Stock"
        → onClick: addToCart(product) from Zustand store, show toast "Added to cart"
      - Click on image/name: open ProductModal

P4.8  Create lib/stores/cart.store.ts — Zustand:
      CartItem: { productId, name, variant, price, qty, image }
      State: items[], shopSlug, shopName, shopPhone, currency
      Actions: addToCart, removeFromCart, updateQty, clearCart, setShopInfo
      Persist to localStorage with key "ddotsshop-cart-{slug}"

P4.9  Create components/shop/ProductModal.tsx:
      - Full-screen on mobile, centered max-w-lg on desktop
      - RadixUI Dialog
      - Gallery: main image (300px) + thumbnail strip (scroll if >3)
      - Name: H2, Price: wa-green 20px/700, Compare: line-through gray
      - Description: prose, max-h-32 with "Show more" expand
      - Variants: button group for each variant type
        selected variant button: wa-green bg, white text
        unselected: border, gray
      - Qty spinner: − [count] + buttons, min 1, max stock
      - Stock status: "X items left" if stock < 10
      - "Add to Cart" button: full-width, wa-green, 48px tall
      - Close: X button top-right

P4.10 Create components/shop/CartDrawer.tsx:
      - RadixUI Dialog in sheet mode (right side, full height)
      - Width: min(380px, 100vw)
      - Header: "Your Cart" + X button
      - Empty state: shopping bag icon + "Your cart is empty" + "Continue Shopping" button
      - Item list: CartItem components
      - Subtotal: right-aligned, 16px/700
      - Discount code input: text input + "Apply" button → POST /api/discount-codes/validate
      - Discount display: show applied discount amount in green
      - "Order on WhatsApp →" button: full-width, wa-green, 52px, 16px/700
        → onClick: buildWhatsAppMessage() + window.open(waLink, '_blank')
        → also: POST /api/orders (creates PENDING order in DB, queues abandoned cart recovery)

P4.11 Create components/shop/CheckoutButton.tsx:
      Builds WA message from cart state using WHATSAPP ORDER MESSAGE FORMAT
      Opens wa.me/+{shopPhone}?text={encoded message}
      On click: also call createPendingOrder() → queue abandoned cart BullMQ job (30min)

P4.12 Create components/shop/ChatWidget.tsx:
      - Floating button: fixed bottom-4 right-4, 56px circle, wa-green, chat icon (lucide)
      - Unread count badge: red circle top-right of button
      - Chat panel: 320×420px, white, rounded-2xl, shadow-xl
        Header: green, "DdotsShop AI" + green dot + X
        Messages: flex-col, user messages right (green bubble), bot left (gray bubble)
        Input: text input + send button
      - On send: POST /api/ai/chat (SSE stream) → stream response tokens into bot bubble

P4.13 Commit: git add -A && git commit -m "feat(phase4): shop storefront + cart + WA checkout + PWA + chat widget"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 5 — PAYMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[SONNET] Payment flows require careful error handling and security

P5.1  Create lib/telr.ts:
      createTelrOrder(params: { amount, currency, orderId, customerName, returnUrl, cancelUrl }):
        → POST to https://secure.telr.com/gateway/order.json
        → return { paymentUrl: string, telrRef: string }
      verifyTelrHMAC(payload: string, signature: string): boolean
        → HMAC-SHA256 verification using TELR_AUTH_KEY

P5.2  Create lib/stripe.ts:
      createStripeSession(params: { amount, currency, orderId, successUrl, cancelUrl }):
        → stripe.checkout.sessions.create(...)
        → return { sessionUrl: string }

P5.3  Create app/shop/[slug]/checkout/page.tsx:
      - Form: customer name (required), phone (required, with country code +971 default), address (optional), notes (optional)
      - Order summary: itemized cart, subtotal, discount, total
      - Payment method selection:
        • "Pay via Telr" (card/Apple Pay/SamsungPay) — for shops with Telr configured
        • "Pay via QR" — shows shop's UPI QR image with payment amount
        • "Cash on Delivery" — if shop has this enabled
      - "Place Order" button → POST /api/payments/telr/create → redirect to Telr

P5.4  Create app/api/payments/telr/create/route.ts:
      POST:
        1. Validate cart + customer data from body
        2. Check all products exist and have stock (CRITICAL — recheck at payment time)
        3. Create Order in PENDING state + OrderItems in Prisma transaction
        4. Call createTelrOrder() → get paymentUrl
        5. Return { paymentUrl, orderId }

P5.5  Create app/api/webhooks/telr/route.ts:
      POST:
        1. verifyTelrHMAC() — return 400 if invalid
        2. Parse status: CAPTURED / DECLINED / CANCELLED
        3. On CAPTURED:
           - prisma.order.update paymentStatus=PAID, status=CONFIRMED
           - Decrement stock for each OrderItem (Prisma transaction)
           - Upsert Customer record (create or update totalOrders, totalSpent)
           - Cancel abandoned cart BullMQ job for this orderId
           - Queue WA order confirmation (seller + customer)
           - Queue PDF invoice generation
        4. On DECLINED/CANCELLED: update order status=CANCELLED
        5. Return 200 always (Telr retries on non-200)

P5.6  Create app/api/webhooks/stripe/route.ts (same pattern, Stripe events)

P5.7  Create app/shop/[slug]/order/[id]/page.tsx — Order Confirmation:
      - Fetch order by ID (verify it belongs to this shop)
      - Show: "✅ Order Confirmed!" + order ID + items + total
      - WA button: "Chat with {shopName} on WhatsApp" → opens wa.me link
      - "Continue Shopping" → back to shop
      - OG/meta: no index (private order page)

P5.8  Commit: git add -A && git commit -m "feat(phase5): Telr + Stripe payments + order creation + webhooks"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 6 — BULLMQ WORKERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[SONNET] Worker reliability and error handling is critical

P6.1  Create workers/whatsapp.worker.ts:
      Worker listening to "ddotsshop-messages" queue:

      Job: "order-confirmation"
        data: { sellerPhone, buyerPhone?, message, orderId }
        → sendWhatsAppMessage(sellerPhone, message)
        → if buyerPhone: sendWhatsAppMessage(buyerPhone, "Your order #{orderId} is confirmed! ✅\n...")
        → prisma.order.update({ waMessageSent: true })
        Retry: 3 attempts, exponential backoff 5s

      Job: "abandoned-cart"
        data: { buyerPhone, shopName, shopSlug, cartValue, currency, orderId }
        delay: 30 minutes
        jobId: "cart-{orderId}" (idempotent)
        → Check order still PENDING in DB (skip if already paid)
        → sendWhatsAppMessage(buyerPhone, buildAbandonedCartMessage(data))
        Retry: 1 attempt only

      Job: "low-stock-alert"
        data: { sellerPhone, shopName, productName, stock }
        → sendWhatsAppMessage(sellerPhone, buildLowStockMessage(data))
        Retry: 2 attempts

      Job: "broadcast-message"
        data: { phone, message, broadcastId }
        → sendWhatsAppMessage(phone, message)
        → on success: prisma.broadcast.update({ sentCount: { increment: 1 } })
        → on fail: prisma.broadcast.update({ failedCount: { increment: 1 } })
        Concurrency: 1 (rate limit — 1 msg/sec to avoid Twilio limits)

P6.2  Create workers/invoice.worker.ts:
      Job: "generate-invoice"
        data: { orderId, shopName, shopAddress? }
        → Fetch order + items + customer from DB
        → generateInvoicePDF(order) from lib/invoice.ts
        → Upload PDF to R2: shops/{shopId}/invoices/order-{orderId}.pdf
        → prisma.order.update({ invoiceUrl: r2Url })

P6.3  Create lib/invoice.ts — generateInvoicePDF():
      Use pdfkit to create a clean A4 invoice PDF:
        Header: DdotsShop logo text + shop name + invoice number + date
        Bill To: customer name + phone
        Items table: product name, variant, qty, unit price, total
        Totals: subtotal, discount (if any), total
        Footer: "Thank you for your order" + ddotsshop.com
      Return Buffer

P6.4  Create workers/index.ts:
      Import and start all workers:
        whatsappWorker, invoiceWorker
      Handle SIGTERM gracefully: await worker.close() for each
      Log startup: console.log('[Workers] All workers started')

P6.5  Commit: git add -A && git commit -m "feat(phase6): BullMQ workers — WA automation + PDF invoice"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 7 — ORDER MANAGEMENT DASHBOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[HAIKU] Standard dashboard CRUD — straightforward

P7.1  Create app/api/orders/route.ts:
      GET: paginated orders for session shopId
           query params: page, limit, status, from, to, search (customer name/phone)
           return: { orders, total, page, totalPages, stats: { totalRevenue } }

P7.2  Create app/api/orders/[id]/route.ts:
      GET: single order with items + customer — verify shopId ownership
      PATCH: update status only — trigger WA update to customer if phone exists

P7.3  Create app/api/orders/[id]/invoice/route.ts:
      GET: if invoiceUrl exists → redirect to R2 URL
           else → generateInvoicePDF() on demand → stream as PDF response

P7.4  Create app/(dashboard)/orders/page.tsx:
      - PageHeader: "Orders" + export button (CSV, future)
      - Status tabs: All | Pending | Confirmed | Processing | Shipped | Delivered | Cancelled
      - Date range picker: 7d / 30d / 90d / custom (shadcn Calendar)
      - DataTable columns: #ID (monospace) | Customer | Items count | Total | Status | Date | Actions
      - Status: inline Select dropdown per row (onChange → PATCH /api/orders/[id])
      - Actions: View (eye icon) + Invoice (download icon)
      - Click row → navigate to /orders/[id]
      - Pagination: prev/next + page number

P7.5  Create app/(dashboard)/orders/[id]/page.tsx:
      - Back button → /orders
      - Order header: #ID | Date | Status badge | Payment status badge
      - Items table: image + name + variant + qty + unit price + line total
      - Order totals: subtotal, discount, total
      - Customer card: name, phone (WA link), address, notes
      - Payment info: method, reference, paid at
      - Actions: Update Status select | Download Invoice button | Send WA Update button

P7.6  Commit: git add -A && git commit -m "feat(phase7): order management dashboard"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 8 — CUSTOMER CRM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[HAIKU] Standard list/detail — straightforward

P8.1  Create app/api/customers/route.ts:
      GET: paginated customers for shopId — search by name/phone
           return: { customers, total } with totalOrders + totalSpent

P8.2  Create app/api/customers/[id]/route.ts:
      GET: customer + all their orders for this shop
      PATCH: update tags, notes

P8.3  Create app/(dashboard)/customers/page.tsx:
      - PageHeader: "Customers"
      - Search input (debounced)
      - DataTable: avatar initial | name | phone (WA link icon) | orders | spent | last order | tags | view
      - Tags: colored pill badges (VIP=gold, Wholesale=blue, custom)
      - Click row → /customers/[id]

P8.4  Create app/(dashboard)/customers/[id]/page.tsx:
      - Customer header: avatar (initials circle) + name + phone + join date
      - Stats row: Total Orders | Total Spent | AOV | Last Order
      - Tags editor: click to add/remove tags, type to create new
      - Notes textarea: auto-save on blur
      - Order history: compact table of all orders (date, total, status)

P8.5  Auto-upsert Customer on order completion (already handled in Telr webhook):
      prisma.customer.upsert({
        where: { shopId_phone: { shopId, phone: customerPhone } },
        create: { shopId, name, phone, totalOrders: 1, totalSpent: total, lastOrderAt: now },
        update: { totalOrders: { increment: 1 }, totalSpent: { increment: total }, lastOrderAt: now, name: name || undefined }
      })

P8.6  Commit: git add -A && git commit -m "feat(phase8): customer CRM"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 9 — AI FEATURES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[SONNET] AI route handlers need careful error handling + quota logic

P9.1  Create app/api/ai/describe/route.ts:
      POST body: { productName, category?, price, currency, variants? }
      1. checkAIQuota(tenantId, plan, HAIKU) → 429 if exceeded
      2. pickModel('describe') → HAIKU
      3. Call Anthropic: prompt = "Write a 2-3 sentence product description for UAE e-commerce.
         Product: {name}. Category: {category}. Price: {currency} {price}.
         Also write the Arabic translation.
         Respond ONLY with valid JSON: {\"description\": \"...\", \"descriptionAr\": \"...\"}"
      4. Parse JSON response, handle parse errors gracefully
      5. logUsage() to AIUsageLog
      6. Return { description, descriptionAr }

P9.2  Create app/api/ai/search/route.ts:
      POST body: { query, shopId }
      1. Fetch all published products for shopId (id, name, description, category)
      2. pickModel('search') → HAIKU
      3. Prompt: "Customer searched: '{query}'. Return IDs of matching products.
         Products: {JSON}. Return JSON array of IDs only: [\"id1\", \"id2\"]"
      4. Return matched products in order

P9.3  Create app/api/ai/insights/route.ts:
      GET (dashboard only — require session)
      1. Fetch last 30 days aggregate from DB:
         - Daily revenue + order counts
         - Top 5 products by revenue
         - Repeat customer percentage
      2. checkAIQuota → if STARTER plan: return { insights: null, reason: 'upgrade' }
      3. pickModel('insights') → SONNET
      4. Call Anthropic with aggregated data
      5. Return { insights: string[] } (4-5 bullets)
      Cache in Redis with key "insights:{shopId}" TTL 3600 (refresh every hour)

P9.4  Create app/api/ai/chat/route.ts — SSE streaming:
      POST body: { message, shopSlug }
      1. Fetch shop + first 20 products by shopSlug (no auth needed — public)
      2. pickModel('chatbot') → HAIKU
      3. Stream via anthropic.messages.stream():
         system: "You are a shopping assistant for {shopName}.
                  Answer questions about products concisely.
                  Always mention WhatsApp for ordering.
                  Products: {JSON.stringify(products)}"
         message: customer's question
      4. Pipe stream as SSE: data: {token}\n\n
      5. On stream end: logUsage() (estimate tokens if needed)
      Response headers: Content-Type: text/event-stream, Cache-Control: no-cache

P9.5  Wire ChatWidget.tsx (Phase 4) to SSE endpoint:
      - EventSource('/api/ai/chat', { method: POST }) OR
      - fetch with ReadableStream (POST with SSE is not standard EventSource)
      - Use fetch + ReadableStream.getReader() to consume SSE tokens
      - Append each token to current bot message bubble in real-time

P9.6  Wire AI Insights card in dashboard (Phase 2 placeholder):
      - GET /api/ai/insights on dashboard load
      - Show skeleton while loading
      - Show bullets with sparkles icon
      - "Refresh" button (re-fetches, invalidates Redis cache)
      - If STARTER: show "Upgrade to Growth for AI insights" card

P9.7  Commit: git add -A && git commit -m "feat(phase9): Claude AI — describe, search, insights, chat SSE"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 10 — ANALYTICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[HAIKU] Standard charting + analytics queries

P10.1 Create app/api/analytics/view/route.ts:
      POST body: { shopId, path, referrer? }
      - Extract device from User-Agent header (mobile/desktop/tablet)
      - Extract country from CF-IPCountry header (Cloudflare) or skip
      - prisma.pageView.create({ shopId, path, device, country, referrer })
      - Return 200 immediately — this must be fire-and-forget fast

P10.2 Create analytics query functions in lib/analytics.ts:
      getRevenueByDay(shopId, days): { date, revenue, orders }[]
      getTopProducts(shopId, days, limit): { productId, name, sales, revenue }[]
      getDeviceBreakdown(shopId, days): { device, count, percent }[]
      getConversionRate(shopId, days): number (orders / pageViews * 100)
      getKPIs(shopId, days): { revenue, orders, aov, conversionRate, change* }

P10.3 Create app/(dashboard)/analytics/page.tsx:
      - PageHeader: "Analytics"
      - Date toggle: 7d | 30d | 90d (default 30d) — client-side state, re-fetches on change

      ROW 1 — 5 KPI Cards:
        Revenue | Orders | AOV | Page Views | Conversion Rate
        Each with % change vs previous period

      ROW 2 — Charts (recharts, responsive):
        LEFT: LineChart — Revenue by day (wa-green line, tooltip, x=date y=AED)
        RIGHT: BarChart — Orders by day (wa-green bars)

      ROW 3:
        LEFT: BarChart horizontal — Top 5 Products by revenue
        RIGHT: PieChart — Device breakdown (mobile=green, desktop=blue, tablet=gray)

      ROW 4: AI Insights card (already wired from Phase 9)

P10.4 Commit: git add -A && git commit -m "feat(phase10): analytics dashboard + recharts + page view tracking"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 11 — WHATSAPP BROADCASTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[HAIKU] Standard CRUD + queue dispatch

P11.1 Create app/api/broadcasts/route.ts:
      GET: list broadcasts for shopId, paginated
      POST: create broadcast (name, message, mediaUrl?, scheduledAt?)
            → validate: PRO/AGENCY plan only — return 403 for lower plans

P11.2 Create app/api/broadcasts/[id]/send/route.ts:
      POST:
        1. Fetch broadcast + verify ownership
        2. Fetch all customers for shopId (phone list)
        3. Update broadcast: status=SENDING, targetCount=customers.length
        4. Queue one BullMQ job per customer with 1-second delay between jobs:
           for (let i = 0; i < customers.length; i++) {
             await waQueue.add('broadcast-message',
               { phone: customers[i].phone, message, broadcastId },
               { delay: i * 1100 }) // 1.1s gap = safe Twilio rate limit
           }
        5. Return { queued: count }

P11.3 Create app/(dashboard)/whatsapp/page.tsx:
      TABS: Broadcasts | Settings (using shadcn Tabs)

      BROADCASTS TAB:
        - "+ New Broadcast" button
        - DataTable: name | target count | sent | failed | status badge | scheduled/sent date | actions
        - Status badges: DRAFT=gray, SCHEDULED=blue, SENDING=amber animated, SENT=green, FAILED=red
        - Actions: Send now (play icon) | Edit (pencil) | Delete

      SETTINGS TAB:
        - WA Business Number: display read-only from shop.whatsappNumber
        - WABA Status: shows "Connected" (green dot) or "Not connected" (red) based on TWILIO_ACCOUNT_SID presence
        - Message Templates: list of approved Twilio templates (future — stub for now)

P11.4 Create app/(dashboard)/whatsapp/new/page.tsx:
      - Back button
      - "Campaign name" input
      - Message textarea (max 1000 chars, char counter)
      - Media upload: optional image (shown in WA preview)
      - Target filter: All customers | Tagged: [tag selector] (shows count)
      - Schedule: "Send now" radio | "Schedule for later" (date-time picker)
      - Live Preview: right side panel shows how WA message will look
        (dark green speech bubble, sender name, timestamp, read ticks)
      - Footer: "Send to {N} customers" (primary) | "Save as Draft" (ghost)

P11.5 Commit: git add -A && git commit -m "feat(phase11): WhatsApp broadcast campaigns"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PHASE 12 — SETTINGS + BILLING + LOCALIZATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[HAIKU] Settings CRUD + i18n setup

P12.1 Create app/(dashboard)/settings/page.tsx with shadcn Tabs:

      GENERAL TAB:
        - Logo upload (circle preview, 128px, R2 upload)
        - Cover image upload (banner preview, 320x80px)
        - Shop name, tagline, WhatsApp number (with flag + country code)
        - UPI ID text input + UPI QR image upload
        - Currency select (AED/USD/INR/SAR/QAR)
        - Language toggle (EN / AR)
        - Save button → PATCH /api/shop

      APPEARANCE TAB:
        - 5 theme presets as clickable color swatches with shop name label:
          Forest Green (#0a5c36) | Ocean Blue (#1e40af) | Rose (#be185d) | Midnight (#1e1b4b) | Sand (#92400e)
        - Selected: ring-2 ring-wa-green ring-offset-2
        - Phone mockup preview: updates header color in real-time as user clicks presets
        - Save button

      PAYMENTS TAB:
        - Telr section: Store ID + Auth Key inputs + "Test Connection" button
        - Stripe section: Publishable Key + Secret Key inputs
        - UPI section: UPI ID + QR image (same as General, synced)
        - Cash on Delivery: toggle (enable/disable for this shop)

      NOTIFICATIONS TAB:
        - New order WA notification: toggle (default on)
        - Abandoned cart recovery: toggle (default on)
        - Low stock alerts: toggle (default on)
        - Low stock threshold: number input (default 5)

      DANGER ZONE TAB:
        - "Delete Shop" button (red outline)
        - Opens confirm dialog: type shop slug to confirm
        - On confirm: DELETE all products, orders, customers, broadcasts → delete shop

P12.2 Create app/(dashboard)/settings/billing/page.tsx:
      - Current plan badge (STARTER/GROWTH/PRO/AGENCY)
      - Plan features checklist (what's included, what requires upgrade)
      - Upgrade CTA buttons for each tier
      - AI Usage this month: progress bar (Haiku calls / limit, Sonnet calls / limit)
      - Billing history table: date | amount | status | invoice link

P12.3 Create app/api/shop/route.ts PATCH handler:
      - Validate with Zod
      - Only update fields that are provided (partial update)
      - For locale change: revalidatePath('/shop/[slug]') to bust ISR cache

P12.4 Create messages/en.json — English strings for shop storefront:
      {
        "shop.addToCart": "Add to Cart",
        "shop.outOfStock": "Out of Stock",
        "shop.orderOnWhatsApp": "Order on WhatsApp",
        "shop.cart": "Cart",
        "shop.emptyCart": "Your cart is empty",
        "shop.total": "Total",
        "shop.searchPlaceholder": "Search products...",
        "shop.allCategories": "All",
        "shop.saleLabel": "SALE",
        "shop.verifiedBadge": "✓ Verified",
        "chat.placeholder": "Ask about our products...",
        "chat.title": "DdotsShop AI"
      }

P12.5 Create messages/ar.json — Arabic translations:
      {
        "shop.addToCart": "أضف للسلة",
        "shop.outOfStock": "نفد المخزون",
        "shop.orderOnWhatsApp": "اطلب عبر واتساب",
        "shop.cart": "السلة",
        "shop.emptyCart": "سلتك فارغة",
        "shop.total": "الإجمالي",
        "shop.searchPlaceholder": "ابحث عن المنتجات...",
        "shop.allCategories": "الكل",
        "shop.saleLabel": "تخفيض",
        "shop.verifiedBadge": "✓ موثّق",
        "chat.placeholder": "اسأل عن منتجاتنا...",
        "chat.title": "مساعد DdotsShop"
      }

P12.6 Configure next-intl in next.config.ts:
      Pass locale from shop.locale ('en' or 'ar') to shop pages
      Apply dir="rtl" on Arabic pages — all Tailwind classes must work in RTL

P12.7 Create app/api/discount-codes/route.ts:
      GET: list discount codes for shopId
      POST: create discount code (validate CreateDiscountSchema)

P12.8 Create app/api/discount-codes/validate/route.ts:
      POST body: { code, shopId, orderTotal }
      → Find code by shopId + code (case-insensitive)
      → Validate: isActive, not expired, usedCount < maxUses, orderTotal >= minOrder
      → Return { valid, discountAmount, type, code }

P12.9 Final quality pass:
      - Run: npm run build
      - Fix ALL TypeScript errors — zero tolerance, fix every one
      - Run: npm run lint — fix all ESLint errors
      - Verify: all API routes have error handling (try/catch → NextResponse with status)
      - Verify: all DB queries filter by shopId or tenantId
      - Verify: .env.local is in .gitignore (CRITICAL — never commit secrets)

P12.10 Create final GETTING_STARTED.md:
       Section 1: Local development (npm run dev + npx tsx workers/index.ts + Redis)
       Section 2: Environment variables needed for go-live (real values required)
       Section 3: VPS deployment (GitHub Actions workflow)
       Section 4: Post-deploy checklist

P12.11 Final commit:
       git add -A && git commit -m "feat(phase12): settings + billing + i18n + discounts — COMPLETE BUILD"
       git push origin main

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEPLOY PIPELINE (already exists at .github/workflows/deploy.yml)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

VPS: 194.164.151.202
SSH: ConnectTimeout=10 -o ConnectionAttempts=3 (always include retry)
Commands on VPS:
  cd /var/www/ddotsshop
  git pull origin main
  npm ci --production
  npx prisma migrate deploy
  pm2 restart ddotsshop || pm2 start npm --name ddotsshop -- start
  pm2 save

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHEN COMPLETE — FINAL OUTPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

After Phase 12 commit, output exactly this and nothing else:

BUILD COMPLETE
Phases: 0–12 ✅
Tasks completed: [N]/[total]
Blockers: [N] (see BLOCKERS.md)
Build: npm run build ✅
Lint: npm run lint ✅
Commit: [hash]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
START NOW. PHASE 0. NO QUESTIONS. NO PAUSING.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
