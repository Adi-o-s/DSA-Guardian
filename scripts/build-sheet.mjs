// Normalizes the community A2Z dataset (scripts/vendor/ultimateData.mjs) into
// data/striver-a2z.json with a clean steps -> categories -> problems shape.
// Run: node scripts/build-sheet.mjs
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import ultimateData from "./vendor/ultimateData.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

function slugFromLeetCode(url) {
  if (!url) return null;
  const m = url.match(/leetcode\.com\/problems\/([a-z0-9-]+)/i);
  return m ? m[1] : null;
}

const content = ultimateData.data.content;
let problemCount = 0;
let lcCount = 0;

const steps = content.map((step, i) => ({
  id: i + 1,
  title: step.contentHeading,
  subtitle: step.contentSubHeading ?? "",
  categories: (step.categoryList ?? []).map((cat, ci) => ({
    id: cat.categoryId ?? `${i + 1}-${ci}`,
    title: cat.categoryName,
    problems: (cat.questionList ?? []).map((q) => {
      const slug = slugFromLeetCode(q.leetCodeLink);
      problemCount++;
      if (slug) lcCount++;
      return {
        id: q.questionId,
        title: q.questionHeading,
        slug, // leetcode slug or null
        leetcode: q.leetCodeLink || null,
        gfg: q.gfgLink || null,
        yt: q.youTubeLink || null,
      };
    }),
  })),
}));

const out = {
  name: "Striver A2Z DSA Sheet",
  source: "takeuforward.org (community snapshot)",
  generatedAt: new Date().toISOString(),
  totalProblems: problemCount,
  leetcodeLinked: lcCount,
  steps,
};

const dest = join(__dirname, "..", "data", "striver-a2z.json");
writeFileSync(dest, JSON.stringify(out, null, 2));
console.log(
  `Wrote ${dest}: ${steps.length} steps, ${problemCount} problems (${lcCount} LeetCode-linked).`
);
