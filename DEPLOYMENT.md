# DSA Guardian — Public (multi-user) deployment

This is the **cloud copy** of DSA Guardian: multi-user, Postgres-backed, GitHub
sign-in. The original single-user local app at `../DSA Guardian` is untouched and
keeps running on `localhost:3000`. This copy runs on **port 3001** locally.

## 1. Provision a Postgres database (Neon)

1. Create a project at https://neon.tech (free tier is fine).
2. Copy the connection string (looks like `postgres://user:pass@host/db?sslmode=require`).

## 2. Create a GitHub OAuth app

1. https://github.com/settings/developers → **New OAuth App**.
2. For **local dev**:
   - Homepage URL: `http://localhost:3001`
   - Authorization callback URL: `http://localhost:3001/api/auth/callback/github`
3. Copy the **Client ID** and generate a **Client secret**.
4. (For production, create a second OAuth app — or add the Vercel URL — with the
   callback `https://<your-app>.vercel.app/api/auth/callback/github`.)

## 3. Configure environment

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:
- `DATABASE_URL` — the Neon string. (Remove `PGSSL=disable` for Neon; it needs SSL.)
- `AUTH_SECRET` — `openssl rand -base64 32`
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
4. Vercel runs `npm run db:migrate && next build` (see `vercel.json`) on deploy.

## Data isolation

Every DB query is scoped to the authenticated user via `withUser()` /
`currentUserId()` (see `lib/db.ts`). `currentUserId()` throws if no user is in
context, so a query can never run unscoped. The `user_id` column is `NOT NULL`
with a foreign key on every table.

## TODO before public launch

- Bump `next` past 14.2.21 (known CVE) and re-test.
