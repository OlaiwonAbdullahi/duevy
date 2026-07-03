import { HugeiconsIcon } from "@hugeicons/react";
import { Download01Icon } from "@hugeicons/core-free-icons";

export function CollectionsHeader({ onDownload }: { onDownload: () => void }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <span className="mb-2 inline-block rounded-full bg-cloud px-3 py-1 text-[11px] font-semibold text-brand">
          Rep tools
        </span>
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          Collections
        </h1>
        <p className="mt-1 text-[13px] text-ink-soft">
          See who has paid each due and export the list for records.
        </p>
      </div>

      <button
        type="button"
        onClick={onDownload}
        className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright cursor-pointer"
      >
        <HugeiconsIcon icon={Download01Icon} size={16} />
        Download list
      </button>
    </header>
  );
}
