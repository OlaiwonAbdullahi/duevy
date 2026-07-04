import { cn } from "@/lib/utils";

/** A single shimmering placeholder block. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-lg bg-cloud/70", className)} />
  );
}

export function HeaderSkeleton({ action = true }: { action?: boolean }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="w-full max-w-xs">
        <Skeleton className="h-4 w-20 rounded-full" />
        <Skeleton className="mt-3 h-7 w-40" />
        <Skeleton className="mt-2 h-3 w-56" />
      </div>
      {action && <Skeleton className="h-11 w-36 shrink-0 rounded-full" />}
    </div>
  );
}

export function StatRowSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-3xl border border-cloud bg-canvas p-5">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="mt-3 h-3 w-20" />
          <Skeleton className="mt-2 h-6 w-24" />
        </div>
      ))}
    </div>
  );
}

/** A card holding a list of avatar-style rows — the shape of most tables here. */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-3xl border border-cloud bg-canvas p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-9 w-28 rounded-full" />
      </div>
      <div className="mt-5 flex flex-col divide-y divide-cloud">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-4">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="mt-2 h-3 w-28" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** The default full-page placeholder: header, stat row, list. */
export function ListPageSkeleton({
  stats = 3,
  rows = 6,
}: {
  stats?: number;
  rows?: number;
}) {
  return (
    <div className="mx-auto max-w-6xl">
      <HeaderSkeleton />
      <div className="mt-6">
        <StatRowSkeleton count={stats} />
      </div>
      <div className="mt-6">
        <ListSkeleton rows={rows} />
      </div>
    </div>
  );
}
