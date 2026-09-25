import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40 rounded-card" />
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-28 rounded-card" />
        <Skeleton className="h-28 rounded-card" />
      </div>
    </div>
  );
}
