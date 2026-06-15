"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { fetcher, post, DIFF_COLOR } from "@/lib/client";

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

export default function SheetPage() {
  const { data, mutate, isLoading } = useSWR<{ name: string; steps: Step[] }>(
    "/api/sheet",
    fetcher
  );
  const [open, setOpen] = useState<Set<number>>(new Set());

  const toggleStep = (id: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleSolved = async (slug: string) => {
    await post("/api/solved/manual", { slug });
    mutate();
  };

  if (isLoading || !data) return <div className="text-muted">Loading sheet…</div>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">{data.name}</h1>
        <p className="text-sm text-muted">
          Ordered to the NeetCode roadmap flow · auto-checked from LeetCode · click
          the circle to mark non-LeetCode items (switch order in Settings)
        </p>
      </div>
      <div className="space-y-2">
        {data.steps.map((step) => (
          <div
            key={step.id}
            className="rounded-xl border border-border bg-panel overflow-hidden"
          >
            <button
              onClick={() => toggleStep(step.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-panel2"
            >
              {open.has(step.id) ? (
                <ChevronDown className="h-4 w-4 text-muted" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted" />
              )}
              <span className="font-medium flex-1">
                {step.title}
                {step.roadmap && step.roadmap !== step.title && (
                  <span className="text-muted font-normal text-xs ml-2">
                    · {step.roadmap}
                  </span>
                )}
                {step.complete && (
                  <CheckCircle2 className="inline-block h-4 w-4 text-easy ml-2 -mt-0.5" />
                )}
              </span>
              <span className="text-xs text-muted tabular-nums">
                {step.solved}/{step.total}
              </span>
              <div className="w-24 h-2 rounded-full bg-panel2 overflow-hidden">
                <div
                  className={`h-full ${
                    step.complete ? "bg-easy" : "bg-accent"
                  }`}
                  style={{ width: `${step.pct}%` }}
                />
              </div>
            </button>

            {open.has(step.id) && (
              <div className="border-t border-border divide-y divide-border">
                {step.categories.map((cat) => (
                  <div key={cat.id} className="px-4 py-3">
                    <p className="text-sm font-medium text-muted mb-2">
                      {cat.title}
                    </p>
                    <ul className="space-y-1">
                      {cat.problems.map((p) => (
                        <li
                          key={p.id}
                          className="flex items-center gap-2 text-sm py-1"
                        >
                          <button
                            onClick={() => p.slug && toggleSolved(p.slug)}
                            disabled={!p.slug}
                            title={
                              p.slug
                                ? "Toggle solved"
                                : "No LeetCode link to track"
                            }
                            className="shrink-0 disabled:opacity-30"
                          >
                            {p.solved ? (
                              <CheckCircle2 className="h-4 w-4 text-easy" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted" />
                            )}
                          </button>
                          <span
                            className={p.solved ? "text-muted line-through" : ""}
                          >
                            {p.title}
                          </span>
                          {p.difficulty && (
                            <span
                              className={`text-[11px] ${DIFF_COLOR[p.difficulty]}`}
                            >
                              {p.difficulty}
                            </span>
                          )}
                          <span className="ml-auto flex items-center gap-2">
                            {p.leetcode && (
                              <a
                                href={p.leetcode}
                                target="_blank"
                                rel="noreferrer"
                                className="text-muted hover:text-accent"
                                title="Open on LeetCode"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
