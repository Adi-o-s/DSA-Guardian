import type { Metadata } from "next";
import Link from "next/link";
import {
  Shield,
  LayoutDashboard,
  ListChecks,
  LifeBuoy,
  Settings,
  Github,
  LogOut,
  Flame,
  Target,
  Trophy,
  Lock,
  ArrowRight,
} from "lucide-react";
import { auth, signIn, signOut } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "DSA Guardian",
  description: "Striver A2Z + LeetCode daily practice guardian",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user;

  return (
    <html lang="en">
      <body className="min-h-screen">
        {user ? (
          <>
            <header className="border-b border-border bg-panel/60 backdrop-blur sticky top-0 z-20">
              <div className="mx-auto max-w-5xl px-4 h-14 flex items-center gap-6">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                  <Shield className="h-5 w-5 text-accent" />
                  DSA Guardian
                </Link>
                <nav className="flex items-center gap-1 text-sm text-muted">
                  <NavLink href="/" icon={<LayoutDashboard className="h-4 w-4" />}>
                    Dashboard
                  </NavLink>
                  <NavLink href="/sheet" icon={<ListChecks className="h-4 w-4" />}>
                    Sheet
                  </NavLink>
                  <NavLink href="/upsolve" icon={<LifeBuoy className="h-4 w-4" />}>
                    Upsolve
                  </NavLink>
                  <NavLink href="/settings" icon={<Settings className="h-4 w-4" />}>
                    Settings
                  </NavLink>
                </nav>
                <div className="ml-auto flex items-center gap-3 text-sm">
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.image}
                      alt=""
                      className="h-7 w-7 rounded-full border border-border"
                    />
                  ) : null}
                  <span className="text-muted hidden sm:inline">{user.name}</span>
                  <form
                    action={async () => {
                      "use server";
                      await signOut({ redirectTo: "/" });
                    }}
                  >
                    <button
                      type="submit"
                      title="Sign out"
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-muted hover:bg-panel2 hover:text-text transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>
            </header>
            <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
          </>
        ) : (
          <SignIn />
        )}
      </body>
    </html>
  );
}

function SignIn() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Animated aurora backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="aurora-blob absolute -top-32 -left-24 h-[26rem] w-[26rem] rounded-full bg-accent/25 blur-3xl" />
        <div
          className="aurora-blob absolute top-1/3 -right-24 h-[24rem] w-[24rem] rounded-full bg-easy/15 blur-3xl"
          style={{ animationDelay: "-5s" }}
        />
        <div
          className="aurora-blob absolute -bottom-40 left-1/3 h-[24rem] w-[24rem] rounded-full bg-medium/10 blur-3xl"
          style={{ animationDelay: "-9s" }}
        />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
      </div>

      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-2">
        {/* LEFT — brand story */}
        <section className="relative hidden flex-col justify-between p-12 lg:flex">
          <div
            className="flex items-center gap-2 text-lg font-semibold animate-fade-up"
          >
            <Shield className="h-6 w-6 text-accent" />
            DSA Guardian
          </div>

          <div className="space-y-8">
            <h1
              className="text-4xl font-bold leading-[1.15] animate-fade-up"
              style={{ animationDelay: "0.05s" }}
            >
              Your daily guardian for{" "}
              <span className="bg-gradient-to-r from-accent via-accent to-easy bg-clip-text text-transparent">
                DSA mastery
              </span>
              .
            </h1>
            <p
              className="max-w-md text-muted animate-fade-up"
              style={{ animationDelay: "0.12s" }}
            >
              Striver&apos;s A2Z sheet, your live LeetCode progress, daily goals,
              and contest upsolving — unified in one streak-driven dashboard.
            </p>

            <ul className="space-y-3">
              <Feature
                icon={<Flame className="h-5 w-5 text-medium" />}
                title="Build an unbreakable streak"
                desc="Hit your daily questions goal and watch the fire grow."
                delay="0.2s"
              />
              <Feature
                icon={<Target className="h-5 w-5 text-accent" />}
                title="Smart Hard recommendations"
                desc="Company-tagged picks from the topics you've completed."
                delay="0.28s"
              />
              <Feature
                icon={<Trophy className="h-5 w-5 text-easy" />}
                title="Turn contest losses into wins"
                desc="Guided upsolving with concepts, practice, and tracking."
                delay="0.36s"
              />
            </ul>
          </div>

          <div
            className="flex items-center gap-2 animate-fade-up"
            style={{ animationDelay: "0.44s" }}
          >
            <Chip label="Easy" className="text-easy border-easy/30 bg-easy/10" />
            <Chip
              label="Medium"
              className="text-medium border-medium/30 bg-medium/10"
            />
            <Chip label="Hard" className="text-hard border-hard/30 bg-hard/10" />
            <span className="ml-2 text-xs text-muted">
              3,900+ problems mapped
            </span>
          </div>
        </section>

        {/* RIGHT — sign-in card */}
        <section className="flex items-center justify-center p-6 lg:p-12">
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-panel/70 p-8 shadow-2xl backdrop-blur-xl animate-fade-up"
            style={{ animationDelay: "0.1s" }}
          >
            {/* Pulsing shield crest */}
            <div className="mx-auto grid h-16 w-16 place-items-center">
              <div className="ring-pulse grid h-16 w-16 place-items-center rounded-2xl border border-accent/30 bg-accent/15">
                <Shield className="h-8 w-8 text-accent" />
              </div>
            </div>

            <h2 className="mt-6 text-center text-2xl font-semibold">
              Welcome, Guardian
            </h2>
            <p className="mt-2 text-center text-sm text-muted">
              Sign in to pick up your streak where you left off.
            </p>

            <form
              action={async () => {
                "use server";
                await signIn("github", { redirectTo: "/" });
              }}
              className="mt-7"
            >
              <button
                type="submit"
                className="btn-sheen group flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 font-medium text-black shadow-lg shadow-accent/20 transition-all hover:shadow-accent/40 hover:brightness-110"
              >
                <Github className="h-5 w-5" />
                Continue with GitHub
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs text-muted">
              <span className="h-px flex-1 bg-border" />
              SECURE OAUTH
              <span className="h-px flex-1 bg-border" />
            </div>

            <ul className="space-y-2 text-xs text-muted">
              <TrustPoint text="We only read your public GitHub profile." />
              <TrustPoint text="Your LeetCode session is encrypted at rest." />
              <TrustPoint text="Your data is yours — isolated per account." />
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}

function Feature({
  icon,
  title,
  desc,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  delay: string;
}) {
  return (
    <li
      className="flex items-start gap-3 animate-fade-up"
      style={{ animationDelay: delay }}
    >
      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-panel2/60">
        {icon}
      </span>
      <div>
        <p className="font-medium text-text">{title}</p>
        <p className="text-sm text-muted">{desc}</p>
      </div>
    </li>
  );
}

function Chip({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}

function TrustPoint({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2">
      <Lock className="h-3.5 w-3.5 text-easy" />
      {text}
    </li>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-panel2 hover:text-text transition-colors"
    >
      {icon}
      {children}
    </Link>
  );
}
