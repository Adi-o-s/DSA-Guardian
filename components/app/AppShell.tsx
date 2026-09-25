"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  ListChecks,
  LifeBuoy,
  BarChart3,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { ToastProvider } from "@/components/ui";
import { ThemeToggle } from "./ThemeToggle";

type NavItem = { href: string; label: string; icon: React.ReactNode };

const NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/sheet", label: "Sheet", icon: <ListChecks className="h-4 w-4" /> },
  { href: "/upsolve", label: "Upsolve", icon: <LifeBuoy className="h-4 w-4" /> },
  { href: "/stats", label: "Stats", icon: <BarChart3 className="h-4 w-4" /> },
  { href: "/leaderboard", label: "Board", icon: <Users className="h-4 w-4" /> },
];

const SETTINGS: NavItem = {
  href: "/settings",
  label: "Settings",
  icon: <Settings className="h-4 w-4" />,
};

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function AppShell({
  user,
  signOutAction,
  children,
}: {
  user: { name?: string | null; image?: string | null };
  /** Server action bound in the layout. */
  signOutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const all = [...NAV, SETTINGS];

  return (
    <ToastProvider>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-brand-fg"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-4">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 text-md font-semibold text-fg"
          >
            <Shield className="h-5 w-5 text-brand" aria-hidden="true" />
            DSA Guardian
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-0.5 md:flex">
            {all.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                    active
                      ? "bg-surface-overlay font-medium text-fg"
                      : "text-fg-muted hover:bg-surface-overlay hover:text-fg"
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />

            <Link
              href={SETTINGS.href}
              aria-label="Settings"
              aria-current={isActive(pathname, SETTINGS.href) ? "page" : undefined}
              className="grid h-8 w-8 place-items-center rounded-md text-fg-muted transition-colors hover:bg-surface-overlay hover:text-fg md:hidden"
            >
              <Settings className="h-4 w-4" aria-hidden="true" />
            </Link>

            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt=""
                className="ml-1 h-7 w-7 rounded-full border border-line"
              />
            ) : null}
            <span className="hidden max-w-[10rem] truncate text-sm text-fg-muted lg:inline">
              {user.name}
            </span>

            <form action={signOutAction}>
              <button
                type="submit"
                aria-label="Sign out"
                className="grid h-8 w-8 place-items-center rounded-md text-fg-muted transition-colors hover:bg-surface-overlay hover:text-fg"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto max-w-5xl px-4 pb-24 pt-8 md:pb-16">
        {children}
      </main>

      {/* Mobile tab bar. Six top-level destinations do not fit a phone header. */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur md:hidden"
      >
        <ul className="mx-auto flex max-w-lg items-stretch">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-14 flex-col items-center justify-center gap-1 text-2xs transition-colors",
                    active ? "text-brand" : "text-fg-muted"
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </ToastProvider>
  );
}
