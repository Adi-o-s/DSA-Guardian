// Company-frequency ranking helpers, shared by the daily Hard picks
// (lib/recommend.ts) and the upsolve practice finder (lib/practice.ts).
import { getSetting } from "./db";
import { getCompany } from "./data";

/** The user's selected company filter (lowercased slugs); empty = all companies. */
export async function selectedCompanies(): Promise<string[]> {
  return (await getSetting("selectedCompanies"))
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** Max frequency a slug is asked, restricted to `selected` companies (or all). */
export function frequencyFor(slug: string, selected: string[]): number {
  const entry = getCompany()[slug];
  if (!entry) return 0;
  const vals = Object.entries(entry.companies);
  const pool = selected.length
    ? vals.filter(([c]) => selected.includes(c))
    : vals;
  return pool.length ? Math.max(...pool.map(([, f]) => f)) : 0;
}

/** Companies asking for a slug, highest frequency first (filtered by `selected`). */
export function companiesFor(slug: string, selected: string[]): string[] {
  const entry = getCompany()[slug];
  if (!entry) return [];
  return Object.entries(entry.companies)
    .filter(([c]) => (selected.length ? selected.includes(c) : true))
    .sort((a, b) => b[1] - a[1])
    .map(([c]) => c);
}
