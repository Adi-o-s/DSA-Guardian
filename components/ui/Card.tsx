import { cn } from "@/lib/cn";

/** The one panel surface. Everything boxed in the app uses this. */
export function Card({
  className,
  as: Tag = "div",
  ...rest
}: React.HTMLAttributes<HTMLElement> & { as?: "div" | "section" | "article" }) {
  return (
    <Tag
      className={cn(
        "rounded-card border border-line bg-surface-raised shadow-card",
        className
      )}
      {...rest}
    />
  );
}

/** A card whose children are separated rows rather than free-form content. */
export function CardList({
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-card border border-line bg-surface-raised overflow-hidden divide-y divide-line",
        className
      )}
      {...rest}
    />
  );
}
