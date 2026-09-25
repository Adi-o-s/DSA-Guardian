"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LifeBuoy,
  ExternalLink,
  CheckCircle2,
  Circle,
  GraduationCap,
  Dumbbell,
  Trophy,
  PlayCircle,
  Sparkles,
  AlertTriangle,
  Search,
} from "lucide-react";
import { fetcher, post, patch } from "@/lib/client";
import { cn } from "@/lib/cn";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  PageHeader,
} from "@/components/ui";
import { DifficultyPill, GoalRing } from "@/components/app";

type Video = { title: string; channel: string; url: string };
type Practice = {
  slug: string;
  title: string;
  difficulty: string;
  url: string;
  companies: string[];
  frequency: number;
  solved: boolean;
  overlap: number;
};
type Question = {
  slug: string;
  title: string;
  difficulty: string;
  credit: number;
  tags: string[];
  tagsPending: boolean;
  videos: Video[];
  practice: Practice[];
  attempted: boolean;
  conquered: boolean;
};
type Plan = {
  contestSlug: string;
  contestTitle: string;
  total: number;
  solvedCount: number;
  questions: Question[];
};

// Friendly topic options for the manual picker (brand-new contests with no tags).
const TOPIC_OPTIONS: { value: string; label: string }[] = [
  { value: "dynamic-programming", label: "Dynamic Programming" },
  { value: "graph", label: "Graph" },
  { value: "binary-search", label: "Binary Search" },
  { value: "greedy", label: "Greedy" },
  { value: "trie", label: "Trie" },
  { value: "segment-tree", label: "Segment Tree" },
  { value: "two-pointers", label: "Two Pointers" },
  { value: "sliding-window", label: "Sliding Window" },
  { value: "backtracking", label: "Backtracking" },
  { value: "bit-manipulation", label: "Bit Manipulation" },
  { value: "heap-priority-queue", label: "Heap / Priority Queue" },
  { value: "binary-tree", label: "Binary Tree" },
  { value: "math", label: "Math / Number Theory" },
  { value: "string", label: "String" },
];

const LAST_SLUG_KEY = "upsolveSlug";

export default function UpsolvePage() {
  const [slug, setSlug] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const build = useCallback(async (raw: string) => {
    const value = raw.trim();
    if (!value) {
      setError("Enter a contest slug or URL first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await post<Plan>("/api/contest", { slug: value });
      setPlan(res);
      localStorage.setItem(LAST_SLUG_KEY, res.contestSlug);
    } catch (e) {
      setError((e as Error).message);
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Restore the last contest on load so progress feels continuous.
  useEffect(() => {
    const last = localStorage.getItem(LAST_SLUG_KEY);
    if (last) {
      setSlug(last);
      build(last);
    }
  }, [build]);

  const conqueredCount = plan?.questions.filter((q) => q.conquered).length ?? 0;

  const updateQuestion = (qslug: string, patchObj: Partial<Question>) => {
    setPlan((p) =>
      p
        ? {
            ...p,
            questions: p.questions.map((q) =>
              q.slug === qslug ? { ...q, ...patchObj } : q
            ),
          }
        : p
    );
  };

  return (
    <div className="space-y-7">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-brand" aria-hidden="true" />
            Upsolving
          </span>
        }
        description="Missed a few in a contest? That's where the real learning is. Drop the contest in and Guardian builds a calm, step-by-step recovery plan."
      />

      <Card className="space-y-3 p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            build(slug);
          }}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="weekly-contest-380  (or paste the contest URL)"
            aria-label="Contest slug or URL"
            className="input flex-1"
          />
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            icon={<Search className="h-4 w-4" aria-hidden="true" />}
          >
            {loading ? "Building" : "Build recovery plan"}
          </Button>
        </form>
        <p className="text-xs text-fg-muted">
          The slug is the last part of the contest URL, e.g.{" "}
          <code className="font-mono text-fg">leetcode.com/contest/weekly-contest-380</code>
        </p>
      </Card>

      {error && (
        <ErrorState
          title="Couldn't load that contest"
          message={error}
          onRetry={() => build(slug)}
        />
      )}

      {plan && (
        <>
          <Card className="flex flex-col items-center gap-6 p-5 sm:flex-row">
            {plan.questions.length > 0 && (
              <GoalRing
                value={conqueredCount}
                goal={plan.questions.length}
                label="conquered"
                metLabel="All conquered"
                size={110}
                tone="success"
              />
            )}
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <h2 className="text-lg font-semibold tracking-tight text-fg">
                {plan.contestTitle}
              </h2>
              <p className="mt-1 text-sm text-fg-muted">
                <span className="num">
                  {plan.solvedCount}/{plan.total}
                </span>{" "}
                solved in-contest · <span className="num">{plan.questions.length}</span> to
                upsolve · <span className="num">{conqueredCount}</span> conquered
              </p>
            </div>
          </Card>

          {plan.questions.length === 0 ? (
            <Card className="space-y-2 border-success/40 bg-success/5 p-8 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-success" aria-hidden="true" />
              <h3 className="text-lg font-semibold text-fg">Clean sweep</h3>
              <p className="text-sm text-fg-muted">
                You already solved every problem in this contest. Nothing left to
                upsolve — go pick your next challenge.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {plan.questions.map((q, i) => (
                <RecoveryCard
                  key={q.slug}
                  contestSlug={plan.contestSlug}
                  index={i}
                  q={q}
                  onChange={(patchObj) => updateQuestion(q.slug, patchObj)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RecoveryCard({
  contestSlug,
  index,
  q,
  onChange,
}: {
  contestSlug: string;
  index: number;
  q: Question;
  onChange: (patch: Partial<Question>) => void;
}) {
  // Progressive disclosure: reveal Practice/Conquer as the user moves through.
  const [unlocked, setUnlocked] = useState(q.conquered ? 3 : 1);
  const [busy, setBusy] = useState(false);

  const toggleAttempted = async () => {
    const next = !q.attempted;
    onChange({ attempted: next });
    await patch("/api/contest", {
      slug: contestSlug,
      questionSlug: q.slug,
      attempted: next,
    }).catch(() => onChange({ attempted: !next }));
  };

  const toggleConquered = async () => {
    const next = !q.conquered;
    setBusy(true);
    onChange({ conquered: next });
    if (next) setUnlocked(3);
    await patch("/api/contest", {
      slug: contestSlug,
      questionSlug: q.slug,
      conquered: next,
    }).catch(() => onChange({ conquered: !next }));
    setBusy(false);
  };

  return (
    <Card
      as="section"
      className={cn(
        "space-y-4 p-5 transition-colors",
        q.conquered && "border-success/40 bg-success/5"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="num text-xs text-fg-subtle">Q{index + 1}</span>
            <DifficultyPill difficulty={q.difficulty} />
            {q.credit > 0 && (
              <span className="num text-xs text-fg-subtle">{q.credit} pts</span>
            )}
            {q.conquered && <Badge tone="success">Conquered</Badge>}
          </div>
          <h3 className="mt-1 text-md font-semibold text-fg">{q.title}</h3>
        </div>
        <button
          onClick={toggleAttempted}
          aria-pressed={q.attempted}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors",
            q.attempted
              ? "border-brand/40 bg-brand/10 text-brand"
              : "border-line bg-surface-overlay text-fg-muted hover:text-fg"
          )}
          title="Did you attempt this during the contest?"
        >
          {q.attempted ? (
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Circle className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          I attempted this
        </button>
      </div>

      <ol className="space-y-3">
        <StepBlock
          n={1}
          title="Learn the concept"
          icon={<GraduationCap className="h-4 w-4" aria-hidden="true" />}
          done={unlocked > 1}
        >
          {q.tagsPending ? (
            <TagsPending q={q} onChange={onChange} />
          ) : (
            <>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {q.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded border border-line bg-surface-overlay px-1.5 py-0.5 text-2xs capitalize text-fg-muted"
                  >
                    {t.replace(/-/g, " ")}
                  </span>
                ))}
              </div>
              <VideoList videos={q.videos} />
            </>
          )}
          {unlocked < 2 && (
            <Button size="sm" className="mt-3" onClick={() => setUnlocked(2)}>
              Got the concept — show practice
            </Button>
          )}
        </StepBlock>

        {unlocked >= 2 && (
          <StepBlock
            n={2}
            title="Practice on fresh problems"
            icon={<Dumbbell className="h-4 w-4" aria-hidden="true" />}
            done={unlocked > 2}
          >
            {q.practice.length === 0 ? (
              <p className="text-sm text-fg-muted">
                No close matches for these tags. Head straight to the contest problem
                below — you have the concept now.
              </p>
            ) : (
              <div className="divide-y divide-line overflow-hidden rounded-lg border border-line">
                {q.practice.map((p) => (
                  <a
                    key={p.slug}
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex items-center gap-3 bg-surface-raised px-3 py-2.5 transition-colors hover:bg-surface-overlay"
                  >
                    {p.solved ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-label="Solved" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-fg-subtle" aria-hidden="true" />
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm text-fg">{p.title}</span>
                    <DifficultyPill difficulty={p.difficulty} />
                    <ExternalLink
                      className="h-4 w-4 shrink-0 text-fg-subtle transition-colors group-hover:text-brand"
                      aria-hidden="true"
                    />
                  </a>
                ))}
              </div>
            )}
            {unlocked < 3 && (
              <Button size="sm" className="mt-3" onClick={() => setUnlocked(3)}>
                Ready — go conquer it
              </Button>
            )}
          </StepBlock>
        )}

        {unlocked >= 3 && (
          <StepBlock
            n={3}
            title="Conquer the contest problem"
            icon={<Trophy className="h-4 w-4" aria-hidden="true" />}
            done={q.conquered}
          >
            <p className="mb-3 text-sm text-fg-muted">
              You&apos;ve learned it and practised it. Time to finish what the contest
              started.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`https://leetcode.com/problems/${q.slug}/`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-2 rounded-md border border-line bg-surface-overlay px-3.5 text-sm text-fg transition-colors hover:border-line-strong"
              >
                <PlayCircle className="h-4 w-4 text-brand" aria-hidden="true" />
                Open the problem
              </a>
              <Button
                variant={q.conquered ? "secondary" : "primary"}
                onClick={toggleConquered}
                loading={busy}
                icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                className={q.conquered ? "border-success/40 bg-success/10 text-success" : ""}
              >
                {q.conquered ? "Conquered — undo" : "Mark conquered"}
              </Button>
            </div>
          </StepBlock>
        )}
      </ol>
    </Card>
  );
}

function TagsPending({
  q,
  onChange,
}: {
  q: Question;
  onChange: (patch: Partial<Question>) => void;
}) {
  const [picking, setPicking] = useState(false);

  const pickTopic = async (tag: string) => {
    if (!tag) return;
    setPicking(true);
    try {
      // Goes through the shared fetcher so the basePath prefix is applied.
      const res = await fetcher(
        `/api/contest?questionSlug=${encodeURIComponent(q.slug)}&tag=${encodeURIComponent(
          tag
        )}&difficulty=${encodeURIComponent(q.difficulty)}`
      );
      onChange({
        tags: res.tags,
        tagsPending: false,
        videos: res.videos,
        practice: res.practice,
      });
    } finally {
      setPicking(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-fg-muted">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
        <span>
          LeetCode hasn&apos;t published tags for this brand-new problem yet. Pick the
          topic you think it tests and Guardian will tailor the plan — or come back
          later once tags are live.
        </span>
      </div>
      <div className="flex items-center gap-2">
        <select
          defaultValue=""
          disabled={picking}
          aria-label="Choose a topic for this problem"
          onChange={(e) => pickTopic(e.target.value)}
          className="input w-auto"
        >
          <option value="" disabled>
            Choose a topic…
          </option>
          {TOPIC_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        {picking && <span className="text-xs text-fg-muted">Loading…</span>}
      </div>
      <VideoList videos={q.videos} />
    </div>
  );
}

function VideoList({ videos }: { videos: Video[] }) {
  if (videos.length === 0)
    return <p className="text-sm text-fg-muted">No videos available.</p>;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {videos.map((v) => (
        <a
          key={v.url}
          href={v.url}
          target="_blank"
          rel="noreferrer"
          className="group flex items-start gap-2 rounded-lg border border-line bg-surface-overlay p-3 transition-colors hover:border-brand/60"
        >
          <PlayCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block text-sm leading-snug text-fg">{v.title}</span>
            <span className="mt-0.5 block text-xs text-fg-muted">{v.channel}</span>
          </span>
          <ExternalLink
            className="ml-auto h-3.5 w-3.5 shrink-0 text-fg-subtle transition-colors group-hover:text-brand"
            aria-hidden="true"
          />
        </a>
      ))}
    </div>
  );
}

function StepBlock({
  n,
  title,
  icon,
  done,
  children,
}: {
  n: number;
  title: string;
  icon: React.ReactNode;
  done?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="rounded-lg border border-line bg-surface-overlay/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span
          className={cn(
            "num grid h-6 w-6 place-items-center rounded-full text-xs font-semibold",
            done ? "bg-success text-brand-fg" : "bg-brand text-brand-fg"
          )}
        >
          {done ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : n}
        </span>
        <span className="flex items-center gap-1.5 text-sm font-medium text-fg">
          {icon}
          {title}
        </span>
      </div>
      <div className="pl-8">{children}</div>
    </li>
  );
}
