import "server-only";
// Import a snapshot produced by scripts/export-local.mjs into the current user's
// rows. Idempotent: re-running inserts nothing new (ON CONFLICT DO NOTHING) and
// re-applies the same settings. Runs inside withUser(), so everything is scoped
// to the authenticated user.
import { currentUserId, DEFAULT_SETTINGS, query, setSetting } from "./db";

type Row = Record<string, unknown>;
export type Snapshot = {
  version?: number;
  settings?: Row[];
  solved?: Row[];
  daily?: Row[];
  recommendations?: Row[];
  upsolve?: Row[];
};

export type ImportSummary = {
  settings: number;
  solved: number;
  daily: number;
  recommendations: number;
  upsolve: number;
};

const IMPORTABLE_SETTINGS = new Set(Object.keys(DEFAULT_SETTINGS)); // excludes internal markers

export async function importSnapshot(snap: Snapshot): Promise<ImportSummary> {
  const userId = currentUserId();
  const summary: ImportSummary = {
    settings: 0,
    solved: 0,
    daily: 0,
    recommendations: 0,
    upsolve: 0,
  };

  // Settings (whitelisted keys only). setSetting encrypts the cookie at rest.
  for (const r of snap.settings ?? []) {
    const key = String(r.key ?? "");
    if (!IMPORTABLE_SETTINGS.has(key)) continue;
    await setSetting(key, String(r.value ?? ""));
    summary.settings++;
  }

  for (const r of snap.solved ?? []) {
    await query(
      `INSERT INTO solved (user_id, slug, title, difficulty, source, solved_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, slug) DO NOTHING`,
      [
        userId,
        r.slug,
        r.title ?? null,
        r.difficulty ?? null,
        r.source ?? null,
        r.solved_at ?? null,
      ]
    );
  }
  summary.solved = (snap.solved ?? []).length;

  for (const r of snap.daily ?? []) {
    await query(
      `INSERT INTO daily (user_id, lc_date, goal, completed_count, met)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, lc_date) DO NOTHING`,
      [userId, r.lc_date, r.goal ?? 2, r.completed_count ?? 0, r.met ?? 0]
    );
  }
  summary.daily = (snap.daily ?? []).length;

  for (const r of snap.recommendations ?? []) {
    await query(
      `INSERT INTO recommendations (user_id, lc_date, slug, step_id, status)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, lc_date, slug) DO NOTHING`,
      [userId, r.lc_date, r.slug, r.step_id ?? null, r.status ?? "pending"]
    );
  }
  summary.recommendations = (snap.recommendations ?? []).length;

  for (const r of snap.upsolve ?? []) {
    await query(
      `INSERT INTO upsolve (user_id, contest_slug, question_slug, attempted, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, contest_slug, question_slug) DO NOTHING`,
      [
        userId,
        r.contest_slug,
        r.question_slug,
        r.attempted ?? 1,
        r.status ?? "pending",
        r.created_at ?? null,
      ]
    );
  }
  summary.upsolve = (snap.upsolve ?? []).length;

  return summary;
}
