# Excavation OS

A standalone operations dashboard for excavation and earthworks contractors —
jobs, equipment, crew, and weekly scheduling in one view.

This is a **client-only scaffold**: all data is mocked locally in
[`lib/data.ts`](lib/data.ts) and rendered in-process. There are **no external
integrations** — no JobTread, no backend, no API keys to configure. Clone,
install, and run.

## Stack

- **Next.js 14** (App Router)
- **TypeScript** (strict mode)
- **Tailwind CSS** (dark sidebar, amber accent)
- **lucide-react** icons
- **ESLint** + **Prettier**

## Routes

| Path                   | Description                                         |
| ---------------------- | --------------------------------------------------- |
| `/`                    | Landing page                                        |
| `/dashboard`           | Operations overview with KPI cards (mock data)      |
| `/dashboard/jobs`      | Jobs table — status, progress, value                |
| `/dashboard/equipment` | Equipment / fleet list with service tracking        |
| `/dashboard/crew`      | Crew roster with roles, certifications, assignments |
| `/dashboard/schedule`  | Weekly schedule (placeholder week view)             |

## Project structure

```
app/
  layout.tsx              Root layout + metadata
  page.tsx                Landing page
  globals.css             Tailwind entrypoint + base styles
  dashboard/
    layout.tsx            Sidebar + topbar shell
    page.tsx              Overview (KPI cards)
    jobs/page.tsx         Jobs table
    equipment/page.tsx    Fleet list
    crew/page.tsx         Crew roster
    schedule/page.tsx     Week view placeholder
components/
  layout/                 Sidebar, topbar, page header
  ui/                     Card, badge, KPI card, progress bar
lib/
  types.ts                Domain types
  data.ts                 Mock data
  utils.ts                Formatting + class helpers
```

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

## Scripts

| Script                 | Purpose                    |
| ---------------------- | -------------------------- |
| `npm run dev`          | Start the dev server       |
| `npm run build`        | Production build           |
| `npm run start`        | Serve the production build |
| `npm run lint`         | ESLint                     |
| `npm run typecheck`    | TypeScript, no emit        |
| `npm run format`       | Format with Prettier       |
| `npm run format:check` | Check formatting           |
