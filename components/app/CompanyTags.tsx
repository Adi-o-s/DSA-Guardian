import { cn } from "@/lib/cn";

/** Company-ask tags, truncated with a +N overflow so cards stay one height. */
export function CompanyTags({
  companies,
  max = 3,
  className,
}: {
  companies: string[];
  max?: number;
  className?: string;
}) {
  if (companies.length === 0) return null;
  const shown = companies.slice(0, max);
  const rest = companies.length - shown.length;

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {shown.map((c) => (
        <span
          key={c}
          className="rounded border border-line bg-surface-overlay px-1.5 py-0.5 text-2xs capitalize text-fg-muted"
        >
          {c.replace(/-/g, " ")}
        </span>
      ))}
      {rest > 0 && (
        <span className="text-2xs text-fg-subtle" title={companies.slice(max).join(", ")}>
          +{rest}
        </span>
      )}
    </div>
  );
}
