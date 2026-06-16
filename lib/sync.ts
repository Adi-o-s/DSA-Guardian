// Solved-set management + per-step completion. The solved set is the union of
// recent ACs (public poll), full-sync results, and manual check-offs.
import { currentUserId, getCookie, getSetting, query } from "./db";
import {
  fetchPublic,
  fetchSolvedAuthenticated,
  normalizeCookie,
  type PublicResult,
} from "./leetcode";
import { getMeta, getSheet, slugToStep } from "./data";

export type SyncResult = {
  username: string;
  counts: PublicResult["counts"];
  added: number; // new slugs recorded this sync
  fullSync: boolean;
  warning?: string;
};

// Full-sync backfills the user's entire history; those solves must NOT count as
// "solved today". We stamp them with a sentinel in the past. Recent ACs and manual
// marks carry a real timestamp, which is what "today" is measured against.
const BACKFILL_TS = 1;

async function recordSolved(
  slug: string,
  source: "recent" | "fullsync" | "manual",
  solvedAt: number
): Promise<boolean> {
  const userId = currentUserId();
  const meta = getMeta()[slug];
  const existing = await query<{ solved_at: number }>(
    "SELECT solved_at FROM solved WHERE user_id = $1 AND slug = $2",
    [userId, slug]
  );
  if (existing.length === 0) {
    await query(
      `INSERT INTO solved (user_id, slug, title, difficulty, source, solved_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, slug, meta?.title ?? slug, meta?.difficulty ?? null, source, solvedAt]
    );
    return true;
  }
  // Only dated signals (recent ACs / manual) may move solved_at forward — this is
  // how a problem that's already in the set gets recognized as "solved today".
  if (source !== "fullsync" && solvedAt > existing[0].solved_at) {
    await query(
      "UPDATE solved SET solved_at = $1 WHERE user_id = $2 AND slug = $3",
      [solvedAt, userId, slug]
    );
  }
  return false;
}

export async function getSolvedSet(): Promise<Set<string>> {
  const userId = currentUserId();
  const rows = await query<{ slug: string }>(
    "SELECT slug FROM solved WHERE user_id = $1",
    [userId]
  );
  return new Set(rows.map((r) => r.slug));
}

export async function solvedSince(epochMs: number): Promise<number> {
  const userId = currentUserId();
  const rows = await query<{ n: string }>(
    "SELECT COUNT(*) AS n FROM solved WHERE user_id = $1 AND solved_at >= $2",
    [userId, epochMs]
  );
  return Number(rows[0].n);
}

/** Count of solves since `epochMs` at a given difficulty (e.g. 'Hard'). */
export async function solvedSinceByDifficulty(
  epochMs: number,
  difficulty: string
): Promise<number> {
  const userId = currentUserId();
  const rows = await query<{ n: string }>(
    `SELECT COUNT(*) AS n FROM solved
     WHERE user_id = $1 AND solved_at >= $2 AND difficulty = $3`,
    [userId, epochMs, difficulty]
  );
  return Number(rows[0].n);
}

/** The A2Z step id of the most recently recorded solve that maps to the sheet. */
export async function lastSolvedStep(): Promise<number | null> {
  const userId = currentUserId();
  const map = slugToStep();
  const rows = await query<{ slug: string }>(
    "SELECT slug FROM solved WHERE user_id = $1 ORDER BY solved_at DESC",
    [userId]
  );
  for (const r of rows) {
    const step = map.get(r.slug);
    if (step) return step;
  }
  return null;
}

/** Next `n` unsolved LeetCode-linked problems within a step, in sheet order. */
export async function nextUnsolvedInStep(
  stepId: number,
  n: number
): Promise<{ slug: string; title: string }[]> {
  const solved = await getSolvedSet();
  const step = getSheet().steps.find((s) => s.id === stepId);
  if (!step) return [];
  const out: { slug: string; title: string }[] = [];
  for (const cat of step.categories) {
    for (const p of cat.problems) {
      if (p.slug && !solved.has(p.slug)) {
        out.push({ slug: p.slug, title: p.title });
        if (out.length >= n) return out;
      }
    }
  }
  return out;
}

export async function toggleManual(slug: string): Promise<boolean> {
  const userId = currentUserId();
  const exists = await query<{ source: string }>(
    "SELECT source FROM solved WHERE user_id = $1 AND slug = $2",
    [userId, slug]
  );
  if (exists.length > 0) {
    await query("DELETE FROM solved WHERE user_id = $1 AND slug = $2", [userId, slug]);
    return false;
  }
  await recordSolved(slug, "manual", Date.now());
  return true;
}

// Bulk upsert recent ACs in ONE round trip. New rows are inserted; existing rows
// only have solved_at moved FORWARD (so an already-known problem can register as
// "solved today"). `xmax = 0` distinguishes inserted from updated rows, letting us
// count genuinely-new slugs. Replaces a SELECT+INSERT per row (the old N+1 path).
async function bulkRecordRecent(
  items: { slug: string; ts: number }[]
): Promise<number> {
  if (items.length === 0) return 0;
  const userId = currentUserId();
  const meta = getMeta();
  const slugs = items.map((i) => i.slug);
  const titles = items.map((i) => meta[i.slug]?.title ?? i.slug);
  const diffs = items.map((i) => meta[i.slug]?.difficulty ?? null);
  const tss = items.map((i) => i.ts);
  const rows = await query<{ inserted: boolean }>(
    `INSERT INTO solved (user_id, slug, title, difficulty, source, solved_at)
     SELECT $1, s.slug, s.title, s.difficulty, 'recent', s.ts
     FROM unnest($2::text[], $3::text[], $4::text[], $5::bigint[])
            AS s(slug, title, difficulty, ts)
     ON CONFLICT (user_id, slug) DO UPDATE
       SET solved_at = GREATEST(solved.solved_at, EXCLUDED.solved_at)
     RETURNING (xmax::text = '0') AS inserted`,
    [userId, slugs, titles, diffs, tss]
  );
  return rows.filter((r) => r.inserted).length;
}

// Bulk backfill the full solved history in ONE round trip. Full-sync solves never
// modify existing rows (DO NOTHING) and are stamped in the past so they don't
// count as "solved today". RETURNING yields only the newly-inserted slugs.
async function bulkRecordFullSync(slugs: string[]): Promise<number> {
  if (slugs.length === 0) return 0;
  const userId = currentUserId();
  const meta = getMeta();
  const titles = slugs.map((s) => meta[s]?.title ?? s);
  const diffs = slugs.map((s) => meta[s]?.difficulty ?? null);
  const rows = await query<{ slug: string }>(
    `INSERT INTO solved (user_id, slug, title, difficulty, source, solved_at)
     SELECT $1, s.slug, s.title, s.difficulty, 'fullsync', $5
     FROM unnest($2::text[], $3::text[], $4::text[]) AS s(slug, title, difficulty)
     ON CONFLICT (user_id, slug) DO NOTHING
     RETURNING slug`,
    [userId, slugs, titles, diffs, BACKFILL_TS]
  );
  return rows.length;
}

/** Poll public profile (and full sync if a cookie is set) and merge new solves. */
export async function runSync(): Promise<SyncResult> {
  const username = (await getSetting("username")).trim();
  if (!username) throw new Error("Set your LeetCode username in Settings first.");

  const pub = await fetchPublic(username);
  // Recent ACs carry the real submission time → drives "solved today".
  let added = await bulkRecordRecent(pub.recent);

  let fullSync = false;
  let warning: string | undefined;
  const cookieRaw = (await getCookie()).trim();
  if (cookieRaw) {
    try {
      const items = await fetchSolvedAuthenticated(normalizeCookie(cookieRaw));
      added += await bulkRecordFullSync(items.map((it) => it.slug));
      fullSync = true;
    } catch (e) {
      warning = `Full sync failed (${(e as Error).message}). Using public data only.`;
    }
  }

  return { username: pub.username, counts: pub.counts, added, fullSync, warning };
}

export type StepProgress = {
  id: number;
  title: string;
  total: number; // LeetCode-linked problems in the step
  solved: number;
  pct: number;
  complete: boolean;
};

/** Completion is measured over the LeetCode-linked problems of each step. */
export async function stepProgress(): Promise<StepProgress[]> {
  const solved = await getSolvedSet();
  const threshold =
    parseInt((await getSetting("completionThreshold")) || "100", 10) || 100;
  const map = slugToStep();
  const totals = new Map<number, number>();
  const done = new Map<number, number>();
  for (const [slug, stepId] of map) {
    totals.set(stepId, (totals.get(stepId) ?? 0) + 1);
    if (solved.has(slug)) done.set(stepId, (done.get(stepId) ?? 0) + 1);
  }
  return getSheet().steps.map((s) => {
    const total = totals.get(s.id) ?? 0;
    const solvedN = done.get(s.id) ?? 0;
    const pct = total === 0 ? 0 : Math.round((solvedN / total) * 100);
    return {
      id: s.id,
      title: s.title,
      total,
      solved: solvedN,
      pct,
      complete: total > 0 && pct >= threshold,
    };
  });
}

export async function completedStepIds(): Promise<Set<number>> {
  return new Set(
    (await stepProgress()).filter((s) => s.complete).map((s) => s.id)
  );
}
