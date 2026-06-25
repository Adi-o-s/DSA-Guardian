"use client";

import useSWR from "swr";
import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import { fetcher } from "@/lib/client";
import { Heatmap, type HeatCell } from "@/components/Heatmap";

type TagStat = { tag: string; solved: number; total: number; pct: number };
type StatsResp = { heatmap: HeatCell[]; tags: TagStat[] };

export default function StatsPage() {
  const { data, error } = useSWR<StatsResp>("/api/stats", fetcher);

  if (error)
    return (
      <p className="text-sm text-hard">Couldn&apos;t load stats: {(error as Error).message}</p>
    );
  if (!data) return <div className="text-muted">Loading…</div>;

  const total = data.heatmap.reduce((s, c) => s + c.count, 0);
  // tags arrive weakest → strongest.
  const ranked = data.tags.filter((t) => t.total > 0);
  const weak = ranked.slice(0, 8);
  const strong = [...ranked].reverse().slice(0, 8);

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Your stats</h1>

      {/* Activity heatmap */}
      <section className="rounded-xl border border-border bg-panel p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-easy" />
            Activity
          </h2>
          <span className="text-sm text-muted">{total} solves in the last year</span>
        </div>
        <Heatmap data={data.heatmap} />
        <p className="text-xs text-muted">
          Counts dated solves (recent ACs + manual check-offs). Backfilled history
          has no timestamps, so it isn&apos;t shown here.
        </p>
      </section>

      {/* Strength / weakness by tag */}
      <div className="grid gap-6 md:grid-cols-2">
        <TagColumn
          title="Weak spots"
          icon={<TrendingDown className="h-5 w-5 text-hard" />}
          stats={weak}
          empty="Solve a few problems to see where you're behind."
        />
        <TagColumn
          title="Strengths"
          icon={<TrendingUp className="h-5 w-5 text-easy" />}
          stats={strong}
          empty="Your strongest topics will show up here."
        />
      </div>
    </div>
  );
}

function barColor(pct: number): string {
  if (pct < 34) return "#ef4444"; // hard
  if (pct < 67) return "#f59e0b"; // medium
  return "#22c55e"; // easy
}

function TagColumn({
  title,
  icon,
  stats,
  empty,
}: {
  title: string;
  icon: React.ReactNode;
  stats: TagStat[];
  empty: string;
}) {
  return (
    <section className="rounded-xl border border-border bg-panel p-5 space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {stats.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <ul className="space-y-3">
          {stats.map((t) => (
            <li key={t.tag} className="space-y-1">
              <div className="flex items-baseline justify-between text-sm">
                <span className="capitalize">{t.tag.replace(/-/g, " ")}</span>
                <span className="text-muted text-xs tabular-nums">
                  {t.solved}/{t.total} · {t.pct}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-panel2 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${t.pct}%`, backgroundColor: barColor(t.pct) }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
