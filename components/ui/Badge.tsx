import { cn } from "@/lib/cn";

type Tone = "neutral" | "brand" | "success" | "warning" | "danger" | "flame";

const TONE: Record<Tone, string> = {
  neutral: "bg-surface-overlay text-fg-muted border-line",
  brand: "bg-brand/10 text-brand border-brand/25",
  success: "bg-success/10 text-success border-success/25",
  warning: "bg-warning/10 text-warning border-warning/25",
  danger: "bg-danger/10 text-danger border-danger/25",
  flame: "bg-flame/10 text-flame border-flame/25",
};

export function Badge({
  tone = "neutral",
  className,
  ...rest
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-medium",
        TONE[tone],
        className
      )}
      {...rest}
    />
  );
}
