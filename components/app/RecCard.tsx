"use client";

import { CheckCircle2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui";
import { DifficultyPill } from "./DifficultyPill";
import { CompanyTags } from "./CompanyTags";

export type Recommendation = {
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

/** A recommended Hard problem. The one card type that carries company context. */
export function RecCard({ rec }: { rec: Recommendation }) {
  const done = rec.status === "done";
  return (
    <a
      href={rec.url}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "group flex flex-col gap-2.5 rounded-card border p-4 transition-colors",
        done
          ? "border-success/40 bg-success/5"
          : "border-line bg-surface-raised hover:border-brand/60"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-md font-medium leading-snug text-fg">{rec.title}</span>
        {done ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-label="Solved" />
        ) : (
          <ExternalLink
            className="h-4 w-4 shrink-0 text-fg-subtle transition-colors group-hover:text-brand"
            aria-hidden="true"
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DifficultyPill difficulty={rec.difficulty} />
        <span className="truncate text-xs text-fg-muted">{rec.stepTitle}</span>
        {rec.fallback && <Badge tone="warning">In progress</Badge>}
        {rec.frequency > 0 && (
          <span className="num ml-auto text-xs text-fg-subtle">
            asked {rec.frequency}%
          </span>
        )}
      </div>

      <CompanyTags companies={rec.companies} />
    </a>
  );
}
