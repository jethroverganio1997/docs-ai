import { Skeleton } from "../../components/ui/skeleton";

export default function MediaLoading() {
  return (
    <div className="w-full max-w-4xl mx-auto mt-4 space-y-6">
      {/* File Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 18 }).map((_, index) => (
          <Skeleton
            key={index}
            className="container h-[136px] border-muted-foreground/20 border rounded-lg"
          />
        ))}
      </div>
    </div>
  );
}
