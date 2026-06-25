// Analytics derived from the solved set: a daily activity heatmap and per-tag
// strength/weakness. The "weak areas" feeder maps a user's weakest LeetCode
// tags back to Striver steps and surfaces the next unsolved sheet problems —
// the mirror image of the Hard recommender, which rewards completed (strong) topics.
import { currentUserId, query } from "./db";
import { epochToLcDate, offsetMinutes } from "./day";
import { getCompany, getMeta, getSheet, stepTitle } from "./data";
import { STEP_TAGS } from "./topics";
import { getSolvedSet, nextUnsolvedInStep } from "./sync";

export type HeatCell = { date: string; count: number };

const WEEKS = 53;
const HEATMAP_DAYS = WEEKS * 7;

/**
 * Daily solve counts for the last ~53 weeks, in the user's LeetCode-day frame.
 * Full-sync backfill rows carry no real timestamp (BACKFILL_TS = 1), so they're
 * excluded — the heatmap reflects activity tracked while using the app.
 */
export async function solvedHeatmap(now = Date.now()): Promise<HeatCell[]> {
  const userId = currentUserId();
  const offsetMin = await offsetMinutes();
  const cutoff = now - (HEATMAP_DAYS + 1) * 86_400_000;
  const rows = await query<{ solved_at: string }>(
    `SELECT solved_at FROM solved
     WHERE user_id = $1 AND source <> 'fullsync' AND solved_at > $2`,
    [userId, cutoff]
  );

  const counts = new Map<string, number>();
  for (const r of rows) {
    const key = epochToLcDate(Number(r.solved_at), offsetMin);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  // Zero-filled, oldest → newest, aligned so the last cell is today.
  const out: HeatCell[] = [];
  for (let i = HEATMAP_DAYS - 1; i >= 0; i--) {
    const date = epochToLcDate(now - i * 86_400_000, offsetMin);
    out.push({ date, count: counts.get(date) ?? 0 });
  }
  return out;
}

export type TagStat = { tag: string; solved: number; total: number; pct: number };

// Tags with fewer than this many problems in the universe are too noisy to rank.
const MIN_TAG_TOTAL = 5;

/** The interview-relevant universe: company-bank ∪ Striver-sheet LC-linked slugs. */
function universeSlugs(): Set<string> {
  const set = new Set<string>(Object.keys(getCompany()));
  for (const step of getSheet().steps) {
    for (const cat of step.categories) {
      for (const p of cat.problems) if (p.slug) set.add(p.slug);
    }
  }
  return set;
}

/**
 * Per-tag mastery: of the universe problems carrying a tag, how many the user
 * has solved. Sorted weakest → strongest. Tags below MIN_TAG_TOTAL are dropped.
 */
export async function tagMastery(): Promise<TagStat[]> {
  const solved = await getSolvedSet();
  const meta = getMeta();
  const totals = new Map<string, number>();
  const done = new Map<string, number>();

  for (const slug of universeSlugs()) {
    const m = meta[slug];
    if (!m) continue;
    const isSolved = solved.has(slug);
    for (const tag of m.tags) {
      totals.set(tag, (totals.get(tag) ?? 0) + 1);
      if (isSolved) done.set(tag, (done.get(tag) ?? 0) + 1);
    }
  }

  const stats: TagStat[] = [];
  for (const [tag, total] of totals) {
    if (total < MIN_TAG_TOTAL) continue;
    const s = done.get(tag) ?? 0;
    stats.push({ tag, solved: s, total, pct: Math.round((s / total) * 100) });
  }
  stats.sort((a, b) => a.pct - b.pct || b.total - a.total);
  return stats;
}

// tag -> Striver step id (reverse of STEP_TAGS), so a weak tag points at a step.
let _tagToStep: Map<string, number> | null = null;
function tagToStep(): Map<string, number> {
  if (_tagToStep) return _tagToStep;
  const map = new Map<string, number>();
  for (const [stepId, tags] of Object.entries(STEP_TAGS)) {
    for (const t of tags) if (!map.has(t)) map.set(t, Number(stepId));
  }
  return (_tagToStep = map);
}

export type WeakPick = {
  slug: string;
  title: string;
  url: string;
  difficulty: string | null;
  tag: string;
  stepId: number;
  stepTitle: string;
};

/**
 * Next unsolved Striver problems drawn from the user's weakest tags. Each weak
 * tag is mapped to its Striver step; we then pull the next sheet problems in that
 * step (reusing nextUnsolvedInStep), dedupe across tags, and cap at `limit`.
 */
export async function weakAreaPicks(limit = 5): Promise<WeakPick[]> {
  const stats = await tagMastery();
  const meta = getMeta();
  const t2s = tagToStep();
  const seen = new Set<string>();
  const seenStep = new Set<number>();
  const out: WeakPick[] = [];

  for (const { tag } of stats) {
    if (out.length >= limit) break;
    const stepId = t2s.get(tag);
    if (stepId === undefined || seenStep.has(stepId)) continue;
    seenStep.add(stepId);
    const next = await nextUnsolvedInStep(stepId, limit);
    for (const p of next) {
      if (out.length >= limit) break;
      if (seen.has(p.slug)) continue;
      seen.add(p.slug);
      out.push({
        slug: p.slug,
        title: p.title,
        url: `https://leetcode.com/problems/${p.slug}/`,
        difficulty: meta[p.slug]?.difficulty ?? null,
        tag,
        stepId,
        stepTitle: stepTitle(stepId),
      });
    }
  }
  return out;
}
