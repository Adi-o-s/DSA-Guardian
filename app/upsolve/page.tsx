"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
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
import { post, patch, DIFF_COLOR } from "@/lib/client";
import { GoalRing } from "@/components/GoalRing";

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
    if (!value) return;
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

  const conqueredCount =
    plan?.questions.filter((q) => q.conquered).length ?? 0;

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
    <div className="space-y-8">
      {/* Intro */}
      <section className="rounded-xl border border-border bg-panel p-6 space-y-4">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-accent" />
            Upsolving Dashboard
          </h1>
          <p className="text-sm text-muted mt-1">
            Missed a few in a contest? That&apos;s where the real learning is. Drop
            in the contest and we&apos;ll build a calm, step-by-step recovery
            plan — one concept at a time.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            build(slug);
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="weekly-contest-380  (or paste the contest URL)"
            className="flex-1 rounded-md bg-panel2 border border-border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            <Search className={`h-4 w-4 ${loading ? "animate-pulse" : ""}`} />
            {loading ? "Building…" : "Build recovery plan"}
          </button>
        </form>
        <p className="text-xs text-muted">
          Find the slug in the contest URL, e.g.{" "}
          <code className="text-text">leetcode.com/contest/weekly-contest-380</code>
          .
        </p>
      </section>

      {error && (
        <div className="rounded-xl border border-hard/40 bg-hard/5 p-6 space-y-3">
          <p className="font-medium text-hard flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Couldn&apos;t load that contest
          </p>
          <p className="text-sm text-muted">{error}</p>
          <button
            onClick={() => build(slug)}
            className="rounded-md bg-panel2 border border-border px-3 py-2 text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {plan && (
        <>
          {/* Summary */}
          <section className="rounded-xl border border-border bg-panel p-6 flex flex-col sm:flex-row items-center gap-6">
            {plan.questions.length > 0 && (
              <GoalRing
                value={conqueredCount}
                goal={plan.questions.length}
                label="conquered"
                metLabel="All conquered 🎉"
                size={110}
                color="#22c55e"
              />
            )}
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{plan.contestTitle}</h2>
              <p className="text-sm text-muted mt-1">
                {plan.solvedCount}/{plan.total} solved in-contest ·{" "}
                {plan.questions.length} to upsolve · {conqueredCount} conquered
              </p>
            </div>
          </section>

          {plan.questions.length === 0 ? (
            <section className="rounded-xl border border-easy/40 bg-easy/5 p-8 text-center space-y-2">
              <Sparkles className="h-8 w-8 text-easy mx-auto" />
              <h3 className="text-lg font-semibold">Clean sweep! 🎉</h3>
              <p className="text-muted text-sm">
                You&apos;ve already solved every problem in this contest. Nothing
                left to upsolve — go pick your next challenge.
              </p>
            </section>
          ) : (
            <div className="space-y-5">
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
    <section
      className={`rounded-xl border p-5 space-y-4 transition-colors ${
        q.conquered ? "border-easy/40 bg-easy/5" : "border-border bg-panel"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted tabular-nums">Q{index + 1}</span>
            <span className={`text-xs font-semibold ${DIFF_COLOR[q.difficulty] ?? "text-muted"}`}>
              {q.difficulty}
            </span>
            {q.credit > 0 && (
              <span className="text-xs text-muted">· {q.credit} pts</span>
            )}
          </div>
          <h3 className="text-base font-semibold mt-0.5">{q.title}</h3>
        </div>
        <button
          onClick={toggleAttempted}
          className={`shrink-0 flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
            q.attempted
              ? "border-accent/40 bg-accent/10 text-accent"
              : "border-border bg-panel2 text-muted hover:text-text"
          }`}
          title="Did you attempt this during the contest?"
        >
          {q.attempted ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <Circle className="h-3.5 w-3.5" />
          )}
          I attempted this
        </button>
      </div>

      {/* Step 1: Learn the concept */}
      <StepBlock
        n={1}
        title="Learn the concept"
        icon={<GraduationCap className="h-4 w-4" />}
        active
      >
        {q.tagsPending ? (
          <TagsPending q={q} onChange={onChange} />
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {q.tags.map((t) => (
                <span
                  key={t}
                  className="rounded bg-panel2 border border-border px-1.5 py-0.5 text-[11px] text-muted capitalize"
                >
                  {t.replace(/-/g, " ")}
                </span>
              ))}
            </div>
            <VideoList videos={q.videos} />
          </>
        )}
        {unlocked < 2 && (
          <button
            onClick={() => setUnlocked(2)}
            className="mt-3 text-sm text-accent hover:underline"
          >
            Got the concept → show practice
          </button>
        )}
      </StepBlock>

      {/* Step 2: Practice similar */}
      {unlocked >= 2 && (
        <StepBlock
          n={2}
          title="Practice on fresh problems"
          icon={<Dumbbell className="h-4 w-4" />}
          active
        >
          {q.practice.length === 0 ? (
            <p className="text-sm text-muted">
              No close matches found for these tags. Head straight to the contest
              problem below — you&apos;ve got the concept now.
            </p>
          ) : (
            <div className="rounded-lg border border-border bg-panel2 divide-y divide-border">
              {q.practice.map((p) => (
                <a
                  key={p.slug}
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-border group"
                >
                  {p.solved ? (
                    <CheckCircle2 className="h-4 w-4 text-easy shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted shrink-0" />
                  )}
                  <span className="flex-1 text-sm">{p.title}</span>
                  <span className={`text-xs ${DIFF_COLOR[p.difficulty] ?? "text-muted"}`}>
                    {p.difficulty}
                  </span>
                  <ExternalLink className="h-4 w-4 text-muted group-hover:text-accent" />
                </a>
              ))}
            </div>
          )}
          {unlocked < 3 && (
            <button
              onClick={() => setUnlocked(3)}
              className="mt-3 text-sm text-accent hover:underline"
            >
              Ready → go conquer the contest problem
            </button>
          )}
        </StepBlock>
      )}

      {/* Step 3: Conquer */}
      {unlocked >= 3 && (
        <StepBlock
          n={3}
          title="Conquer the contest problem"
          icon={<Trophy className="h-4 w-4" />}
          active
        >
          <p className="text-sm text-muted mb-3">
            You&apos;ve learned it and practiced it. Time to finish what the
            contest started — you&apos;ve got this. 💪
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`https://leetcode.com/problems/${q.slug}/`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-md bg-panel2 border border-border px-3 py-2 text-sm hover:bg-border"
            >
              <PlayCircle className="h-4 w-4 text-accent" />
              Open the problem
            </a>
            <button
              onClick={toggleConquered}
              disabled={busy}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium disabled:opacity-50 ${
                q.conquered
                  ? "bg-easy/15 text-easy border border-easy/40"
                  : "bg-easy text-white hover:opacity-90"
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              {q.conquered ? "Conquered ✓ (undo)" : "Mark conquered"}
            </button>
          </div>
        </StepBlock>
      )}
    </section>
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
      const res = await fetch(
        `/api/contest?questionSlug=${encodeURIComponent(
          q.slug
        )}&tag=${encodeURIComponent(tag)}&difficulty=${encodeURIComponent(
          q.difficulty
        )}`
      ).then((r) => r.json());
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
      <div className="rounded-lg border border-medium/40 bg-medium/10 p-3 text-sm text-muted flex gap-2">
        <AlertTriangle className="h-4 w-4 text-medium shrink-0 mt-0.5" />
        <span>
          LeetCode hasn&apos;t published tags for this brand-new problem yet. Pick
          the topic you think it tests and we&apos;ll tailor the plan — or come
          back later once tags are live.
        </span>
      </div>
      <div className="flex items-center gap-2">
        <select
          defaultValue=""
          disabled={picking}
          onChange={(e) => pickTopic(e.target.value)}
          className="rounded-md bg-panel2 border border-border px-3 py-2 text-sm"
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
        {picking && <span className="text-xs text-muted">Loading…</span>}
      </div>
      {/* Default "how to upsolve" videos are always available. */}
      <VideoList videos={q.videos} />
    </div>
  );
}

function VideoList({ videos }: { videos: Video[] }) {
  if (videos.length === 0)
    return <p className="text-sm text-muted">No videos available.</p>;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {videos.map((v) => (
        <a
          key={v.url}
          href={v.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-start gap-2 rounded-lg border border-border bg-panel2 p-3 hover:border-accent/60 group"
        >
          <PlayCircle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <span className="min-w-0">
            <span className="block text-sm leading-snug">{v.title}</span>
            <span className="block text-xs text-muted mt-0.5">{v.channel}</span>
          </span>
          <ExternalLink className="h-3.5 w-3.5 text-muted group-hover:text-accent ml-auto shrink-0" />
        </a>
      ))}
    </div>
  );
}

function StepBlock({
  n,
  title,
  icon,
  active,
  children,
}: {
  n: number;
  title: string;
  icon: React.ReactNode;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-panel2/40 p-4">
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
            active ? "bg-accent text-white" : "bg-panel2 text-muted"
          }`}
        >
          {n}
        </span>
        <span className="flex items-center gap-1.5 text-sm font-medium">
          {icon}
          {title}
        </span>
      </div>
      <div className="pl-8">{children}</div>
    </div>
  );
}
