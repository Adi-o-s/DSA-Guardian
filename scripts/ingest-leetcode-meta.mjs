// Pages through LeetCode's public GraphQL problem list and writes
// data/leetcode-meta.json : { slug: { title, difficulty, tags[], paidOnly } }.
// Run: node scripts/ingest-leetcode-meta.mjs
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const QUERY = `query problems($skip: Int!, $limit: Int!) {
  problemsetQuestionList: questionList(categorySlug: "", limit: $limit, skip: $skip, filters: {}) {
    total: totalNum
    questions: data { titleSlug title difficulty isPaidOnly topicTags { slug } }
  }
}`;

async function fetchPage(skip, limit) {
  const res = await fetch("https://leetcode.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Referer: "https://leetcode.com/problemset/all/",
      "User-Agent": "Mozilla/5.0 dsa-guardian-ingest",
    },
    body: JSON.stringify({ query: QUERY, variables: { skip, limit } }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} at skip=${skip}`);
  const json = await res.json();
  return json.data.problemsetQuestionList;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const limit = 100;
  const meta = {};
  let skip = 0;
  let total = Infinity;
  while (skip < total) {
    const page = await fetchPage(skip, limit);
    total = page.total;
    for (const q of page.questions) {
      meta[q.titleSlug] = {
        title: q.title,
        difficulty: q.difficulty, // Easy | Medium | Hard
        tags: q.topicTags.map((t) => t.slug),
        paidOnly: q.isPaidOnly,
      };
    }
    skip += limit;
    process.stdout.write(`\rFetched ${Math.min(skip, total)}/${total}`);
    await sleep(350); // be gentle
  }
  const dest = join(__dirname, "..", "data", "leetcode-meta.json");
  writeFileSync(dest, JSON.stringify(meta, null, 0));
  console.log(`\nWrote ${dest}: ${Object.keys(meta).length} problems.`);
}

main().catch((e) => {
  console.error("\nIngest failed:", e.message);
  process.exit(1);
});
