// Finds fresh practice problems that share a target problem's tags + difficulty,
// drawn entirely from the bundled meta (offline). Used by the upsolve dashboard
// to let the user rehearse a concept before re-attempting the contest problem.
import { getMeta } from "./data";
import { companiesFor, frequencyFor } from "./ranking";

export type PracticeProblem = {
  slug: string;
  title: string;
  difficulty: string;
  url: string;
  companies: string[];
  frequency: number;
  solved: boolean;
  overlap: number;
};

/**
 * Up to `limit` unsolved problems sharing >=1 tag with `tags`, ranked by
 * (tag overlap desc, then company frequency desc). Exact-difficulty matches are
 * preferred; if too few exist, adjacent-difficulty matches fill the remainder.
 */
export function similarProblems(
  targetSlug: string,
  tags: string[],
  difficulty: string,
  solved: Set<string>,
  selected: string[],
  limit = 5
): PracticeProblem[] {
  const meta = getMeta();
  const tagSet = new Set(tags);
  if (tagSet.size === 0) return [];

  type Scored = PracticeProblem & { sameDiff: boolean };
  const scored: Scored[] = [];

  for (const [slug, m] of Object.entries(meta)) {
    if (slug === targetSlug || m.paidOnly) continue;
    let overlap = 0;
    for (const t of m.tags) if (tagSet.has(t)) overlap++;
    if (overlap === 0) continue;
    scored.push({
      slug,
      title: m.title,
      difficulty: m.difficulty,
      url: `https://leetcode.com/problems/${slug}/`,
      companies: companiesFor(slug, selected).slice(0, 4),
      frequency: frequencyFor(slug, selected),
      solved: solved.has(slug),
      overlap,
      sameDiff: m.difficulty === difficulty,
    });
  }

  // Rank: exact difficulty first, then more shared tags, then more in-demand.
  // Unsolved problems surface above already-solved ones (fresh practice).
  scored.sort(
    (a, b) =>
      Number(b.sameDiff) - Number(a.sameDiff) ||
      Number(a.solved) - Number(b.solved) ||
      b.overlap - a.overlap ||
      b.frequency - a.frequency
  );

  return scored.slice(0, limit).map(({ sameDiff: _sameDiff, ...p }) => p);
}
