import { useId } from "react";
import { cn } from "@/lib/cn";

/**
 * Labelled form row. Wires label/hint to the control via aria so the hint is
 * announced, which the previous inline version did not do.
 */
export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: React.ReactNode;
  hint?: string;
  error?: string;
  /** Receives id + aria-describedby. */
  children: (props: { id: string; "aria-describedby": string | undefined }) => React.ReactNode;
  className?: string;
}) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="block text-sm font-medium text-fg">
        {label}
      </label>
      {children({ id, "aria-describedby": describedBy })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-fg-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function FieldSet({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      <div>
        <h2 className="text-md font-semibold text-fg">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-fg-muted">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}
