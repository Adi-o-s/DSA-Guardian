// Loads the bundled static datasets (server-side only) and builds lookup indices.
import fs from "node:fs";
import path from "node:path";

export type SheetProblem = {
  id: string;
  title: string;
  slug: string | null;
  leetcode: string | null;
  gfg: string | null;
  yt: string | null;
};
export type SheetCategory = { id: string; title: string; problems: SheetProblem[] };
export type SheetStep = {
  id: number;
  title: string;
  subtitle: string;
  categories: SheetCategory[];
};
export type Sheet = {
  name: string;
  totalProblems: number;
  leetcodeLinked: number;
  steps: SheetStep[];
};

export type LeetMeta = {
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  tags: string[];
  paidOnly: boolean;
};
export type CompanyEntry = { companies: Record<string, number> };

const DATA_DIR = path.join(process.cwd(), "data");

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), "utf8")) as T;
}

// Cache across requests in the same server process.
let _sheet: Sheet | null = null;
let _meta: Record<string, LeetMeta> | null = null;
let _company: Record<string, CompanyEntry> | null = null;
let _slugToStep: Map<string, number> | null = null;

export function getSheet(): Sheet {
  return (_sheet ??= readJson<Sheet>("striver-a2z.json"));
}
export function getMeta(): Record<string, LeetMeta> {
  return (_meta ??= readJson<Record<string, LeetMeta>>("leetcode-meta.json"));
}
export function getCompany(): Record<string, CompanyEntry> {
  return (_company ??= readJson<Record<string, CompanyEntry>>("company.json"));
}

/** slug -> Striver step id (for the LeetCode-linked sheet problems). */
export function slugToStep(): Map<string, number> {
  if (_slugToStep) return _slugToStep;
  const map = new Map<string, number>();
  for (const step of getSheet().steps) {
    for (const cat of step.categories) {
      for (const p of cat.problems) {
        if (p.slug) map.set(p.slug, step.id);
      }
    }
  }
  return (_slugToStep = map);
}

export function stepTitle(stepId: number): string {
  return getSheet().steps.find((s) => s.id === stepId)?.title ?? `Step ${stepId}`;
}

/** Maximum frequency across all companies for a slug (used for ranking). */
export function maxFrequency(slug: string): number {
  const entry = getCompany()[slug];
  if (!entry) return 0;
  return Math.max(0, ...Object.values(entry.companies));
}
