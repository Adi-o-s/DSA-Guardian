"use client";

import { Ring } from "@/components/ui";

/**
 * Thin compatibility wrapper over the generic Ring, kept so the dashboard and
 * upsolve pages can migrate independently.
 */
export function GoalRing({
  value,
  goal,
  label = "solved today",
  metLabel = "Goal met",
  tone = "brand",
  size = 132,
}: {
  value: number;
  goal: number;
  label?: string;
  metLabel?: string;
  tone?: "brand" | "success" | "danger" | "flame";
  size?: number;
}) {
  const met = goal > 0 && value >= goal;
  return (
    <Ring value={value} goal={goal} size={size} tone={tone} label={label}>
      <span className="num text-2xl font-semibold text-fg">
        {value}
        <span className="text-base font-normal text-fg-muted">/{goal}</span>
      </span>
      <span className="mt-0.5 text-2xs leading-tight text-fg-muted">
        {met ? metLabel : label}
      </span>
    </Ring>
  );
}
