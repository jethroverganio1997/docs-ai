import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default async function LoadingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-6 lg:p-8">
          {/* Header Section */}
          <div className="mb-8">
            <Skeleton className="h-10 w-80 mb-3" />
            <Skeleton className="h-5 w-96 mb-6" />

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>

          {/* Info Alert */}
          <Card className="mb-8 p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-5 w-5 rounded-full flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </Card>

          {/* Overview Section */}
          <div className="mb-8">
            <Skeleton className="h-8 w-32 mb-4" />
            <div className="space-y-3 mb-6">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
            </div>
            <Skeleton className="h-4 w-3/4 mb-6" />
          </div>

          {/* File Tree Section */}
          <Card className="mb-8 p-4 bg-muted/30">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="ml-6 space-y-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
            </div>
          </Card>

          {/* File Section */}
          <div className="mb-8">
            <Skeleton className="h-8 w-16 mb-4" />
            <div className="space-y-3 mb-6">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>

          {/* Code Block */}
          <Card className="p-4 bg-muted/50">
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="w-64 border-l p-6 hidden lg:block">
          <div className="mb-4">
            <Skeleton className="h-5 w-24 mb-3" />
          </div>

          <div className="space-y-6">
            {/* Navigation Items */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-18" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-22" />
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
