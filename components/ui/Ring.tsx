"use client";

import { cn } from "@/lib/cn";

type Tone = "brand" | "success" | "danger" | "flame";

const STROKE: Record<Tone, string> = {
  brand: "stroke-brand",
  success: "stroke-success",
  danger: "stroke-diff-hard",
  flame: "stroke-flame",
};

/**
 * Progress ring. Token-driven: the arc colour comes from a Tailwind stroke
 * utility so it re-themes with the rest of the app.
 */
export function Ring({
  value,
  goal,
  size = 120,
  tone = "brand",
  metTone = "success",
  children,
  label,
  className,
}: {
  value: number;
  goal: number;
  size?: number;
  tone?: Tone;
  metTone?: Tone;
  /** Centre content. Falls back to value/goal when omitted. */
  children?: React.ReactNode;
  /** Accessible description of what the ring measures. */
  label: string;
  className?: string;
}) {
  const stroke = size >= 120 ? 11 : 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = goal > 0 ? Math.min(1, value / goal) : 0;
  const met = goal > 0 && value >= goal;

  return (
    <div
      className={cn("relative", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: ${value} of ${goal}`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-surface-sunken dark:stroke-line"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className={cn("transition-[stroke-dashoffset] duration-500 ease-out", met ? STROKE[metTone] : STROKE[tone])}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
        {children ?? (
          <span className="num text-2xl font-semibold">
            {value}
            <span className="text-fg-muted text-base font-normal">/{goal}</span>
          </span>
        )}
      </div>
    </div>
  );
}
