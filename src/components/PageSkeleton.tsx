"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 w-full min-h-[60vh]">
      {/* Header skeleton */}
      <div className="mb-8">
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>

      {/* Content grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-48 w-full rounded-sm" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* Additional content skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    </div>
  );
}
