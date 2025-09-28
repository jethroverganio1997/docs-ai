import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function FilesLoading() {
  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Upload Area Skeleton */}
      <Card className="border-2 border-dashed border-muted-foreground/25 bg-muted/10">
        <div className="flex flex-col items-center justify-center py-6 px-6 space-y-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-3 w-40" />
        </div>
      </Card>

      {/* Filter Input Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-full max-w-sm rounded-md" />
      </div>

      {/* Table Skeleton */}
      <div className="border rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="border-b bg-muted/50 px-4 py-4">
          <div className="flex items-center justify-between">
          </div>
        </div>

        {/* Table Rows */}
        <div className="divide-y">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-8 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-12 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
