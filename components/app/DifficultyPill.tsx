import { cn } from "@/lib/cn";

const TONE: Record<string, string> = {
  Easy: "bg-diff-easy/10 text-diff-easy border-diff-easy/25",
  Medium: "bg-diff-medium/10 text-diff-medium border-diff-medium/25",
  Hard: "bg-diff-hard/10 text-diff-hard border-diff-hard/25",
};

const DOT: Record<string, string> = {
  Easy: "bg-diff-easy",
  Medium: "bg-diff-medium",
  Hard: "bg-diff-hard",
};

/** Difficulty as a pill (cards, headers) or a bare dot (dense rows). */
export function DifficultyPill({
  difficulty,
  variant = "pill",
  className,
}: {
  difficulty: string | null | undefined;
  variant?: "pill" | "dot";
  className?: string;
}) {
  if (!difficulty) return null;

  if (variant === "dot") {
    return (
      <span
        className={cn(
          "h-1.5 w-1.5 shrink-0 rounded-full",
          DOT[difficulty] ?? "bg-fg-subtle",
          className
        )}
        title={difficulty}
        role="img"
        aria-label={difficulty}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-2xs font-medium",
        TONE[difficulty] ?? "bg-surface-overlay text-fg-muted border-line",
        className
      )}
    >
      {difficulty}
    </span>
  );
}
