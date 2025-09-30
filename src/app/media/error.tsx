
"use client";
import { ErrorState } from "../../components/error-state";

export default function MediaError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  console.log(error.message);
  return (
    <ErrorState
      title="Something went wrong"
      description="We encountered an unexpected error. Please try again or contact support if the problem persists."
      errorCode="ERR_500"
    />
  );
}
