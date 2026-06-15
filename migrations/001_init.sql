-- DSA Guardian — multi-user Postgres schema.
-- Mirrors the original single-user SQLite schema, with a users table and a
-- user_id foreign key on every user-scoped table for hard data isolation.

CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id         BIGINT UNIQUE,
  github_username   TEXT,
  email             TEXT,
  name              TEXT,
  image             TEXT,
  leetcode_username TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Key/value per-user settings (username, goals, thresholds, encrypted cookie, ...).
CREATE TABLE IF NOT EXISTS settings (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key     TEXT NOT NULL,
  value   TEXT NOT NULL,
  PRIMARY KEY (user_id, key)
);

-- Solved set: union of recent ACs, full-sync backfill, and manual check-offs.
CREATE TABLE IF NOT EXISTS solved (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug       TEXT NOT NULL,
  title      TEXT,
  difficulty TEXT,
  source     TEXT,            -- 'recent' | 'fullsync' | 'manual'
  solved_at  BIGINT,          -- epoch ms when first recorded
  PRIMARY KEY (user_id, slug)
);
CREATE INDEX IF NOT EXISTS idx_solved_user_solved_at ON solved (user_id, solved_at);
CREATE INDEX IF NOT EXISTS idx_solved_user_difficulty ON solved (user_id, difficulty);

-- Per-day questions goal + latch of whether it was met (drives the streak).
CREATE TABLE IF NOT EXISTS daily (
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lc_date         TEXT NOT NULL,   -- YYYY-MM-DD in the LeetCode day frame
  goal            INTEGER NOT NULL,
  completed_count INTEGER NOT NULL DEFAULT 0,
  met             INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, lc_date)
);

-- Today's stable Hard recommendations.
CREATE TABLE IF NOT EXISTS recommendations (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lc_date TEXT NOT NULL,
  slug    TEXT NOT NULL,
  step_id INTEGER,
  status  TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'done'
  PRIMARY KEY (user_id, lc_date, slug)
);

-- Contest upsolve tracking.
CREATE TABLE IF NOT EXISTS upsolve (
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contest_slug  TEXT NOT NULL,
  question_slug TEXT NOT NULL,
  attempted     INTEGER NOT NULL DEFAULT 1,
  status        TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'conquered'
  created_at    BIGINT,
  PRIMARY KEY (user_id, contest_slug, question_slug)
);
