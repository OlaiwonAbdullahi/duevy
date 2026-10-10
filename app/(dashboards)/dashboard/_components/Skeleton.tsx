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
    <div
      className={cn(
        "grid gap-4",
        count === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3",
      )}
    >
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

/**
 * Everything below the overview header: stat cards, quick actions and the two
 * panels, laid out exactly like the loaded page so nothing jumps when data lands.
 */
export function OverviewBodySkeleton({ stats = 3 }: { stats?: 3 | 4 }) {
  return (
    <div className="mt-6">
      <div
        className={cn(
          "grid gap-4 sm:grid-cols-2",
          stats === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3",
        )}
      >
        {Array.from({ length: stats }).map((_, i) => (
          <div key={i} className="rounded-3xl border border-cloud bg-canvas p-6">
            <Skeleton className="mb-3 h-9 w-9 rounded-full" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2 h-6 w-28" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl border border-cloud bg-canvas p-4">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="mt-2 h-3 w-32" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {[4, 3].map((rows, panel) => (
          <section key={panel} className="rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-14 rounded-full" />
            </div>
            <div className="mt-4 flex flex-col divide-y divide-cloud">
              {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3.5">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-3.5 w-36" />
                    <Skeleton className="mt-2 h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

/** The whole overview page (header + body) — the route and chunk loading state. */
export function OverviewSkeleton({ stats = 3 }: { stats?: 3 | 4 }) {
  return (
    <div className="mx-auto max-w-6xl">
      <Skeleton className="h-6 w-28 rounded-full" />
      <Skeleton className="mt-3 h-7 w-56" />
      <Skeleton className="mt-2 h-3 w-72 max-w-full" />
      <OverviewBodySkeleton stats={stats} />
    </div>
  );
}

/**
 * The dashboard frame (sidebar + top bar + page) shown while the session
 * resolves, so a hard load looks like the app straight away instead of a
 * blank spinner.
 */
export function ShellSkeleton({ children }: { children?: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas" aria-busy="true" aria-label="Loading">
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col gap-3 border-r border-cloud p-6 lg:flex">
        <Skeleton className="mb-6 h-8 w-32" />
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full rounded-xl" />
        ))}
      </aside>
      <div className="flex min-h-screen flex-col lg:pl-72">
        <div className="flex h-18 items-center gap-4 border-b border-cloud px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-9 w-48 rounded-full" />
          <Skeleton className="ml-auto h-9 w-9 rounded-full" />
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children ?? <ListPageSkeleton />}</main>
      </div>
    </div>
  );
}
