import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { ProgressBar } from "@/components/ui";

/** Solved/total plus a bar, used for sheet steps and tag strength rows. */
export function TopicProgress({
  solved,
  total,
  pct,
  complete,
  className,
  barClassName,
  label,
}: {
  solved: number;
  total: number;
  pct: number;
  complete?: boolean;
  className?: string;
  barClassName?: string;
  label: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span className="num text-xs text-fg-muted">
        {solved}/{total}
      </span>
      <ProgressBar
        pct={pct}
        tone={complete ? "success" : "brand"}
        label={`${label} progress`}
        className={cn("w-20", barClassName)}
      />
      {complete && (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-label="Topic complete" />
      )}
    </div>
  );
}
