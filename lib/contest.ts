// Upsolving orchestrator: turns a contest slug into a per-question recovery plan
// (Learn the Concept -> Practice Similar -> Conquer the Contest Problem).
import { currentUserId, query } from "./db";
import { getMeta } from "./data";
import { fetchContestInfo, fetchQuestionTags } from "./leetcode";
import { getSolvedSet } from "./sync";
import { selectedCompanies } from "./ranking";
import { similarProblems, type PracticeProblem } from "./practice";
import { videosForTags, type Video } from "./videos";

export type RecoveryQuestion = {
  slug: string;
  title: string;
  difficulty: string;
  credit: number;
  tags: string[];
  tagsPending: boolean; // tags not published yet (brand-new contest)
  videos: Video[];
  practice: PracticeProblem[];
  attempted: boolean; // user-confirmed they attempted it during the contest
  conquered: boolean;
};

export type RecoveryPlan = {
  contestSlug: string;
  contestTitle: string;
  total: number; // contest questions total
  solvedCount: number; // already solved by the user
  questions: RecoveryQuestion[]; // unsolved ones only
};

type UpsolveRow = { question_slug: string; attempted: number; status: string };

async function persistedRows(
  contestSlug: string
): Promise<Map<string, UpsolveRow>> {
  const userId = currentUserId();
  const rows = await query<UpsolveRow>(
    `SELECT question_slug, attempted, status FROM upsolve
     WHERE user_id = $1 AND contest_slug = $2`,
    [userId, contestSlug]
  );
  return new Map(rows.map((r) => [r.question_slug, r]));
}

/** Resolve tags + difficulty: bundled meta first, then a live LeetCode lookup. */
async function resolveTags(
  slug: string
): Promise<{ tags: string[]; difficulty: string }> {
  const m = getMeta()[slug];
  if (m && m.tags.length > 0) return { tags: m.tags, difficulty: m.difficulty };
  try {
    const live = await fetchQuestionTags(slug);
    return {
      tags: live.tags,
      difficulty: live.difficulty ?? m?.difficulty ?? "Medium",
    };
  } catch {
    // Network/GraphQL hiccup — fall back to whatever meta we have.
    return { tags: m?.tags ?? [], difficulty: m?.difficulty ?? "Medium" };
  }
}

/**
 * Build (and persist) the recovery plan for a contest. Unsolved questions are
 * diffed against the user's solved set; questions already in the solved set are
 * counted but excluded (auto-conquered).
 */
export async function buildRecoveryPlan(
  contestSlug: string
): Promise<RecoveryPlan> {
  const userId = currentUserId();
  const info = await fetchContestInfo(contestSlug);
  const solved = await getSolvedSet();
  const selected = await selectedCompanies();
  const stored = await persistedRows(contestSlug);

  let solvedCount = 0;
  const questions: RecoveryQuestion[] = [];

  for (const q of info.questions) {
    if (solved.has(q.slug)) {
      solvedCount++;
      continue; // already done — nothing to upsolve
    }

    if (!stored.has(q.slug)) {
      await query(
        `INSERT INTO upsolve (user_id, contest_slug, question_slug, attempted, status, created_at)
         VALUES ($1, $2, $3, 1, 'pending', $4)
         ON CONFLICT (user_id, contest_slug, question_slug) DO NOTHING`,
        [userId, contestSlug, q.slug, Date.now()]
      );
    }
    const row = stored.get(q.slug);

    const { tags, difficulty } = await resolveTags(q.slug);
    const practice = similarProblems(q.slug, tags, difficulty, solved, selected);

    questions.push({
      slug: q.slug,
      title: q.title,
      difficulty,
      credit: q.credit,
      tags,
      tagsPending: tags.length === 0,
      videos: videosForTags(tags),
      practice,
      attempted: row ? row.attempted === 1 : true,
      conquered: row?.status === "conquered",
    });
  }

  // Mark already-solved-now questions conquered if they were tracked pending.
  for (const [qslug, row] of stored) {
    if (solved.has(qslug) && row.status !== "conquered") {
      await query(
        "UPDATE upsolve SET status = 'conquered' WHERE user_id = $1 AND contest_slug = $2 AND question_slug = $3",
        [userId, contestSlug, qslug]
      );
    }
  }

  return {
    contestSlug,
    contestTitle: info.title,
    total: info.questions.length,
    solvedCount,
    questions,
  };
}

/**
 * Recompute videos + practice for a manually chosen tag. Used when a brand-new
 * contest problem has no published tags and the user picks the topic themselves.
 */
export async function topicLookup(
  questionSlug: string,
  tag: string,
  difficulty: string
): Promise<{ tags: string[]; videos: Video[]; practice: PracticeProblem[] }> {
  const solved = await getSolvedSet();
  const selected = await selectedCompanies();
  return {
    tags: [tag],
    videos: videosForTags([tag]),
    practice: similarProblems(questionSlug, [tag], difficulty, solved, selected),
  };
}

/** Toggle whether the user attempted a contest question during the contest. */
export async function setAttempted(
  contestSlug: string,
  questionSlug: string,
  attempted: boolean
): Promise<void> {
  const userId = currentUserId();
  await query(
    `INSERT INTO upsolve (user_id, contest_slug, question_slug, attempted, status, created_at)
     VALUES ($1, $2, $3, $4, 'pending', $5)
     ON CONFLICT (user_id, contest_slug, question_slug)
     DO UPDATE SET attempted = EXCLUDED.attempted`,
    [userId, contestSlug, questionSlug, attempted ? 1 : 0, Date.now()]
  );
}

/** Mark a contest question conquered (or back to pending). */
export async function setConquered(
  contestSlug: string,
  questionSlug: string,
  conquered: boolean
): Promise<void> {
  const userId = currentUserId();
  await query(
    `INSERT INTO upsolve (user_id, contest_slug, question_slug, attempted, status, created_at)
     VALUES ($1, $2, $3, 1, $4, $5)
     ON CONFLICT (user_id, contest_slug, question_slug)
     DO UPDATE SET status = EXCLUDED.status`,
    [userId, contestSlug, questionSlug, conquered ? "conquered" : "pending", Date.now()]
  );
}
