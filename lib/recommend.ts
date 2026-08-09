// Daily goal + recommendation engine: pick `goal` Hard company-bank questions
// from the user's completed Striver topics, excluding already-solved problems.
import { currentUserId, getSetting, query } from "./db";
import { getCompany, getMeta, stepTitle } from "./data";
import { bestCompletedStep } from "./topics";
import { companiesFor, frequencyFor, selectedCompanies } from "./ranking";
import { completedStepIds, getSolvedSet, stepProgress } from "./sync";

export type Recommendation = {
  slug: string;
  title: string;
  difficulty: string;
  url: string;
  stepId: number | null;
  stepTitle: string;
  companies: string[];
  frequency: number;
  status: "pending" | "done";
  fallback: boolean;
};

export type DailyRow = {
  lc_date: string;
  goal: number;
  completed_count: number;
  met: number;
};

export async function getDaily(date: string): Promise<DailyRow | null> {
  const userId = currentUserId();
  const rows = await query<DailyRow>(
    "SELECT lc_date, goal, completed_count, met FROM daily WHERE user_id = $1 AND lc_date = $2",
    [userId, date]
  );
  return rows[0] ?? null;
}

/** Returns the daily row, creating it with the default goal if it doesn't exist. */
export async function ensureDaily(date: string): Promise<DailyRow> {
  const existing = await getDaily(date);
  if (existing) return existing;
  const userId = currentUserId();
  const goal = parseInt((await getSetting("dailyGoalDefault")) || "2", 10) || 2;
  await query(
    `INSERT INTO daily (user_id, lc_date, goal, completed_count, met)
     VALUES ($1, $2, $3, 0, 0)
     ON CONFLICT (user_id, lc_date) DO NOTHING`,
    [userId, date, goal]
  );
  return { lc_date: date, goal, completed_count: 0, met: 0 };
}

export async function setGoal(date: string, goal: number): Promise<void> {
  await ensureDaily(date);
  const userId = currentUserId();
  await query("UPDATE daily SET goal = $1 WHERE user_id = $2 AND lc_date = $3", [
    goal,
    userId,
    date,
  ]);
}

type Candidate = { slug: string; stepId: number; fallback: boolean; freq: number };

/** Ordered Hard candidates from completed topics, then in-progress topics as fallback. */
async function buildCandidates(exclude: Set<string>): Promise<Candidate[]> {
  const solved = await getSolvedSet();
  const completed = await completedStepIds();
  // in-progress = touched but not complete (used only for fallback)
  const inProgress = new Set(
    (await stepProgress())
      .filter((s) => !s.complete && s.solved > 0)
      .map((s) => s.id)
  );
  const selected = await selectedCompanies();
  const meta = getMeta();

  const primary: Candidate[] = [];
  const fallback: Candidate[] = [];

  for (const slug of Object.keys(getCompany())) {
    if (exclude.has(slug) || solved.has(slug)) continue;
    const m = meta[slug];
    if (!m || m.difficulty !== "Hard" || m.paidOnly) continue;
    const freq = frequencyFor(slug, selected);
    if (selected.length && freq === 0) continue; // not asked by selected companies

    const stepDone = bestCompletedStep(m.tags, completed);
    if (stepDone !== null) {
      primary.push({ slug, stepId: stepDone, fallback: false, freq });
      continue;
    }
    const stepProg = bestCompletedStep(m.tags, inProgress);
    if (stepProg !== null) {
      fallback.push({ slug, stepId: stepProg, fallback: true, freq });
    }
  }
  primary.sort((a, b) => b.freq - a.freq);
  fallback.sort((a, b) => b.freq - a.freq);
  return [...primary, ...fallback];
}

async function enrich(
  slug: string,
  stepId: number | null,
  fallback: boolean,
  status: "pending" | "done"
): Promise<Recommendation> {
  const m = getMeta()[slug];
  const selected = await selectedCompanies();
  return {
    slug,
    title: m?.title ?? slug,
    difficulty: m?.difficulty ?? "Hard",
    url: `https://leetcode.com/problems/${slug}/`,
    stepId,
    stepTitle: stepId ? stepTitle(stepId) : "Other",
    companies: companiesFor(slug, selected).slice(0, 6),
    frequency: frequencyFor(slug, selected),
    status,
    fallback,
  };
}

/**
 * Returns today's stable recommendations, generating/topping-up to `goal` picks
 * and marking any that have since been solved as done.
 */
export async function pickDaily(date: string): Promise<Recommendation[]> {
  await ensureDaily(date);
  const userId = currentUserId();
  const target = parseInt((await getSetting("hardGoal")) || "2", 10) || 2;
  const solved = await getSolvedSet();

  // Mark stored picks done if solved.
  const stored = await query<{
    slug: string;
    step_id: number | null;
    status: string;
  }>(
    "SELECT slug, step_id, status FROM recommendations WHERE user_id = $1 AND lc_date = $2",
    [userId, date]
  );

  for (const r of stored) {
    const isDone = solved.has(r.slug);
    if (isDone && r.status !== "done") {
      await query(
        "UPDATE recommendations SET status = 'done' WHERE user_id = $1 AND lc_date = $2 AND slug = $3",
        [userId, date, r.slug]
      );
      r.status = "done";
    }
  }

  // Top up to the Hard goal with fresh candidates (don't disturb existing picks).
  if (stored.length < target) {
    const have = new Set(stored.map((r) => r.slug));
    const candidates = await buildCandidates(have);
    for (const c of candidates) {
      if (stored.length >= target) break;
      await query(
        `INSERT INTO recommendations (user_id, lc_date, slug, step_id, status)
         VALUES ($1, $2, $3, $4, 'pending')
         ON CONFLICT (user_id, lc_date, slug) DO NOTHING`,
        [userId, date, c.slug, c.stepId]
      );
      stored.push({ slug: c.slug, step_id: c.stepId, status: "pending" });
      have.add(c.slug);
    }
  }

  // Build enriched list, preserving fallback flag via candidate lookup.
  const completed = await completedStepIds();
  return Promise.all(
    stored.map((r) => {
      const m = getMeta()[r.slug];
      const isFallback =
        m && r.step_id !== null ? !completed.has(r.step_id) : false;
      return enrich(
        r.slug,
        r.step_id,
        isFallback,
        r.status === "done" ? "done" : "pending"
      );
    })
  );
}

/**
 * Shuffle today's hard recommendations: delete all pending (unsolved) picks,
 * then regenerate fresh ones via pickDaily(). Already-solved ("done") picks
 * are preserved.
 */
export async function shuffleDaily(date: string): Promise<Recommendation[]> {
  const userId = currentUserId();
  await query(
    "DELETE FROM recommendations WHERE user_id = $1 AND lc_date = $2 AND status = 'pending'",
    [userId, date]
  );
  return pickDaily(date);
}
