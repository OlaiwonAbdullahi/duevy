import { HeaderSkeleton, Skeleton } from "../_components/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl">
      <HeaderSkeleton action={false} />
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-64 rounded-3xl" />
          <Skeleton className="h-80 rounded-3xl" />
        </div>
        <Skeleton className="h-[560px] rounded-3xl" />
      </div>
    </div>
  );
}
