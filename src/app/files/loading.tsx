import { Skeleton } from "@/components/ui/skeleton";
export default function FilesLoading() {
  return (
    <div className="w-full max-w-4xl mt-4 mx-auto space-y-6">
      {/* Filter Input Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-full max-w-sm rounded-md" />
      </div>

      {/* Table Skeleton */}
      <div className="border rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="border-b bg-muted/50 px-4 py-4">
          <div className="flex items-center justify-between"></div>
        </div>

        {/* Table Rows */}
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-12 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-12 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex items-center justify-end space-x-12 flex-1 pr-6">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-8 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
