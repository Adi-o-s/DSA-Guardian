"use client";

import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import {
  RefreshCw,
  CheckCircle2,
  Trophy,
  Target,
  PlayCircle,
  Wrench,
  Shuffle,
  Sparkles,
  Circle,
} from "lucide-react";
import { fetcher, post } from "@/lib/client";
import {
  Button,
  Card,
  CardList,
  EmptyState,
  ErrorState,
  Modal,
  Skeleton,
  useToast,
} from "@/components/ui";
import {
  GoalRing,
  ProblemRow,
  RecCard,
  StreakFlame,
  type Recommendation,
} from "@/components/app";

type ContinueItem = {
  slug: string;
  title: string;
  url: string;
  difficulty: string | null;
};
type WeakPick = ContinueItem & { tag: string; stepTitle: string };
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
  recommendations: Recommendation[];
  continueTopic: { id: number; title: string; roadmap: string | null } | null;
  continueProblems: ContinueItem[];
  weakAreas: WeakPick[];
};

const REFRESH_MS = 5 * 60 * 1000;

/** The one sentence the hero exists to deliver: what to do next, right now. */
function nextAction(d: State): { headline: string; sub: string } {
  const left = Math.max(0, d.goal - d.solvedToday);
  const hardLeft = Math.max(0, d.hardGoal - d.hardSolvedToday);

  if (left > 0) {
    return {
      headline:
        d.streak > 0
          ? `${left} more to keep the fire`
          : `${left} to start a streak`,
      sub:
        d.streak > 0
          ? `You're ${d.streak} day${d.streak === 1 ? "" : "s"} in. Don't break it today.`
          : "Every streak starts with one solved question.",
    };
  }
  if (hardLeft > 0) {
    return {
      headline: `Goal met — ${hardLeft} Hard to go`,
      sub: "The daily count is done. Now the one that actually stretches you.",
    };
  }
  return {
    headline: "Day cleared",
    sub: `Questions and Hard both done. Streak stands at ${d.streak} day${
      d.streak === 1 ? "" : "s"
    }.`,
  };
}

export default function Dashboard() {
  const { data, error, isLoading, mutate } = useSWR<State>("/api/state", fetcher, {
    refreshInterval: REFRESH_MS,
  });
  const toast = useToast();
  const [syncing, setSyncing] = useState(false);
  const [showGoal, setShowGoal] = useState(false);
  const [shuffling, setShuffling] = useState(false);

  const sync = useCallback(
    async (announce = false) => {
      setSyncing(true);
      try {
        const res = await post<{
          sync: { added: number; fullSync: boolean; warning?: string };
          state: State;
        }>("/api/sync");
        mutate(res.state, { revalidate: false });
        if (res.sync.warning) toast(res.sync.warning, "error");
        else if (announce)
          toast(
            `Synced${res.sync.fullSync ? " (full history)" : ""} — ${res.sync.added} new.`,
            "success"
          );
      } catch (e) {
        toast((e as Error).message, "error");
      } finally {
        setSyncing(false);
      }
    },
    [mutate, toast]
  );

  useEffect(() => {
    if (!data?.configured) return;
    sync();
    const id = setInterval(() => sync(), REFRESH_MS);
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

  const shuffle = async () => {
    setShuffling(true);
    try {
      const res = await post<State>("/api/state/shuffle");
      mutate(res, { revalidate: false });
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setShuffling(false);
    }
  };

  if (isLoading) return <DashboardSkeleton />;
  if (error)
    return <ErrorState message={(error as Error).message} onRetry={() => mutate()} />;
  if (!data) return null;
  if (!data.configured) return <SetupCard />;

  const action = nextAction(data);
  const dayCleared = data.goalMet && data.hardGoalMet;

  return (
    <div className="space-y-10">
      <GoalModal
        open={showGoal}
        current={data.goal}
        onClose={(goal) => {
          localStorage.setItem("goalConfirmedDate", data.lcDate);
          setShowGoal(false);
          if (goal && goal !== data.goal) {
            post("/api/goal", { goal })
              .then(() => mutate())
              .catch((e: Error) => toast(e.message, "error"));
          }
        }}
      />

      {/* Hero — the one gamified moment on this screen. */}
      <Card as="section" className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-medium text-fg">Hi, {data.username}</span>
            <span className="num text-xs text-fg-subtle">{data.lcDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <StreakFlame streak={data.streak} size="sm" />
            <Button
              size="sm"
              onClick={() => sync(true)}
              loading={syncing}
              icon={<RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />}
            >
              {syncing ? "Syncing" : "Refresh"}
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-6 px-5 py-6 sm:flex-row sm:items-center sm:gap-8">
          <div
            className={dayCleared ? "animate-pop-in shrink-0" : "shrink-0"}
            key={dayCleared ? "cleared" : "open"}
          >
            <GoalRing
              value={data.solvedToday}
              goal={data.goal}
              label="questions today"
              metLabel="Goal met"
              size={132}
            />
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
              {action.headline}
            </h1>
            <p className="mt-1.5 text-md text-fg-muted">{action.sub}</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-overlay px-2.5 py-1 text-xs text-fg-muted">
                <Target className="h-3.5 w-3.5 text-diff-hard" aria-hidden="true" />
                Hard <span className="num font-medium text-fg">{data.hardSolvedToday}/{data.hardGoal}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-overlay px-2.5 py-1 text-xs text-fg-muted">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                Topics <span className="num font-medium text-fg">{data.completedTopics.length}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-overlay px-2.5 py-1 text-xs text-fg-muted">
                <Trophy className="h-3.5 w-3.5 text-flame" aria-hidden="true" />
                Solved <span className="num font-medium text-fg">{data.totalSolved}</span>
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Today's Hard picks */}
      <section className="space-y-3">
        <SectionHeader
          title="Today's Hard picks"
          count={`${data.hardSolvedToday}/${data.hardGoal}`}
          actions={
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={shuffle}
                loading={shuffling}
                icon={<Shuffle className="h-3.5 w-3.5" aria-hidden="true" />}
              >
                Shuffle
              </Button>
              <Link
                href="/settings"
                className="text-xs text-brand transition-colors hover:underline"
              >
                Change goal
              </Link>
            </>
          }
        />

        {data.completedTopics.length === 0 && data.recommendations.length > 0 && (
          <p className="rounded-lg border border-warning/25 bg-warning/5 px-4 py-3 text-sm text-fg-muted">
            No topic is at 80% yet, so these are drawn from topics you&apos;ve started.
            Finish one on the{" "}
            <Link href="/sheet" className="text-brand hover:underline">
              sheet
            </Link>{" "}
            to unlock targeted picks.
          </p>
        )}

        {data.recommendations.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="h-5 w-5" />}
            title="No Hard picks match yet"
            description={
              <>
                Widen the company filter in{" "}
                <Link href="/settings" className="text-brand hover:underline">
                  settings
                </Link>
                , or make progress on a topic so Guardian has something to draw from.
              </>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {data.recommendations.map((r) => (
              <RecCard key={r.slug} rec={r} />
            ))}
          </div>
        )}
      </section>

      {/* Continue where you left off */}
      {data.continueTopic && data.continueProblems.length > 0 && (
        <section className="space-y-3">
          <SectionHeader
            icon={<PlayCircle className="h-4 w-4 text-brand" aria-hidden="true" />}
            title={`Continue: ${data.continueTopic.roadmap ?? data.continueTopic.title}`}
          />
          <CardList>
            {data.continueProblems.map((p, i) => (
              <ProblemRow
                key={p.slug}
                index={i + 1}
                title={p.title}
                href={p.url}
                difficulty={p.difficulty}
              />
            ))}
          </CardList>
        </section>
      )}

      {/* Weak areas */}
      {data.weakAreas.length > 0 && (
        <section className="space-y-3">
          <SectionHeader
            icon={<Wrench className="h-4 w-4 text-warning" aria-hidden="true" />}
            title="Shore up weak areas"
            description="Next Striver problems from the topics you've solved the least."
          />
          <CardList>
            {data.weakAreas.map((p, i) => (
              <ProblemRow
                key={p.slug}
                index={i + 1}
                title={p.title}
                href={p.url}
                difficulty={p.difficulty}
                meta={p.tag}
              />
            ))}
          </CardList>
        </section>
      )}
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  description,
  count,
  actions,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  count?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-fg">
          {icon}
          {title}
          {count && <span className="num text-sm font-normal text-fg-subtle">{count}</span>}
        </h2>
        {description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

function GoalModal({
  open,
  current,
  onClose,
}: {
  open: boolean;
  current: number;
  onClose: (goal?: number) => void;
}) {
  const [goal, setGoal] = useState(current);
  useEffect(() => setGoal(current), [current]);

  return (
    <Modal
      open={open}
      onClose={() => onClose()}
      title="Today's goal"
      description="How many questions, any difficulty, will you solve today?"
      footer={
        <>
          <Button variant="ghost" onClick={() => onClose()}>
            Keep {current}
          </Button>
          <Button
            variant="primary"
            onClick={() => onClose(Math.max(1, Math.min(50, goal)))}
          >
            Set goal
          </Button>
        </>
      }
    >
      <div className="flex items-center gap-3">
        <input
          type="number"
          min={1}
          max={50}
          value={goal}
          onChange={(e) => setGoal(Number(e.target.value))}
          aria-label="Questions today"
          className="num w-20 rounded-md border border-line bg-surface-sunken px-3 py-2 text-center text-lg text-fg outline-none focus:border-brand"
        />
        <div className="flex gap-1.5">
          {[1, 2, 3, 5].map((n) => (
            <button
              key={n}
              onClick={() => setGoal(n)}
              aria-pressed={goal === n}
              className={
                goal === n
                  ? "num h-9 w-9 rounded-md border border-brand bg-brand/10 text-sm font-medium text-brand"
                  : "num h-9 w-9 rounded-md border border-line bg-surface-overlay text-sm text-fg-muted transition-colors hover:text-fg"
              }
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function SetupCard() {
  return (
    <EmptyState
      icon={<Circle className="h-5 w-5" />}
      title="Welcome to DSA Guardian"
      description="Add your LeetCode username to start tracking Striver A2Z progress and get daily Hard recommendations."
      action={
        <Link
          href="/settings"
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-fg transition-all hover:brightness-110"
        >
          Go to settings
        </Link>
      }
      className="mt-6"
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-56 rounded-card" />
      <div className="space-y-3">
        <Skeleton className="h-6 w-44" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-32 rounded-card" />
          <Skeleton className="h-32 rounded-card" />
        </div>
      </div>
    </div>
  );
}
