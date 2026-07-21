"use client";
import { ErrorState } from "@/components/error-state";

export default function DocsError({
  reset,
 }: {
   reset: () => void;
 }) {
  return (
    <ErrorState
      title="Unable to load documentation"
      description="Please try again. If the problem continues, contact support."
      errorCode="DOCS_LOAD_FAILED"
      onRetry={reset}
    />
  );
}
