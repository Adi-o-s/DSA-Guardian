"use client";

import useSWR from "swr";
import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import { fetcher } from "@/lib/client";
import {
  Card,
  ErrorState,
  PageHeader,
  ProgressBar,
  Skeleton,
} from "@/components/ui";
import { Heatmap, HeatmapLegend, type HeatCell } from "@/components/app";

type TagStat = { tag: string; solved: number; total: number; pct: number };
type StatsResp = { heatmap: HeatCell[]; tags: TagStat[] };

/** Weak → strong, mapped onto the shared progress tones. */
function toneFor(pct: number): "danger" | "warning" | "success" {
  if (pct < 34) return "danger";
  if (pct < 67) return "warning";
  return "success";
}

export default function StatsPage() {
  const { data, error, mutate } = useSWR<StatsResp>("/api/stats", fetcher);

  if (error)
    return (
      <ErrorState
        title="Couldn't load stats"
        message={(error as Error).message}
        onRetry={() => mutate()}
      />
    );
  if (!data) return <StatsSkeleton />;

  const total = data.heatmap.reduce((s, c) => s + c.count, 0);
  const activeDays = data.heatmap.filter((c) => c.count > 0).length;
  const best = data.heatmap.reduce((m, c) => Math.max(m, c.count), 0);

  // tags arrive weakest → strongest.
  const ranked = data.tags.filter((t) => t.total > 0);
  const weak = ranked.slice(0, 8);
  const strong = [...ranked].reverse().slice(0, 8);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Your stats"
        description="Where your time actually went, and which topics are still soft."
      />

      <Card as="section" className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-fg">
            <Activity className="h-4 w-4 text-success" aria-hidden="true" />
            Activity
          </h2>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-fg-muted">
            <span>
              <span className="num font-medium text-fg">{total}</span> solves
            </span>
            <span>
              <span className="num font-medium text-fg">{activeDays}</span> active days
            </span>
            <span>
              best day <span className="num font-medium text-fg">{best}</span>
            </span>
          </div>
        </div>

        <Heatmap data={data.heatmap} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-lg text-xs text-fg-subtle">
            Counts dated solves — recent accepted submissions plus manual check-offs.
            Backfilled history has no timestamps, so it isn&apos;t shown here.
          </p>
          <HeatmapLegend />
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <TagColumn
          title="Weak spots"
          icon={<TrendingDown className="h-4 w-4 text-danger" aria-hidden="true" />}
          description="Lowest completion — the highest-leverage practice."
          stats={weak}
          empty="Solve a few problems to see where you're behind."
        />
        <TagColumn
          title="Strengths"
          icon={<TrendingUp className="h-4 w-4 text-success" aria-hidden="true" />}
          description="Topics you've largely cleared."
          stats={strong}
          empty="Your strongest topics will show up here."
        />
      </div>
    </div>
  );
}

function TagColumn({
  title,
  icon,
  description,
  stats,
  empty,
}: {
  title: string;
  icon: React.ReactNode;
  description: string;
  stats: TagStat[];
  empty: string;
}) {
  return (
    <Card as="section" className="space-y-4 p-5">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-fg">
          {icon}
          {title}
        </h2>
        <p className="mt-0.5 text-sm text-fg-muted">{description}</p>
      </div>
      {stats.length === 0 ? (
        <p className="text-sm text-fg-subtle">{empty}</p>
      ) : (
        <ul className="space-y-3">
          {stats.map((t) => (
            <li key={t.tag} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate capitalize text-fg">
                  {t.tag.replace(/-/g, " ")}
                </span>
                <span className="num shrink-0 text-xs text-fg-muted">
                  {t.solved}/{t.total} · {t.pct}%
                </span>
              </div>
              <ProgressBar pct={t.pct} tone={toneFor(t.pct)} label={t.tag} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function StatsSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-10 w-44" />
      <Skeleton className="h-48 rounded-card" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-72 rounded-card" />
        <Skeleton className="h-72 rounded-card" />
      </div>
    </div>
  );
}
