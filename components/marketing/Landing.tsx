import {
  Shield,
  Github,
  ArrowRight,
  Flame,
  Target,
  Trophy,
  Lock,
  ListChecks,
  BarChart3,
  Users,
  Plus,
  ExternalLink,
} from "lucide-react";
import { signIn } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { ThemeToggle } from "@/components/app/ThemeToggle";

/**
 * Signed-out home. The whole product story plus the single GitHub CTA — the
 * root route stays dual-mode (landing when signed out, dashboard when signed
 * in) so the fragile basePath + NextAuth wiring is untouched.
 */
export function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <Aurora />

      <header className="relative z-10 mx-auto flex h-16 max-w-6xl items-center gap-3 px-5">
        <span className="flex shrink-0 items-center gap-2 whitespace-nowrap text-md font-semibold text-fg">
          <Shield className="h-5 w-5 text-brand" aria-hidden="true" />
          DSA Guardian
        </span>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <SignInButton size="sm" />
        </div>
      </header>

      <main id="main">
        <section className="relative z-10 mx-auto max-w-6xl px-5 pb-16 pt-10 lg:pb-24 lg:pt-20">
          <div className="grid items-center gap-14 lg:grid-cols-[1fr_minmax(0,26rem)]">
            <div>
              <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-line bg-surface-raised/70 px-3 py-1 text-xs text-fg-muted backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
                Striver A2Z · 456 problems · 3,900+ mapped
              </span>

              <h1
                className="animate-fade-up mt-6 text-3xl font-semibold leading-[1.1] tracking-tight text-fg sm:text-display lg:text-display-lg"
                style={{ animationDelay: "0.05s" }}
              >
                Your daily guardian for{" "}
                <span className="text-brand">DSA mastery</span>.
              </h1>

              <p
                className="animate-fade-up mt-5 max-w-xl text-lg leading-relaxed text-fg-muted"
                style={{ animationDelay: "0.12s" }}
              >
                Striver&apos;s A2Z sheet, your live LeetCode progress, daily goals and
                contest upsolving — unified in one streak-driven dashboard that tells
                you exactly which question to open next.
              </p>

              <div
                className="animate-fade-up mt-8 flex flex-wrap items-center gap-4"
                style={{ animationDelay: "0.2s" }}
              >
                <SignInButton />
                <span className="text-sm text-fg-subtle">
                  Free · no card · your data stays yours
                </span>
              </div>

              <ul
                className="animate-fade-up mt-10 grid gap-3 sm:grid-cols-3"
                style={{ animationDelay: "0.28s" }}
              >
                <MiniPoint icon={<Flame className="h-4 w-4 text-flame" />} text="Streak that means something" />
                <MiniPoint icon={<Target className="h-4 w-4 text-brand" />} text="Company-tagged Hard picks" />
                <MiniPoint icon={<Trophy className="h-4 w-4 text-success" />} text="Turn contest losses into wins" />
              </ul>
            </div>

            <div className="animate-fade-up" style={{ animationDelay: "0.18s" }}>
              <DashboardPreview />
            </div>
          </div>
        </section>

        <section className="relative z-10 border-y border-line bg-surface-raised/40 backdrop-blur">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:grid-cols-3">
            <Feature
              icon={<Flame className="h-5 w-5 text-flame" />}
              title="A streak you can't fake"
              body="Set a daily questions goal and a separate Hard goal. The streak only advances on days you actually hit the number — synced from LeetCode, not self-reported."
            />
            <Feature
              icon={<Target className="h-5 w-5 text-brand" />}
              title="Recommendations that earn their place"
              body="Once a topic passes 80%, Guardian pulls Hard problems from that topic out of a company-tagged bank and ranks them by how often they're actually asked."
            />
            <Feature
              icon={<Trophy className="h-5 w-5 text-success" />}
              title="Upsolving, made survivable"
              body="Drop in a contest you bombed. Guardian breaks each missed question into concepts, editorial videos and warm-up problems, then tracks what you conquered."
            />
          </div>
        </section>

        <section className="relative z-10 mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-2xl font-semibold tracking-tight text-fg">
            Everything in one place
          </h2>
          <p className="mt-2 max-w-2xl text-md text-fg-muted">
            No more juggling a spreadsheet, a YouTube playlist and three browser tabs.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <SurfaceCard
              icon={<ListChecks className="h-5 w-5 text-brand" />}
              title="The sheet, alive"
              body="All 18 steps and 456 problems, ordered to the NeetCode roadmap flow, auto-checked from your LeetCode account. Manual toggles for the items LeetCode can't see."
            />
            <SurfaceCard
              icon={<BarChart3 className="h-5 w-5 text-success" />}
              title="Stats that point somewhere"
              body="A year-long activity heatmap plus per-tag strength and weakness, so 'what should I practise' has an answer instead of a feeling."
            />
            <SurfaceCard
              icon={<Users className="h-5 w-5 text-flame" />}
              title="Friends on the board"
              body="Follow people by GitHub handle and compare streaks and weekly volume. Global board too, if you want to know where you really stand."
            />
          </div>
        </section>

        <section className="relative z-10 border-y border-line bg-surface-raised/40 backdrop-blur">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-fg">
                How the LeetCode sync works
              </h2>
              <p className="mt-3 text-md leading-relaxed text-fg-muted">
                LeetCode has no official API, so Guardian uses its public GraphQL endpoint
                through a server-side proxy. Two modes, and the second one is entirely
                optional.
              </p>
              <dl className="mt-6 space-y-5">
                <div>
                  <dt className="text-md font-medium text-fg">Public sync — no login</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-fg-muted">
                    Just your username. Guardian reads your solved counts and last ~20
                    accepted submissions, and merges them over time as you keep solving.
                  </dd>
                </div>
                <div>
                  <dt className="text-md font-medium text-fg">Full sync — optional cookie</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-fg-muted">
                    Paste your LeetCode session cookie once to backfill your entire solved
                    history. It&apos;s encrypted at rest and used only to talk to LeetCode
                    on your behalf. Delete it any time from Settings.
                  </dd>
                </div>
              </dl>
            </div>

            <ul className="space-y-3 self-center">
              <TrustPoint text="Sign-in reads nothing beyond your public GitHub profile." />
              <TrustPoint text="Your LeetCode session cookie is encrypted at rest, never logged." />
              <TrustPoint text="Every account's data is isolated at the database layer." />
              <TrustPoint text="No trackers, no ads, no selling your practice history." />
            </ul>
          </div>
        </section>

        <section className="relative z-10 mx-auto max-w-3xl px-5 py-16">
          <h2 className="text-2xl font-semibold tracking-tight text-fg">
            Questions people actually ask
          </h2>
          <div className="mt-7 divide-y divide-line border-y border-line">
            <Faq
              q="Do I have to hand over my LeetCode password?"
              a="No — and there's no way to. Public sync needs only your username. Full sync uses a session cookie you paste yourself and can revoke at any time."
            />
            <Faq
              q="What counts as a day?"
              a="The LeetCode day, which rolls over at UTC midnight. If you'd rather it matched your local reset, set a day offset in Settings."
            />
            <Faq
              q="When does a topic count as complete?"
              a="At 80% of its LeetCode-linked problems by default. Completed topics are what unlock targeted Hard recommendations — you can move the threshold in Settings."
            />
            <Faq
              q="Why GitHub sign-in?"
              a="It's one click, it gives every account a stable public handle for the friends leaderboard, and it means Guardian never stores a password."
            />
          </div>
        </section>

        <section className="relative z-10 mx-auto max-w-6xl px-5 pb-24">
          <div className="rounded-card border border-line bg-surface-raised p-10 text-center shadow-card">
            <div className="ring-pulse mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-brand/30 bg-brand/15">
              <Shield className="h-7 w-7 text-brand" aria-hidden="true" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold tracking-tight text-fg">
              Start the streak today
            </h2>
            <p className="mx-auto mt-2 max-w-md text-md text-fg-muted">
              Sign in, add your LeetCode username, and Guardian will have your first Hard
              picks ready in under a minute.
            </p>
            <div className="mt-7 flex justify-center">
              <SignInButton />
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-5 py-8 text-xs text-fg-subtle">
          <span className="flex items-center gap-1.5 text-fg-muted">
            <Shield className="h-4 w-4 text-brand" aria-hidden="true" />
            DSA Guardian
          </span>
          <span>Sheet data: Striver A2Z via takeuforward.org</span>
          <span>Difficulty and tags: LeetCode public GraphQL</span>
          <a
            href="https://github.com/Adi-o-s/DSA-Guardian"
            target="_blank"
            rel="noreferrer"
            className="ml-auto inline-flex items-center gap-1.5 text-fg-muted transition-colors hover:text-fg"
          >
            Source
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </footer>
    </div>
  );
}

function SignInButton({ size = "lg" }: { size?: "sm" | "lg" }) {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("github", { redirectTo: "/" });
      }}
    >
      <button
        type="submit"
        className={cn(
          "btn-sheen group inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-brand font-medium text-brand-fg transition-all hover:brightness-110",
          size === "lg" ? "px-5 py-3 text-md" : "px-3.5 py-2 text-sm"
        )}
      >
        <Github className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} aria-hidden="true" />
        {size === "lg" ? (
          "Continue with GitHub"
        ) : (
          <>
            <span className="hidden sm:inline">Continue with GitHub</span>
            <span className="sm:hidden">Sign in</span>
          </>
        )}
        {size === "lg" && (
          <ArrowRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        )}
      </button>
    </form>
  );
}

function Aurora() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
      <div className="aurora-blob absolute -left-24 -top-32 h-[26rem] w-[26rem] rounded-full bg-brand/20 blur-3xl" />
      <div
        className="aurora-blob absolute -right-24 top-1/3 h-[24rem] w-[24rem] rounded-full bg-success/10 blur-3xl"
        style={{ animationDelay: "-5s" }}
      />
      <div
        className="aurora-blob absolute -bottom-40 left-1/3 h-[24rem] w-[24rem] rounded-full bg-flame/10 blur-3xl"
        style={{ animationDelay: "-9s" }}
      />
    </div>
  );
}

/** Static preview of the real dashboard, built from the same tokens. */
function DashboardPreview() {
  return (
    <div className="rounded-card border border-line bg-surface-raised/80 p-1 shadow-pop backdrop-blur">
      <div className="flex items-center gap-1.5 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-line-strong" />
        <span className="h-2 w-2 rounded-full bg-line-strong" />
        <span className="h-2 w-2 rounded-full bg-line-strong" />
        <span className="ml-2 text-2xs text-fg-subtle">Today</span>
      </div>

      <div className="space-y-3 rounded-[0.6rem] border border-line bg-surface p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-fg">Hi, Adi-o-s</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-flame/30 bg-flame/10 px-2 py-0.5 text-2xs font-medium text-flame">
            <Flame className="h-3 w-3" aria-hidden="true" />
            <span className="num">14</span> days
          </span>
        </div>

        <div className="grid grid-cols-4 gap-px overflow-hidden rounded-lg border border-line bg-line">
          <PreviewStat label="Today" value="2" suffix="/3" />
          <PreviewStat label="Hard" value="1" suffix="/2" />
          <PreviewStat label="Topics" value="7" suffix="/18" />
          <PreviewStat label="Solved" value="284" />
        </div>

        <div className="overflow-hidden rounded-lg border border-line">
          <PreviewRow title="Median of two sorted arrays" meta="64%" />
          <PreviewRow title="Word ladder II" meta="41%" />
          <PreviewRow title="Largest rectangle in histogram" meta="38%" last />
        </div>
      </div>
    </div>
  );
}

function PreviewStat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="bg-surface-raised px-2.5 py-2">
      <div className="text-2xs text-fg-subtle">{label}</div>
      <div className="num mt-0.5 text-md font-semibold text-fg">
        {value}
        {suffix && <span className="text-2xs font-normal text-fg-subtle">{suffix}</span>}
      </div>
    </div>
  );
}

function PreviewRow({
  title,
  meta,
  last,
}: {
  title: string;
  meta: string;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 bg-surface-raised px-3 py-2",
        !last && "border-b border-line"
      )}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-diff-hard" />
      <span className="min-w-0 flex-1 truncate text-xs text-fg">{title}</span>
      <span className="num text-2xs text-fg-subtle">{meta}</span>
    </div>
  );
}

function MiniPoint({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-2 rounded-lg border border-line bg-surface-raised/60 px-3 py-2.5 text-sm text-fg-muted backdrop-blur">
      <span className="shrink-0" aria-hidden="true">
        {icon}
      </span>
      {text}
    </li>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div>
      <span className="grid h-10 w-10 place-items-center rounded-lg border border-line bg-surface-overlay">
        {icon}
      </span>
      <h3 className="mt-4 text-md font-semibold text-fg">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{body}</p>
    </div>
  );
}

function SurfaceCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-card border border-line bg-surface-raised p-5 shadow-card">
      <span className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-surface-overlay">
        {icon}
      </span>
      <h3 className="mt-4 text-md font-semibold text-fg">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{body}</p>
    </div>
  );
}

function TrustPoint({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-fg-muted">
      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
      {text}
    </li>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="group py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-md font-medium text-fg">
        {q}
        <Plus
          className="h-4 w-4 shrink-0 text-fg-subtle transition-transform group-open:rotate-45"
          aria-hidden="true"
        />
      </summary>
      <p className="mt-2.5 text-sm leading-relaxed text-fg-muted">{a}</p>
    </details>
  );
}
