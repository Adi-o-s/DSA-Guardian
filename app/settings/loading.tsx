import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-52" />
      <div className="space-y-2">
        <Skeleton className="h-14 rounded-card" />
        <Skeleton className="h-14 rounded-card" />
        <Skeleton className="h-14 rounded-card" />
        <Skeleton className="h-14 rounded-card" />
      </div>
    </div>
  );
}
