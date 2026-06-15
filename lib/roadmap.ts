// Maps the Striver A2Z steps onto the NeetCode roadmap learning flow.
// "Reorder only": the A2Z sheet is unchanged, but its steps are displayed in
// the NeetCode roadmap progression. Each entry also carries the NeetCode topic
// label the A2Z step corresponds to (for display).
import type { SheetStep } from "./data";

// A2Z step id -> position in the NeetCode roadmap flow + the roadmap topic label.
export const NEETCODE_FLOW: { stepId: number; topic: string }[] = [
  { stepId: 3, topic: "Arrays & Hashing" },
  { stepId: 10, topic: "Two Pointers / Sliding Window" },
  { stepId: 9, topic: "Stack" },
  { stepId: 4, topic: "Binary Search" },
  { stepId: 6, topic: "Linked List" },
  { stepId: 13, topic: "Trees" },
  { stepId: 14, topic: "Binary Search Trees" },
  { stepId: 17, topic: "Tries" },
  { stepId: 11, topic: "Heap / Priority Queue" },
  { stepId: 7, topic: "Backtracking" },
  { stepId: 15, topic: "Graphs & Advanced Graphs" },
  { stepId: 16, topic: "1-D & 2-D Dynamic Programming" },
  { stepId: 12, topic: "Greedy" },
  { stepId: 5, topic: "Intervals & Strings" },
  { stepId: 1, topic: "Math & Geometry" },
  { stepId: 8, topic: "Bit Manipulation" },
  { stepId: 2, topic: "Sorting (foundations)" },
  { stepId: 18, topic: "Advanced Strings" },
];

const ORDER_INDEX = new Map(NEETCODE_FLOW.map((f, i) => [f.stepId, i]));
const TOPIC_LABEL = new Map(NEETCODE_FLOW.map((f) => [f.stepId, f.topic]));

export type SheetOrder = "neetcode" | "a2z";

export function roadmapTopic(stepId: number): string | null {
  return TOPIC_LABEL.get(stepId) ?? null;
}

/** Return the steps ordered for the chosen mode. Does not mutate the input. */
export function orderSteps<T extends { id: number }>(
  steps: T[],
  mode: SheetOrder
): T[] {
  if (mode !== "neetcode") return [...steps].sort((a, b) => a.id - b.id);
  return [...steps].sort(
    (a, b) =>
      (ORDER_INDEX.get(a.id) ?? 999) - (ORDER_INDEX.get(b.id) ?? 999)
  );
}

export type { SheetStep };
