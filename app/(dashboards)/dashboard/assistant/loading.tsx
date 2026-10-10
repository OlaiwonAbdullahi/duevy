import { HeaderSkeleton, Skeleton } from "../_components/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl">
      <HeaderSkeleton action={false} />
      <Skeleton className="mt-6 h-[60vh] rounded-3xl" />
    </div>
  );
}
