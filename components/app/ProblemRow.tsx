"use client";

import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/cn";
import { DifficultyPill } from "./DifficultyPill";

/**
 * The single row used everywhere a problem appears in a list — Continue, weak
 * areas, sheet items. Replaces three copy-pasted variants.
 */
export function ProblemRow({
  index,
  title,
  href,
  difficulty,
  meta,
  leading,
  trailing,
  solved,
  className,
}: {
  /** 1-based position, shown when present. */
  index?: number;
  title: string;
  /** When set the whole row is a link to the problem. */
  href?: string | null;
  difficulty?: string | null;
  /** Secondary text (topic, tag), hidden on small screens. */
  meta?: string;
  /** Control rendered before the title, e.g. a solved toggle. */
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  solved?: boolean;
  className?: string;
}) {
  const body = (
    <>
      {index !== undefined && (
        <span className="num w-5 shrink-0 text-sm text-fg-subtle">{index}</span>
      )}
      {leading}
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-sm",
          solved ? "text-fg-muted line-through" : "text-fg"
        )}
      >
        {title}
      </span>
      {meta && (
        <span className="hidden shrink-0 text-xs capitalize text-fg-subtle sm:inline">
          {meta.replace(/-/g, " ")}
        </span>
      )}
      <DifficultyPill difficulty={difficulty} variant="dot" />
      {trailing ??
        (href ? (
          <ExternalLink
            className="h-4 w-4 shrink-0 text-fg-subtle transition-colors group-hover:text-brand"
            aria-hidden="true"
          />
        ) : null)}
    </>
  );

  const shared = cn(
    "group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-overlay",
    className
  );

  if (!href) return <div className={shared}>{body}</div>;

  return (
    <a href={href} target="_blank" rel="noreferrer" className={shared}>
      {body}
    </a>
  );
}
