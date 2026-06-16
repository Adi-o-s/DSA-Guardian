# DSA Guardian — Public (multi-user) deployment

This is the **cloud copy** of DSA Guardian: multi-user, Postgres-backed, GitHub
sign-in. The original single-user local app at `../DSA Guardian` is untouched and
keeps running on `localhost:3000`. This copy runs on **port 3001** locally.

## 1. Provision a Postgres database (Neon)

1. Create a project at https://neon.tech (free tier is fine).
2. Copy the connection string (looks like `postgres://user:pass@host/db?sslmode=require`).

## 2. Create a GitHub OAuth app

1. https://github.com/settings/developers → **New OAuth App**.
2. For **local dev** (note the `/dsaguardian/api/auth` prefix — the app runs under
   `basePath: "/dsaguardian"` and auth lives at `/dsaguardian/api/auth/*`):
   - Homepage URL: `http://localhost:3001/dsaguardian`
   - Authorization callback URL: `http://localhost:3001/dsaguardian/api/auth/callback/github`
3. Copy the **Client ID** and generate a **Client secret**.
4. For **production**, create a second OAuth app (or add a second callback) with:
   - Homepage URL: `https://adityashrotriya.me/dsaguardian`
   - Authorization callback URL: `https://adityashrotriya.me/dsaguardian/api/auth/callback/github`

## 3. Configure environment

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:
- `DATABASE_URL` — the Neon string. (Remove `PGSSL=disable` for Neon; it needs SSL.)
- `AUTH_SECRET` — `openssl rand -base64 32`
- `AUTH_URL` — public **origin only**, no path (local: `http://localhost:3001`). The
  `/dsaguardian/api/auth` prefix lives in `lib/auth.ts` (`basePath`), not here.
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` — from step 2
- `ENCRYPTION_KEY` — `openssl rand -base64 32` (encrypts the LeetCode cookie at rest)

## 4. Run migrations + start

```bash
npm install
npm run db:migrate      # creates tables in Postgres
npm run dev             # http://localhost:3001
```

Sign in with GitHub, then optionally import your local history (see below).

## 5. Import your existing local data (optional)

Your local DB is read **read-only** — never modified.

```bash
node scripts/export-local.mjs "/Users/aditya/Documents/DSA Guardian/data/guardian.db"
# writes guardian-export.json
```

Then in the app go to `/onboarding` and upload `guardian-export.json`.
The import is idempotent (safe to re-run).

## 6. Deploy to Vercel

1. Push this folder to a GitHub repo.
2. Import it at https://vercel.com/new.
3. Add env vars in the Vercel project (same keys as `.env.local`, but with the
   **production** GitHub OAuth credentials and the Neon `DATABASE_URL`).
   **`AUTH_URL` must be `https://adityashrotriya.me`** (the public origin users hit
   through the portfolio rewrite) — NOT the `dsa-guardian.vercel.app` origin, or
   OAuth redirects/cookies land on the wrong domain and sign-in fails.
4. Vercel runs `npm run db:migrate && next build` (see `vercel.json`) on deploy.

### Why the portfolio rewrite + basePath needs care

The portfolio (`adityashrotriya.me`) rewrites `/dsaguardian/*` to this app on
`dsa-guardian.vercel.app`. This app runs under Next `basePath: "/dsaguardian"`,
which Next **strips** from the request before handlers run. Auth.js is configured
with `basePath: "/dsaguardian/api/auth"` (in `lib/auth.ts`) so it emits correct
public URLs, and `app/api/auth/[...nextauth]/route.ts` re-adds the stripped
`/dsaguardian` prefix so Auth.js can also parse the incoming action. Changing
either side without the other breaks GitHub sign-in.

## Data isolation

Every DB query is scoped to the authenticated user via `withUser()` /
`currentUserId()` (see `lib/db.ts`). `currentUserId()` throws if no user is in
context, so a query can never run unscoped. The `user_id` column is `NOT NULL`
with a foreign key on every table.

## TODO before public launch

- Bump `next` past 14.2.21 (known CVE) and re-test.
