import Link from "next/link";
import { Compass } from "lucide-react";
import { EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <EmptyState
      icon={<Compass className="h-5 w-5" />}
      title="Page not found"
      description="That route doesn't exist. The dashboard is probably where you meant to go."
      action={
        <Link
          href="/"
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-fg transition-all hover:brightness-110"
        >
          Back to dashboard
        </Link>
      }
    />
  );
}
