"use client";

import { cn } from "@/lib/cn";

// GitHub-style contribution grid. Pure presentational: takes zero-filled daily
// counts (oldest → newest, last cell = today) and lays them out in week columns.
export type HeatCell = { date: string; count: number };

const CELL = 11;
const GAP = 3;
const STEP = CELL + GAP;
const PAD_LEFT = 28; // room for weekday labels
const PAD_TOP = 18; // room for month labels

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function utcDay(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 = Sun
}

// 5 intensity levels off the success token, so the grid re-themes with the app.
function fillClass(count: number): string {
  if (count <= 0) return "fill-surface-sunken";
  if (count === 1) return "fill-success/30";
  if (count === 2) return "fill-success/50";
  if (count === 3) return "fill-success/75";
  return "fill-success";
}

export function Heatmap({ data }: { data: HeatCell[] }) {
  if (data.length === 0) return null;
  const firstDow = utcDay(data[0].date);
  const numCols = Math.ceil((firstDow + data.length) / 7);

  const rects = data.map((cell, i) => {
    const p = firstDow + i;
    const col = Math.floor(p / 7);
    const row = p % 7;
    return (
      <rect
        key={cell.date}
        x={PAD_LEFT + col * STEP}
        y={PAD_TOP + row * STEP}
        width={CELL}
        height={CELL}
        rx={2}
        className={cn(fillClass(cell.count), "stroke-line/50")}
        strokeWidth={0.5}
      >
        <title>
          {cell.count} solved · {cell.date}
        </title>
      </rect>
    );
  });

  // Month label at the first column whose first cell starts a new month.
  const monthLabels: React.ReactNode[] = [];
  let lastMonth = -1;
  for (let i = 0; i < data.length; i++) {
    const p = firstDow + i;
    if (p % 7 !== 0) continue; // top row of a column
    const month = new Date(`${data[i].date}T00:00:00Z`).getUTCMonth();
    if (month !== lastMonth) {
      const col = Math.floor(p / 7);
      monthLabels.push(
        <text
          key={`m${i}`}
          x={PAD_LEFT + col * STEP}
          y={PAD_TOP - 6}
          fontSize={10}
          className="fill-fg-muted"
        >
          {MONTHS[month]}
        </text>
      );
      lastMonth = month;
    }
  }

  const weekdays = [
    { row: 1, label: "Mon" },
    { row: 3, label: "Wed" },
    { row: 5, label: "Fri" },
  ];
  const width = PAD_LEFT + numCols * STEP;
  const height = PAD_TOP + 7 * STEP;

  return (
    <div className="-mx-1 overflow-x-auto px-1">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Daily solve activity over the last year"
      >
        {monthLabels}
        {weekdays.map((w) => (
          <text
            key={w.label}
            x={0}
            y={PAD_TOP + w.row * STEP + CELL - 1}
            fontSize={10}
            className="fill-fg-muted"
          >
            {w.label}
          </text>
        ))}
        {rects}
      </svg>
    </div>
  );
}

/** Legend for the intensity ramp. */
export function HeatmapLegend() {
  return (
    <div className="flex items-center gap-1.5 text-xs text-fg-muted">
      <span>Less</span>
      <svg width={78} height={12} aria-hidden="true">
        {[0, 1, 2, 3, 4].map((n, i) => (
          <rect
            key={n}
            x={i * 15}
            y={0}
            width={11}
            height={11}
            rx={2}
            className={fillClass(n)}
          />
        ))}
      </svg>
      <span>More</span>
    </div>
  );
}
