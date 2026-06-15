"use client";

export function GoalRing({
  value,
  goal,
  label = "solved today",
  metLabel = "Goal met 🎉",
  color = "#5b8cff",
  size = 132,
}: {
  value: number;
  goal: number;
  label?: string;
  metLabel?: string;
  color?: string;
  size?: number;
}) {
  const stroke = size >= 120 ? 12 : 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = goal > 0 ? Math.min(1, value / goal) : 0;
  const met = value >= goal && goal > 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#252d3d"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={met ? "#22c55e" : color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
        <span className={size >= 120 ? "text-3xl font-bold" : "text-2xl font-bold"}>
          {value}
          <span className="text-muted text-base">/{goal}</span>
        </span>
        <span className="text-[11px] text-muted mt-0.5 leading-tight">
          {met ? metLabel : label}
        </span>
      </div>
    </div>
  );
}
