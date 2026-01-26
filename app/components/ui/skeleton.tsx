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

export { Skeleton, SpecCardSkeleton, StatsCardSkeleton };
