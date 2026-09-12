# Mini Blog — The Journal

A premium editorial blog with a full admin "control room": MongoDB-backed CMS, RHF/Zod forms, base-ui primitives, and an automated trend-draft pipeline (Hacker News + Google Trends).

Public journal lives at `/blog` (light editorial theme); admin lives at `/admin` (dark).

## Tech stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS v4** with design tokens (three-layer: primitive → semantic → component)
- **MongoDB** (official driver, cached singleton) for posts
- **base-ui** for primitives (select, alerts, etc.); **react-hook-form + Zod** for forms
- **Vercel** deployment config included (`vercel.json`)

## Getting started

```bash
npm install
# create .env.local with MONGODB_URI (see table below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The journal is at `/blog`, the control room at `/admin`.

## Environment variables

| Variable            | Required | Description                                                        |
| ------------------- | -------- | ------------------------------------------------------------------ |
| `MONGODB_URI`       | yes      | MongoDB connection string                                          |
| `MONGODB_DB`        | no       | Database name (defaults to `blog`)                                 |
| `TRENDS_CRON_SECRET`| no       | Protects the trend-refresh endpoint when set                        |
| `TRENDS_COUNT`      | no       | Number of drafts to generate (default `6`, 60% HN / 40% Trends)     |
| `TRENDS_REBUILD`    | no       | Comma-separated slugs to overwrite with fresh content               |
| `BLOG_URL`          | no       | Canonical blog base URL used by the trend pipeline                  |

## Scripts

| Command            | Description                                                   |
| ------------------ | ------------------------------------------------------------- |
| `npm run dev`      | Start the dev server                                          |
| `npm run build`    | Production build                                              |
| `npm run start`    | Start the production server                                   |
| `npm run lint`     | ESLint                                                        |
| `npm run trends`   | Generate trend drafts directly against Mongo (see `scripts/trends.mjs`) |

## API routes

| Route                      | Methods        | Notes                                            |
| -------------------------- | -------------- | ------------------------------------------------ |
| `/api/posts`               | GET, POST      | List / create posts                              |
| `/api/posts/[id]`          | GET, PATCH, DELETE | Read, update (incl. status), delete          |
| `/api/trends/refresh`      | GET, POST      | Generate drafts; `?count=`, `?rebuild=<slug>`, optional `?secret=` |

The trend pipeline (`src/lib/trends.ts`) is fully data-driven — no external AI key required. It pulls trending stories, enriches them with community comments, and writes structured editorial briefs (FIELD BRIEF kicker, THE STORY / WHY IT MATTERS / WHAT THE COMMUNITY IS SAYING sections, etc.). Run it via `npm run trends`, schedule a cron against `/api/trends/refresh`, or rebuild individual posts with `?rebuild=<slug>`.