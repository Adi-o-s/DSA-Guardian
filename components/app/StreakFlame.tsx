import { Flame } from "lucide-react";
import { cn } from "@/lib/cn";

/** Streak indicator. Goes cold (neutral) at zero so the fire means something. */
export function StreakFlame({
  streak,
  size = "md",
  className,
}: {
  streak: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const lit = streak > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1.5 text-sm",
        lit
          ? "border-flame/30 bg-flame/10 text-flame"
          : "border-line bg-surface-overlay text-fg-muted",
        className
      )}
      title="Consecutive days you met your daily questions goal"
    >
      <Flame className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden="true" />
      <span className="num font-semibold">{streak}</span>
      <span className="font-normal">day{streak === 1 ? "" : "s"}</span>
    </span>
  );
}
