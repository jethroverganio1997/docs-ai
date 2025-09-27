// app/dashboard/error.tsx
"use client"; // This is a required directive

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
}) {

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <h2 className="text-4xl font-bold mb-4">Error</h2>
      <p className="text-muted-foreground mb-6">{error.message}</p>
    </div>
  );
}
