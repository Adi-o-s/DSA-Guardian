"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Circle,
  Search,
  X,
  SearchX,
} from "lucide-react";
import { fetcher, post } from "@/lib/client";
import { cn } from "@/lib/cn";
import {
  Button,
  Card,
  EmptyState,
  PageHeader,
  Skeleton,
  useToast,
} from "@/components/ui";
import { DifficultyPill, TopicProgress } from "@/components/app";

type Problem = {
  id: string;
  title: string;
  slug: string | null;
  leetcode: string | null;
  gfg: string | null;
  yt: string | null;
  difficulty: string | null;
  solved: boolean;
  source: string | null;
};
type Category = { id: string; title: string; problems: Problem[] };
type Step = {
  id: number;
  title: string;
  subtitle: string;
  roadmap: string | null;
  total: number;
  solved: number;
  pct: number;
  complete: boolean;
  categories: Category[];
};

const DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;

export default function SheetPage() {
  const { data, mutate, isLoading } = useSWR<{ name: string; steps: Step[] }>(
    "/api/sheet",
    fetcher
  );
  const toast = useToast();
  const [open, setOpen] = useState<Set<number>>(new Set());
  const [query, setQuery] = useState("");
  const [diffs, setDiffs] = useState<Set<string>>(new Set());
  const [unsolvedOnly, setUnsolvedOnly] = useState(false);

  const filtering = query.trim().length > 0 || diffs.size > 0 || unsolvedOnly;

  const steps = useMemo(() => {
    if (!data) return [];
    if (!filtering) return data.steps;

    const q = query.trim().toLowerCase();
    return data.steps
      .map((step) => {
        const categories = step.categories
          .map((cat) => ({
            ...cat,
            problems: cat.problems.filter((p) => {
              if (q && !p.title.toLowerCase().includes(q)) return false;
              if (diffs.size > 0 && (!p.difficulty || !diffs.has(p.difficulty)))
                return false;
              if (unsolvedOnly && p.solved) return false;
              return true;
            }),
          }))
          .filter((c) => c.problems.length > 0);
        return { ...step, categories };
      })
      .filter((s) => s.categories.length > 0);
  }, [data, query, diffs, unsolvedOnly, filtering]);

  const matches = useMemo(
    () =>
      steps.reduce(
        (n, s) => n + s.categories.reduce((m, c) => m + c.problems.length, 0),
        0
      ),
    [steps]
  );

  const toggleStep = (id: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleDiff = (d: string) =>
    setDiffs((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });

  const toggleSolved = async (slug: string) => {
    try {
      await post("/api/solved/manual", { slug });
      mutate();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const expandAll = () => setOpen(new Set((data?.steps ?? []).map((s) => s.id)));
  const collapseAll = () => setOpen(new Set());

  if (isLoading || !data) return <SheetSkeleton />;

  const totals = data.steps.reduce(
    (acc, s) => ({ solved: acc.solved + s.solved, total: acc.total + s.total }),
    { solved: 0, total: 0 }
  );
  const overallPct = totals.total > 0 ? (totals.solved / totals.total) * 100 : 0;

  // While filtering, every matching step is shown expanded — hiding matches
  // behind a collapsed header defeats the search.
  const isOpen = (id: number) => filtering || open.has(id);

  return (
    <div className="space-y-5">
      <PageHeader
        title={data.name}
        description="NeetCode roadmap order · auto-checked from LeetCode · click a circle to mark items LeetCode can't see"
        actions={
          <TopicProgress
            solved={totals.solved}
            total={totals.total}
            pct={overallPct}
            label="Overall"
            barClassName="w-28"
          />
        }
      />

      {/* Controls */}
      <div className="sticky top-14 z-20 -mx-4 border-b border-line bg-surface/90 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[12rem] flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle"
              aria-hidden="true"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search all 456 problems"
              aria-label="Search problems"
              className="input pl-9 pr-9"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-subtle hover:text-fg"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => toggleDiff(d)}
                aria-pressed={diffs.has(d)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  diffs.has(d)
                    ? d === "Easy"
                      ? "border-diff-easy/40 bg-diff-easy/10 text-diff-easy"
                      : d === "Medium"
                        ? "border-diff-medium/40 bg-diff-medium/10 text-diff-medium"
                        : "border-diff-hard/40 bg-diff-hard/10 text-diff-hard"
                    : "border-line bg-surface-raised text-fg-muted hover:text-fg"
                )}
              >
                {d}
              </button>
            ))}
            <button
              onClick={() => setUnsolvedOnly((v) => !v)}
              aria-pressed={unsolvedOnly}
              className={cn(
                "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                unsolvedOnly
                  ? "border-brand/40 bg-brand/10 text-brand"
                  : "border-line bg-surface-raised text-fg-muted hover:text-fg"
              )}
            >
              Unsolved only
            </button>
          </div>

          <div className="ml-auto flex items-center gap-1">
            {filtering ? (
              <span className="num text-xs text-fg-subtle">{matches} matching</span>
            ) : (
              <>
                <Button size="sm" variant="ghost" onClick={expandAll}>
                  Expand all
                </Button>
                <Button size="sm" variant="ghost" onClick={collapseAll}>
                  Collapse
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {steps.length === 0 ? (
        <EmptyState
          icon={<SearchX className="h-5 w-5" />}
          title="Nothing matches"
          description="No problem matches that search and filter combination."
          action={
            <Button
              size="sm"
              onClick={() => {
                setQuery("");
                setDiffs(new Set());
                setUnsolvedOnly(false);
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {steps.map((step) => (
            <Card key={step.id} className="overflow-hidden">
              <h2>
                <button
                  onClick={() => toggleStep(step.id)}
                  aria-expanded={isOpen(step.id)}
                  aria-controls={`step-${step.id}`}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-overlay"
                >
                  {isOpen(step.id) ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-fg-subtle" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-fg-subtle" aria-hidden="true" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="text-md font-medium text-fg">{step.title}</span>
                    {step.roadmap && step.roadmap !== step.title && (
                      <span className="ml-2 text-xs font-normal text-fg-subtle">
                        {step.roadmap}
                      </span>
                    )}
                  </span>
                  <TopicProgress
                    solved={step.solved}
                    total={step.total}
                    pct={step.pct}
                    complete={step.complete}
                    label={step.title}
                    className="shrink-0"
                  />
                </button>
              </h2>

              {isOpen(step.id) && (
                <div id={`step-${step.id}`} className="divide-y divide-line border-t border-line">
                  {step.categories.map((cat) => (
                    <div key={cat.id} className="px-4 py-3">
                      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-fg-subtle">
                        {cat.title}
                      </p>
                      <ul>
                        {cat.problems.map((p) => (
                          <li key={p.id} className="flex items-center gap-2.5 py-1.5">
                            <button
                              onClick={() => p.slug && toggleSolved(p.slug)}
                              disabled={!p.slug}
                              aria-pressed={p.solved}
                              aria-label={
                                p.slug
                                  ? `Mark ${p.title} as ${p.solved ? "unsolved" : "solved"}`
                                  : `${p.title} has no LeetCode link to track`
                              }
                              className="shrink-0 disabled:opacity-30"
                            >
                              {p.solved ? (
                                <CheckCircle2 className="h-4 w-4 text-success" />
                              ) : (
                                <Circle className="h-4 w-4 text-fg-subtle transition-colors hover:text-fg-muted" />
                              )}
                            </button>
                            <span
                              className={cn(
                                "min-w-0 flex-1 truncate text-sm",
                                p.solved ? "text-fg-muted line-through" : "text-fg"
                              )}
                            >
                              {p.title}
                            </span>
                            <DifficultyPill difficulty={p.difficulty} />
                            {p.leetcode && (
                              <a
                                href={p.leetcode}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`Open ${p.title} on LeetCode`}
                                className="shrink-0 text-fg-subtle transition-colors hover:text-brand"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SheetSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-12 rounded-lg" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-card" />
        ))}
      </div>
    </div>
  );
}
