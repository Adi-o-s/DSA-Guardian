import { cn } from "@/lib/cn";

type Tone = "brand" | "success" | "warning" | "danger";

const FILL: Record<Tone, string> = {
  brand: "bg-brand",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export function ProgressBar({
  pct,
  tone = "brand",
  className,
  label,
}: {
  /** 0–100. */
  pct: number;
  tone?: Tone;
  className?: string;
  /** Accessible name. Omit only when an adjacent label already names it. */
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <div
      className={cn("h-1.5 rounded-full bg-surface-sunken overflow-hidden", className)}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", FILL[tone])}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
