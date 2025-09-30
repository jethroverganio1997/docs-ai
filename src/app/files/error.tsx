"use client";
import { ErrorState } from "@/components/error-state";

export default function FilesError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  console.log(error.message);
  return (
    <ErrorState
      title="Something went wrong"
      description={error.message}
      errorCode="ERR_500"
    />
  );
}
