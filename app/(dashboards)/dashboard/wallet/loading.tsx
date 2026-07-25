export default function Loading() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4">
      <div className="animate-pulse rounded-3xl border border-cloud bg-canvas p-6 text-center sm:p-8">
        <span className="mx-auto h-14 w-14 rounded-full bg-cloud" />
        <span className="mx-auto mt-4 block h-5 w-40 rounded-full bg-cloud" />
        <span className="mx-auto mt-2 block h-3 w-56 rounded-full bg-cloud" />
      </div>
    </div>
  );
}
