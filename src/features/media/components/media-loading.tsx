import { Card } from "../../../components/ui/card";
import { Skeleton } from "../../../components/ui/skeleton";

export default function MediaLoading() {
  return (
    <div className="w-full max-w-4xl mx-auto mt-4 space-y-6">
      {/* File Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 18 }).map((_, index) => (
          <Card key={index} className="bg-muted/20 border-muted-foreground/20">
            <div className="p-2 space-y-2">
              {/* File Icon */}
              <div className="flex justify-center">
                <Skeleton className="h-12 w-12 rounded-md" />
              </div>

              {/* File Name */}
              <div className="text-center space-y-2">
                <Skeleton className="h-3 w-20 mx-auto" /> {/* "Screens..." */}
                <Skeleton className="h-2 w-16 mx-auto" />{" "}
                {/* Date like "2023-11-24" */}
                <Skeleton className="h-2 w-14 mx-auto" />{" "}
                {/* File ID like "075531..." */}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
