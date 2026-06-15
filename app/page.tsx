"use client";

import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Trophy,
  Flame,
  AlertTriangle,
  Target,
  PlayCircle,
} from "lucide-react";
import { fetcher, post, DIFF_COLOR } from "@/lib/client";
import { GoalRing } from "@/components/GoalRing";

type Rec = {
  slug: string;
  title: string;
  difficulty: string;
  url: string;
  stepTitle: string;
  companies: string[];
  frequency: number;
  status: "pending" | "done";
  fallback: boolean;
};
type ContinueItem = {
  slug: string;
  title: string;
  url: string;
  difficulty: string | null;
};
type State = {
  username: string;
  configured: boolean;
  lcDate: string;
  goal: number;
  solvedToday: number;
  goalMet: boolean;
  hardGoal: number;
  hardSolvedToday: number;
  hardGoalMet: boolean;
  streak: number;
  totalSolved: number;
  completedTopics: { id: number; title: string }[];
  recommendations: Rec[];
  continueTopic: { id: number; title: string; roadmap: string | null } | null;
  continueProblems: ContinueItem[];
};

const REFRESH_MS = 5 * 60 * 1000;

export default function Dashboard() {
  const { data, error, isLoading, mutate } = useSWR<State>("/api/state", fetcher, {
    refreshInterval: REFRESH_MS,
  });
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [showGoal, setShowGoal] = useState(false);

  const sync = useCallback(async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await post<{
        sync: { added: number; fullSync: boolean; warning?: string };
        state: State;
      }>("/api/sync");
      mutate(res.state, { revalidate: false });
      setSyncMsg(
        res.sync.warning ??
          `Synced${res.sync.fullSync ? " (full)" : ""} — ${res.sync.added} new.`
      );
    } catch (e) {
      setSyncMsg((e as Error).message);
    } finally {
      setSyncing(false);
    }
  }, [mutate]);

  useEffect(() => {
    if (!data?.configured) return;
    sync();
    const id = setInterval(sync, REFRESH_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.configured]);

  useEffect(() => {
    if (!data?.configured) return;
    const confirmed =
      typeof window !== "undefined"
        ? localStorage.getItem("goalConfirmedDate")
        : null;
    if (confirmed !== data.lcDate) setShowGoal(true);
  }, [data?.configured, data?.lcDate]);

  if (isLoading) return <Skeleton />;
  if (error)
    return <ErrorCard message={(error as Error).message} onRetry={() => mutate()} />;
  if (!data) return null;
  if (!data.configured) return <SetupCard />;

  return (
    <div className="space-y-8">
      {showGoal && (
        <GoalModal
          current={data.goal}
          onClose={(goal) => {
            localStorage.setItem("goalConfirmedDate", data.lcDate);
            setShowGoal(false);
            if (goal && goal !== data.goal) {
              post("/api/goal", { goal }).then(() => mutate());
            }
          }}
        />
      )}

      {/* Header + two rings */}
      <section className="rounded-xl border border-border bg-panel p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Flame className="h-5 w-5 text-medium" />
              Hi, {data.username}
            </h1>
            <p className="text-sm text-muted">
              LeetCode day {data.lcDate} (UTC frame)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StreakBadge streak={data.streak} />
            <button
              onClick={sync}
              disabled={syncing}
              className="flex items-center gap-2 rounded-md bg-panel2 border border-border px-3 py-2 text-sm hover:bg-border disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing…" : "Refresh now"}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center gap-1">
              <GoalRing
                value={data.solvedToday}
                goal={data.goal}
                label="questions today"
                size={120}
                color="#5b8cff"
              />
              <span className="text-xs text-muted">Daily questions</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <GoalRing
                value={data.hardSolvedToday}
                goal={data.hardGoal}
                label="hard today"
                metLabel="Hard done 🔥"
                size={120}
                color="#ef4444"
              />
              <span className="text-xs text-muted">Daily hard</span>
            </div>
          </div>

          <div className="flex-1 w-full grid grid-cols-3 gap-3">
            <Stat
              label="Topics ≥80%"
              value={`${data.completedTopics.length}`}
              icon={<CheckCircle2 className="h-4 w-4" />}
            />
            <Stat
              label="Total solved"
              value={`${data.totalSolved}`}
              icon={<Trophy className="h-4 w-4" />}
            />
            <Stat
              label="Streak"
              value={`${data.streak}d`}
              icon={<Flame className="h-4 w-4" />}
            />
          </div>
        </div>
        {syncMsg && <p className="text-xs text-muted">{syncMsg}</p>}
      </section>

      {/* Continue where you left off */}
      {data.continueTopic && data.continueProblems.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-accent" />
            Continue: {data.continueTopic.roadmap ?? data.continueTopic.title}
          </h2>
          <div className="rounded-xl border border-border bg-panel divide-y divide-border">
            {data.continueProblems.map((p, i) => (
              <a
                key={p.slug}
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-panel2 group"
              >
                <span className="text-muted text-sm w-5 tabular-nums">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm">{p.title}</span>
                {p.difficulty && (
                  <span className={`text-xs ${DIFF_COLOR[p.difficulty]}`}>
                    {p.difficulty}
                  </span>
                )}
                <ExternalLink className="h-4 w-4 text-muted group-hover:text-accent" />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Hard recommendations */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">
            Today&apos;s Hard picks{" "}
            <span className="text-sm font-normal text-muted">
              ({data.hardSolvedToday}/{data.hardGoal})
            </span>
          </h2>
          <Link href="/settings" className="text-sm text-accent hover:underline">
            Change hard goal
          </Link>
        </div>

        {data.completedTopics.length === 0 && (
          <div className="rounded-lg border border-border bg-panel2 p-4 text-sm text-muted flex gap-2">
            <AlertTriangle className="h-4 w-4 text-medium shrink-0 mt-0.5" />
            <span>
              No topics at ≥80% yet, so picks are drawn from topics you&apos;ve
              started (marked &ldquo;in&nbsp;progress&rdquo;). Reach 80% of a topic
              on the{" "}
              <Link href="/sheet" className="text-accent hover:underline">
                Sheet
              </Link>{" "}
              to unlock targeted Hard recommendations.
            </span>
          </div>
        )}

        {data.recommendations.length === 0 ? (
          <p className="text-sm text-muted">
            No matching Hard questions found. Try widening your company filter in{" "}
            <Link href="/settings" className="text-accent hover:underline">
              Settings
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.recommendations.map((r) => (
              <RecCard key={r.slug} rec={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StreakBadge({ streak }: { streak: number }) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm ${
        streak > 0
          ? "border-medium/40 bg-medium/10 text-medium"
          : "border-border bg-panel2 text-muted"
      }`}
      title="Consecutive days you met your daily questions goal"
    >
      <Flame className="h-4 w-4" />
      <span className="font-semibold">{streak}</span>
      day{streak === 1 ? "" : "s"}
    </div>
  );
}

function RecCard({ rec }: { rec: Rec }) {
  const done = rec.status === "done";
  return (
    <a
      href={rec.url}
      target="_blank"
      rel="noreferrer"
      className={`group block rounded-xl border p-4 transition-colors ${
        done
          ? "border-easy/40 bg-easy/5"
          : "border-border bg-panel hover:border-accent/60"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium leading-snug">{rec.title}</span>
        {done ? (
          <CheckCircle2 className="h-5 w-5 text-easy shrink-0" />
        ) : (
          <ExternalLink className="h-4 w-4 text-muted group-hover:text-accent shrink-0" />
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        <span className={`font-semibold ${DIFF_COLOR[rec.difficulty]}`}>
          {rec.difficulty}
        </span>
        <span className="text-muted">·</span>
        <span className="text-muted">{rec.stepTitle}</span>
        {rec.fallback && (
          <span className="rounded bg-medium/15 text-medium px-1.5 py-0.5">
            in progress
          </span>
        )}
        {rec.frequency > 0 && (
          <span className="ml-auto text-muted">freq {rec.frequency}%</span>
        )}
      </div>
      {rec.companies.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {rec.companies.map((c) => (
            <span
              key={c}
              className="rounded bg-panel2 border border-border px-1.5 py-0.5 text-[11px] text-muted capitalize"
            >
              {c.replace(/-/g, " ")}
            </span>
          ))}
        </div>
      )}
    </a>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-panel2 border border-border px-3 py-2">
      <div className="flex items-center gap-1.5 text-muted text-xs">
        {icon}
        {label}
      </div>
      <div className="text-xl font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function GoalModal({
  current,
  onClose,
}: {
  current: number;
  onClose: (goal?: number) => void;
}) {
  const [goal, setGoal] = useState(current);
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-panel p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" />
            Today&apos;s goal
          </h3>
          <p className="text-sm text-muted mt-1">
            How many questions (any difficulty) will you solve today?
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={50}
            value={goal}
            onChange={(e) => setGoal(Number(e.target.value))}
            className="w-24 rounded-md bg-panel2 border border-border px-3 py-2 text-lg text-center"
          />
          <div className="flex gap-1">
            {[1, 2, 3, 5].map((n) => (
              <button
                key={n}
                onClick={() => setGoal(n)}
                className="h-9 w-9 rounded-md border border-border bg-panel2 hover:bg-border text-sm"
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={() => onClose()}
            className="px-3 py-2 text-sm text-muted hover:text-text"
          >
            Keep {current}
          </button>
          <button
            onClick={() => onClose(Math.max(1, Math.min(50, goal)))}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Set goal
          </button>
        </div>
      </div>
    </div>
  );
}

function SetupCard() {
  return (
    <div className="rounded-xl border border-border bg-panel p-8 text-center space-y-3">
      <h1 className="text-xl font-semibold">Welcome to DSA Guardian 🛡️</h1>
      <p className="text-muted">
        Add your LeetCode username to start tracking your Striver A2Z progress and
        get daily Hard recommendations.
      </p>
      <Link
        href="/settings"
        className="inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Go to Settings
      </Link>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-48 rounded-xl bg-panel" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-28 rounded-xl bg-panel" />
        <div className="h-28 rounded-xl bg-panel" />
      </div>
    </div>
  );
}

function ErrorCard({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-xl border border-hard/40 bg-hard/5 p-6 space-y-3">
      <p className="font-medium text-hard">Something went wrong</p>
      <p className="text-sm text-muted">{message}</p>
      <button
        onClick={onRetry}
        className="rounded-md bg-panel2 border border-border px-3 py-2 text-sm"
      >
        Retry
      </button>
    </div>
  );
}
