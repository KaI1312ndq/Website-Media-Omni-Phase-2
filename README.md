# Media Omni — Website Phase 2

Website + internal operations hub cho **Media Omni** (UpBase Vietnam) — agency Performance Marketing đa kênh (TikTok Shop, Shopee, Meta, Google) phục vụ 100+ brands.

> 🌐 Production: [www.mediaomni.site](https://www.mediaomni.site)
> 👤 Maintainer: [Nguyễn Đức Quảng](https://nguyenducquang.website)

---

## 🧱 Tech Stack

| Layer     | Tech                                              |
| --------- | ------------------------------------------------- |
| Framework | **Next.js 14** (App Router, RSC, ISR)             |
| Language  | TypeScript                                        |
| Styling   | Tailwind CSS + global CSS                         |
| CMS       | **Sanity v3** (embedded studio at `/studio`)      |
| Database  | **Supabase** (Postgres + Auth via cookie session) |
| Charts    | Chart.js                                          |
| AI        | OpenAI (Weekly Report generation)                 |
| Hosting   | Vercel                                            |
| Analytics | Google Analytics 4 (optional)                     |

---

## 📂 Cấu trúc thư mục

```
.
├── app/                      # Next.js App Router
│   ├── (internal)/           # Route group — protected layout (sidebar + header)
│   │   ├── dashboard/
│   │   ├── admin/leads/      # CRM lead management
│   │   ├── hub/
│   │   │   ├── analytics/    # Operations analytics
│   │   │   ├── report/       # Weekly Report tool (3 steps + AI + XLSX)
│   │   │   ├── tasks/        # Task management
│   │   │   ├── scores/       # Quiz scores + matrix
│   │   │   ├── users/        # User CRUD + brand assign
│   │   │   └── sop/          # SOP & Resources
│   │   └── quiz/
│   ├── api/                  # Route handlers (auth, leads, tasks, scores, ...)
│   ├── blog/[slug]/          # Public blog
│   ├── case-studies/[slug]/  # Public case studies
│   ├── studio/[[...tool]]/   # Sanity Studio embedded
│   ├── page.tsx              # Homepage
│   ├── sitemap.ts            # Dynamic sitemap
│   ├── opengraph-image.tsx   # Dynamic OG (homepage)
│   └── globals.css
│
├── components/               # Shared React components
│   ├── HomeClient.tsx        # Homepage main composition (orchestrates sections)
│   ├── home/
│   │   ├── sections.tsx      # ServiceCard, BrandsSection, PartnersSection, FaqSection, SocialIcon
│   │   └── helpers.ts        # buildTeamCarousel, doLogin, TICKER_DEFAULT, PLACEHOLDER_TEAM
│   ├── Nav.tsx               # Public navigation
│   ├── InternalLayout.tsx    # Protected wrapper
│   ├── InternalSidebar.tsx   # Hub sidebar (collapsible)
│   ├── InternalHeader.tsx    # Hub header (notifications, profile)
│   ├── ProfileModal.tsx      # Avatar upload + password change
│   ├── LeadForm.tsx          # Public lead capture
│   ├── BlogListClient.tsx    # Blog filter/search
│   ├── CaseStudiesClient.tsx
│   └── Skeleton.tsx
│
├── lib/                      # Utilities
│   ├── auth.ts               # Client session helpers + role permissions
│   ├── session-server.ts     # Server-side cookie session (httpOnly mo_session)
│   ├── sanity.ts             # Sanity client + image URL builder
│   ├── queries.ts            # GROQ queries (blog, brands, team, settings, ...)
│   ├── supabase.ts           # Supabase client init
│   └── icons.tsx             # SVG icon library (16 icons)
│
├── sanity/                   # CMS schemas
│   ├── index.ts              # Schema registry
│   ├── siteSettings.ts       # Singleton: hero, services, FAQ, CTA, social, footer
│   ├── blogPost.ts
│   ├── caseStudy.ts
│   ├── brand.ts
│   ├── teamMember.ts
│   └── sopDoc.ts
│
├── scripts/
│   ├── seed-sanity.ts        # Seed siteSettings + brands + team + cases + SOPs
│   ├── migrate.ts            # Apply SQL migrations via psql (npm run db:migrate)
│   └── migrations/           # Supabase SQL migrations (apply in filename order)
│       ├── 00-rebuild.sql
│       ├── 01-add-plan-cols.sql
│       ├── 02-add-avatar.sql
│       └── 03-add-leads.sql
│
├── public/                   # Static assets (favicon, manifest, icons)
├── next.config.mjs           # Image domains (Sanity CDN, FB), AVIF/WebP
├── tailwind.config.ts
├── sanity.config.ts          # Studio config
└── vercel.json
```

---

## 🚀 Getting Started

### 1. Prerequisites

- Node 18+
- Supabase project (Postgres)
- Sanity project (free tier OK)

### 2. Install

```bash
npm install
cp .env.example .env.local
# fill in env values
```

### 3. Apply Supabase migrations

**Option A — CLI (requires `psql`):**

```bash
DATABASE_URL="postgres://..." npm run db:migrate
```

**Option B — Supabase Dashboard:** mở SQL Editor, chạy lần lượt từng file trong `scripts/migrations/` theo thứ tự `00-` → `03-`.

### 4. Seed Sanity (lần đầu)

```bash
npm run seed:sanity
```

Tạo: site settings, 42 brands, 12 team members, 3 case studies, 5 SOPs.

### 5. Dev

```bash
npm run dev
# http://localhost:3000
# http://localhost:3000/studio (CMS)
```

---

## 🔐 Environment Variables

| Var                              | Required | Mô tả                                                         |
| -------------------------------- | -------- | ------------------------------------------------------------- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID`  | ✅       | Sanity project ID                                             |
| `NEXT_PUBLIC_SANITY_DATASET`     | ✅       | thường là `production`                                        |
| `SANITY_API_TOKEN`               | ✅       | Editor token (read+write) — cần cho seed & revalidate         |
| `SANITY_REVALIDATE_SECRET`       | ✅       | Webhook secret cho `/api/revalidate`                          |
| `NEXT_PUBLIC_SUPABASE_URL`       | ✅       | Supabase project URL                                          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | ✅       | Anon key                                                      |
| `SUPABASE_SERVICE_ROLE_KEY`      | ✅       | Service role (server-only)                                    |
| `OPENAI_API_KEY`                 | ✅       | Cho Weekly Report AI generation                               |
| `NEXT_PUBLIC_GA_ID`              | optional | GA4 Measurement ID                                            |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | optional | Cloudflare Turnstile site key (CAPTCHA cho lead form)         |
| `TURNSTILE_SECRET_KEY`           | optional | Turnstile secret (server verify). Nếu trống → CAPTCHA bị skip |
| `INTERNAL_API_KEY`               | optional | Bảo vệ internal API endpoints                                 |
| `LOG_LEVEL`                      | optional | `debug`, `info` (default prod), `warn`, `error`               |

---

## 🧭 Routes Map

### Public

| Route                                   | Mô tả                                                                       |
| --------------------------------------- | --------------------------------------------------------------------------- |
| `/`                                     | Homepage (hero, services, team, brands, case studies, blog, FAQ, lead form) |
| `/blog`, `/blog/[slug]`                 | Blog (ISR 10 phút)                                                          |
| `/case-studies`, `/case-studies/[slug]` | Case studies CMS                                                            |
| `/studio`                               | Sanity Studio                                                               |

### Internal (cần đăng nhập)

| Route            | Quyền        | Mô tả                                     |
| ---------------- | ------------ | ----------------------------------------- |
| `/dashboard`     | mọi user     | Tổng quan cá nhân                         |
| `/quiz`          | mọi user     | Quiz Hub (D1 Benchmark, D2 Ads)           |
| `/hub/tasks`     | mọi user     | My Day / Team / Create                    |
| `/hub/scores`    | mọi user     | Charts + matrix điểm quiz                 |
| `/hub/report`    | mọi user     | Báo cáo tuần (plan + AI + XLSX + preview) |
| `/hub/analytics` | upbase/admin | Operations dashboard                      |
| `/hub/sop`       | mọi user     | SOP & tài liệu nội bộ                     |
| `/hub/users`     | admin        | User CRUD + brand assign                  |
| `/admin/leads`   | admin        | Quản lý lead + CSV export                 |

### API

`/api/auth`, `/api/leads`, `/api/tasks`, `/api/scores`, `/api/quiz`, `/api/users`, `/api/brands`, `/api/brands/assign`, `/api/dashboard`, `/api/analytics`, `/api/report`, `/api/profile/avatar`, `/api/profile/password`, `/api/revalidate`.

---

## 🗄️ Data Model

### Supabase tables

`users`, `brands`, `monthly_plans`, `weekly_reports`, `quiz_scores`, `tasks`, `leads`, `notifications`.

### Sanity schemas

`siteSettings` (singleton), `blogPost`, `brand`, `teamMember`, `caseStudy`, `sopDoc`.

---

## 📜 npm scripts

```bash
npm run dev           # local dev
npm run build         # production build
npm run start         # production server
npm run lint          # eslint
npm run seed:sanity   # seed CMS lần đầu
npm run db:migrate    # apply Supabase migrations qua psql (cần DATABASE_URL)
npm run audit:passwords  # liệt kê user còn dùng plain-text password
npm run test:e2e      # chạy Playwright e2e tests
npm run test:e2e:ui   # mở Playwright UI mode (dev)
npm run format        # Prettier toàn bộ codebase
```

---

## ✅ Tests & CI

- E2E tests: `tests/e2e/*.spec.ts` (Playwright). Run local: `npm run test:e2e` (auto-build + start). Set `PLAYWRIGHT_BASE_URL=https://www.mediaomni.site` để chạy với prod.
- CI: `.github/workflows/ci.yml` (lint + typecheck + build + e2e). Configure secrets ở GitHub repo settings: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SANITY_PROJECT_ID`, `SANITY_API_TOKEN`. E2E job chỉ chạy khi secrets set.
- Pre-commit: Husky + lint-staged tự format + lint file changed trước khi commit.
- E2E live login (optional): set `E2E_TEST_USER`, `E2E_TEST_PASS` để bật test login flow thực.

## 🩺 Health & Monitoring

- `GET /api/health` → `{ status, db, sanity, version, env, time }` (200 nếu mọi thứ ok, 503 khi degraded). Hook lên uptime monitor (BetterStack / UptimeRobot, free tier).
- Logger: `lib/logger.ts` (Pino) — JSON structured, auto-redact credential. Vercel UI parse được ra field `level`, `time`, `msg`, `ctx`.
- Sentry: `@sentry/nextjs` đã wired (sentry.client/server/edge.config.ts). Set `NEXT_PUBLIC_SENTRY_DSN` để bật.

## 🛡️ Auth model

- Cookie httpOnly `mo_session` — set bởi `/api/auth/login`, đọc bởi `lib/session-server.ts`.
- Roles: `admin`, `upbase`, `member`.
- Permissions check ở cả layout `(internal)` (server) và route handlers (server).

---

## 🚢 Deployment

- Push lên `main` → Vercel auto deploy.
- Env vars cấu hình trong **Vercel → Project → Settings → Environment Variables**.
- Sanity webhook `/api/revalidate?secret=<SANITY_REVALIDATE_SECRET>` để on-demand ISR khi publish content.

---

## 📝 Notes

- `HomeClient.tsx` (~575 lines) là composition cho homepage. Các sub-section đã tách ra `components/home/sections.tsx` và imperative helpers ở `components/home/helpers.ts`. Nếu mở rộng tiếp, tách HeroSection / ServicesSection thành file riêng theo cùng pattern.
- Image domains đã whitelist Sanity CDN + Facebook trong `next.config.mjs`. Thêm domain mới vào đó nếu dùng image source khác.
- Avatar Team Lead trên homepage hiện link tới [nguyenducquang.website](https://nguyenducquang.website) (xem `components/home/helpers.ts → buildTeamCarousel`).
