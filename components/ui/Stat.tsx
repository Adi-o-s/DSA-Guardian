import { cn } from "@/lib/cn";

/** Compact metric tile used in dense stat rows. */
export function Stat({
  label,
  value,
  suffix,
  icon,
  className,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bg-surface-raised px-3 py-2.5", className)}>
      <div className="flex items-center gap-1.5 text-fg-muted text-xs">
        {icon}
        {label}
      </div>
      <div className="num mt-1 text-xl font-semibold text-fg">
        {value}
        {suffix && (
          <span className="text-sm font-normal text-fg-muted">{suffix}</span>
        )}
      </div>
    </div>
  );
}

/** Hairline-separated grid of Stats. */
export function StatGrid({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "grid gap-px rounded-lg border border-line bg-line overflow-hidden",
        className
      )}
      {...rest}
    />
  );
}
