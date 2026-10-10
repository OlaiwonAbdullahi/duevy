import { HeaderSkeleton, Skeleton } from "../_components/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl">
      <HeaderSkeleton action={false} />
      <Skeleton className="mt-6 h-56 rounded-3xl" />
    </div>
  );
}
