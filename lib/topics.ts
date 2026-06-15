// Maps each Striver A2Z step to the LeetCode topic-tag slugs that represent it.
// Used to attribute company-bank questions to a completed Striver step.

export const STEP_TAGS: Record<number, string[]> = {
  1: ["math", "simulation"], // Basics
  2: ["sorting"], // Sorting Techniques
  3: ["array", "matrix", "prefix-sum"], // Arrays
  4: ["binary-search"], // Binary Search
  5: ["string"], // Strings
  6: ["linked-list"], // Linked List
  7: ["recursion", "backtracking", "divide-and-conquer"], // Recursion
  8: ["bit-manipulation"], // Bit Manipulation
  9: ["stack", "queue", "monotonic-stack"], // Stack & Queue
  10: ["two-pointers", "sliding-window"], // Two Pointers
  11: ["heap-priority-queue"], // Heaps
  12: ["greedy"], // Greedy
  13: ["binary-tree", "tree", "depth-first-search", "breadth-first-search"], // Binary Tree
  14: ["binary-search-tree"], // BST
  15: [
    "graph",
    "union-find",
    "topological-sort",
    "shortest-path",
    "minimum-spanning-tree",
    "strongly-connected-component",
  ], // Graphs
  16: ["dynamic-programming"], // Dynamic Programming
  17: ["trie"], // Tries
  18: ["string-matching", "suffix-array", "rolling-hash"], // Strings (advanced)
};

/**
 * Given a problem's tags and the set of completed step ids, return the best
 * matching completed step (highest tag overlap), or null if none match.
 */
export function bestCompletedStep(
  tags: string[],
  completedStepIds: Set<number>
): number | null {
  const tagSet = new Set(tags);
  let best: number | null = null;
  let bestScore = 0;
  for (const stepId of completedStepIds) {
    const stepTags = STEP_TAGS[stepId] ?? [];
    let score = 0;
    for (const t of stepTags) if (tagSet.has(t)) score++;
    if (score > bestScore) {
      bestScore = score;
      best = stepId;
    }
  }
  return best;
}
