/**
 * Skeleton Component
 * Loading placeholders with Linear aesthetic
 */

import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Base skeleton component
 */
function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

/**
 * Spec Card Skeleton
 * Matches the structure of SpecCard component
 */
function SpecCardSkeleton() {
  return (
    <div
      className="rounded-lg border border-border bg-card p-5 shadow-card"
      role="status"
      aria-busy="true"
      aria-label="Loading specification"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                className="h-5 w-20"
                data-testid="tag-skeleton"
              />
            ))}
          </div>

          {/* Footer */}
          <div
            className="flex items-center gap-4"
            data-testid="footer-skeleton"
          >
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>

        {/* Score Circle */}
        <Skeleton
          className="h-14 w-14 rounded-full"
          data-testid="score-skeleton"
        />
      </div>
    </div>
  );
}

/**
 * Stats Card Skeleton
 * Matches the structure of StatCard component
 */
function StatsCardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-3">
        {/* Icon */}
        <Skeleton
          className="h-10 w-10 rounded-md"
          data-testid="icon-skeleton"
        />

        <div className="space-y-1">
          {/* Value */}
          <Skeleton
            className="h-7 w-12"
            data-testid="value-skeleton"
          />

          {/* Label */}
          <Skeleton
            className="h-3 w-24"
            data-testid="label-skeleton"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Endpoint Sidebar Skeleton
 * Loading state for endpoint list sidebar
 */
function EndpointSidebarSkeleton() {
  return (
    <div className="w-72 border-r border-border bg-card flex flex-col shrink-0">
      <div className="p-4 border-b border-border">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="flex-1 overflow-auto">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2 mb-1">
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Documentation Content Skeleton
 * Loading state for docs tab content
 */
function DocumentationSkeleton() {
  return (
    <div className="flex-1 overflow-auto bg-background p-8 md:p-12">
      <div className="max-w-4xl mx-auto">
        {/* API Info Header */}
        <div className="mb-12">
          <Skeleton className="h-9 w-64 mb-3" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6 mb-2" />
          <Skeleton className="h-4 w-4/6 mb-3" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>

        {/* Endpoint Skeletons */}
        {[1, 2].map((i) => (
          <div key={i} className="mb-16">
            <Skeleton className="h-1 w-16 mb-4 rounded-full" />
            <Skeleton className="h-8 w-96 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6 mb-6" />
            <div className="flex items-center gap-3 mb-6 p-3 bg-card border border-border rounded-lg">
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { Skeleton, SpecCardSkeleton, StatsCardSkeleton, EndpointSidebarSkeleton, DocumentationSkeleton };
