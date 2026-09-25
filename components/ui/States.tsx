import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-surface-raised", className)}
      aria-hidden="true"
    />
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-card border border-dashed border-line bg-surface-raised/50 px-6 py-10 text-center",
        className
      )}
    >
      {icon && (
        <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-lg border border-line bg-surface-overlay text-fg-muted">
          {icon}
        </div>
      )}
      <p className="text-md font-medium text-fg">{title}</p>
      {description && (
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-fg-muted">{description}</p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-card border border-danger/30 bg-danger/5 p-6 space-y-3",
        className
      )}
    >
      <p className="flex items-center gap-2 font-medium text-danger">
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        {title}
      </p>
      {message && <p className="text-sm text-fg-muted">{message}</p>}
      {onRetry && (
        <Button onClick={onRetry} size="sm">
          Retry
        </Button>
      )}
    </div>
  );
}
