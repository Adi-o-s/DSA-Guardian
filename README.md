# DSA Guardian 🛡️

A multi-user web app that ties your **Striver A2Z sheet** to your **LeetCode**
profile and guards your daily DSA practice. Sign in with GitHub, track what you've
solved, see which topics you've completed, and get **Hard question** recommendations
from those topics drawn from a **company-tagged question bank**.

> This is the public, multi-user edition (Postgres + GitHub auth, deployable to
> Vercel). Every account's data is fully isolated.

## Features

- **Dashboard** — daily-goal progress, today's recommended Hard picks (with company
  tags + frequency), solved-today count, streak, and completed-topic count.
- **Hard recommendations** — Hard problems from your *completed* Striver topics,
  ranked by company-ask frequency, excluding ones you've already solved.
- **Sheet view** — full Striver A2Z (18 steps) with per-topic completion bars;
  auto-checked from LeetCode + manual toggles for non-LeetCode items.
- **Upsolve** — turn a contest into a per-question recovery plan (concept → practice → conquer).
- **Data import** — bring your history over from the local single-user edition.

## How LeetCode sync works (hybrid)

LeetCode has no official API. This app uses its public GraphQL endpoint via a
server-side proxy:

- **Public (no login):** solved counts + your last ~20 accepted submissions.
  Works out of the box — just set your username.
- **Full sync (optional):** paste your `LEETCODE_SESSION` cookie in Settings to
  backfill your entire solved history. **The cookie is encrypted at rest**
  (NaCl secretbox) and scoped to your account.

## Architecture

- **Next.js 16 (App Router) + TypeScript + Tailwind**
- **PostgreSQL** via `pg` — every table has a `NOT NULL user_id` FK
- **NextAuth v5** — GitHub OAuth, JWT sessions
- **Data isolation:** all queries run inside `withUser(userId, …)`; `currentUserId()`
  throws if no user is in scope, so a query can never run unscoped. See `lib/db.ts`.

## Run locally

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full walkthrough (Neon Postgres +
GitHub OAuth). In short:

```bash
cp .env.local.example .env.local   # fill in DATABASE_URL, AUTH_*, ENCRYPTION_KEY
npm install
npm run db:migrate                 # create tables
npm run dev                        # http://localhost:3001
```

## Scripts

```bash
npm run dev          # dev server (port 3001)
npm run build        # production build
npm run typecheck    # tsc --noEmit
npm run db:migrate   # apply migrations/*.sql
npm run data:*       # regenerate bundled datasets in data/
```

## Deploy

Push to GitHub → import on Vercel → set env vars (incl. a production GitHub OAuth
callback). `vercel.json` runs migrations on each deploy. Details in
[DEPLOYMENT.md](./DEPLOYMENT.md).

## Data sources / credits

- Striver A2Z sheet (community snapshot via `takeuforward.org`).
- LeetCode public GraphQL (difficulty + topic tags).
- Company-tagged questions: `snehasishroy/leetcode-companywise-interview-questions`.
