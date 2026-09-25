"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title="This page didn't load"
      message={error.message || "An unexpected error occurred."}
      onRetry={reset}
    />
  );
}
