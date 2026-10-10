export function CircleHeader() {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <span className="mb-2 hidden rounded-full sm:inline-block bg-cloud px-3 py-1 text-[11px] font-semibold text-brand">
          Rep tools
        </span>
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          Circle
        </h1>
        <p className="mt-1 text-[13px] text-ink-soft max-sm:hidden">
          Share your join code and see everyone who&apos;s in your department
          space.
        </p>
      </div>
    </header>
  );
}
