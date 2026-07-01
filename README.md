# Excavation OS

A standalone operations dashboard for excavation and earthworks contractors —
jobs, equipment, crew, and weekly scheduling in one view.

Phase 3 adds **authentication (Clerk)** and a **Postgres database (Prisma)**
behind the dashboard. The UI still renders without a database — server actions
fall back to the bundled demo data — but with a real database and the seed
loaded, the dashboard shows live data that matches the demo content.

## Stack

- **Next.js 14** (App Router)
- **TypeScript** (strict mode, no `any`)
- **Tailwind CSS** (dark sidebar, amber accent)
- **Clerk** authentication
- **Prisma** ORM + **PostgreSQL**
- **lucide-react** icons
- **ESLint** + **Prettier**

## Routes

| Path                      | Description                                          |
| ------------------------- | ---------------------------------------------------- |
| `/`                       | Landing page                                         |
| `/sign-in`                | Clerk sign-in (dark amber theme)                     |
| `/sign-up`                | Clerk sign-up (dark amber theme)                     |
| `/dashboard`              | Operations overview with KPI cards                   |
| `/dashboard/jobs`         | Jobs grid — status, progress, value                  |
| `/dashboard/equipment`    | Equipment / fleet list (DB-backed via server action) |
| `/dashboard/crew`         | Crew roster (DB-backed via server action)            |
| `/dashboard/schedule`     | Weekly schedule                                      |
| `/dashboard/catalog`      | Quotes/invoices overview + reusable item library     |
| `/dashboard/integrations` | OEM telematics (Komatsu, Case, Bobcat) connections   |

Everything under `/dashboard` is protected by Clerk middleware; unauthenticated
visitors are redirected to `/sign-in`. Non-GET requests under `/api/jobs`,
`/api/equipment`, `/api/crew`, `/api/catalog`, and `/api/integrations` also
require an authenticated session (401 JSON response otherwise); their GET
endpoints are public.

## Getting started

### 1. Install

```bash
npm install
```

`postinstall` runs `prisma generate` to produce the typed client.

### 2. Configure environment

Copy `.env.example` and fill in your values. Next.js reads `.env.local`; the
Prisma CLI reads `.env`:

```bash
cp .env.example .env.local   # for the app (Clerk + DATABASE_URL)
cp .env.example .env         # for Prisma CLI (DATABASE_URL)
```

**Clerk** — create an application at <https://dashboard.clerk.com>, then copy
the keys into your env files:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

**Database** — point `DATABASE_URL` at a Postgres instance:

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/excavation_os?schema=public"
```

**Telematics integrations (optional)** — only needed to connect a real OEM
account under `/dashboard/integrations`:

```
# Required for credential encryption at rest (AES-256-GCM).
ENCRYPTION_KEY="a long random secret"

# Each OEM's AEMP 2.0 base URL is dealer/account-specific — there is no
# global default. Only needed for the OEMs you actually connect.
KOMATSU_AEMP_BASE_URL="https://<your-komtrax-endpoint>"
CASE_AEMP_BASE_URL="https://<your-sitewatch-endpoint>"
BOBCAT_AEMP_BASE_URL="https://<your-machine-iq-endpoint>"
```

### 3. Set up the database

```bash
npx prisma migrate dev   # create the schema (and an initial migration)
npx prisma db seed       # load the demo data (lib/data.ts) into Postgres
```

### 4. Run

```bash
npm run dev      # http://localhost:3000
```

## Scripts

| Script               | Purpose                    |
| -------------------- | -------------------------- |
| `npm run dev`        | Start the dev server       |
| `npm run build`      | Production build           |
| `npm run start`      | Serve the production build |
| `npm run lint`       | ESLint                     |
| `npm run typecheck`  | TypeScript, no emit        |
| `npm run format`     | Format with Prettier       |
| `npm run db:migrate` | `prisma migrate dev`       |
| `npm run db:seed`    | `prisma db seed`           |
| `npm run db:studio`  | Open Prisma Studio         |

## Project structure

```
app/
  layout.tsx              Root layout, wraps app in <ClerkProvider>
  page.tsx                Landing page
  sign-in/                Clerk sign-in route
  sign-up/                Clerk sign-up route
  dashboard/              Protected dashboard (sidebar + topbar shell)
middleware.ts             Clerk middleware protecting /dashboard/*
prisma/
  schema.prisma           Database schema (User, Job, Equipment, …)
  seed.ts                 Loads demo data into the database
lib/
  prisma.ts               PrismaClient singleton
  actions/                Server actions per entity (DB calls + mock fallback)
  types.ts                Domain types
  data.ts                 Demo data (also used as fallback)
components/
  layout/                 Sidebar, topbar (with Clerk <UserButton />)
  dashboard/              Cards, charts, lists, modals
  ui/                     Card, badge, KPI card, filter bar, …
```

## Notes

- **Build without a database.** Server actions wrap their Prisma calls and
  return the bundled demo data on failure, so `next build` and local dev work
  even before a database is provisioned.
