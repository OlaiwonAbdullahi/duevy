import { HeaderSkeleton, Skeleton } from "../_components/Skeleton";

function SettingsCardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <section className="rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-2 h-3 w-48" />
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="mt-2 h-3 w-48" />
            </div>
            <Skeleton className="h-6 w-11 shrink-0 rounded-full" />
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
        <SettingsCardSkeleton rows={2} />
        <SettingsCardSkeleton rows={5} />
        <SettingsCardSkeleton rows={2} />
        <SettingsCardSkeleton rows={2} />
      </div>
    </div>
  );
}
