import { HeaderSkeleton, Skeleton } from "../_components/Skeleton";

function ManageCardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <section className="rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-2 h-3 w-56" />
        </div>
      </div>
      <div className="mt-5 flex flex-col divide-y divide-cloud">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-3.5 first:pt-0">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="mt-2 h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl">
      <HeaderSkeleton action={false} />
      <div className="mt-6 flex flex-col gap-5">
        <ManageCardSkeleton rows={1} />
        <ManageCardSkeleton rows={1} />
        <ManageCardSkeleton rows={2} />
        <ManageCardSkeleton rows={2} />
        <ManageCardSkeleton rows={3} />
      </div>
    </div>
  );
}
