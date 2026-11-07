import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import type { ApiMeta } from "@/lib/api/types";

/** Prev / next for a server-paginated list. Hidden when there's a single page. */
export function Pager({
  meta,
  page,
  onPage,
  busy = false,
  label,
}: {
  meta: ApiMeta | undefined;
  page: number;
  onPage: (page: number) => void;
  /** The next page is loading (the previous one stays on screen). */
  busy?: boolean;
  /** What's being paged, for screen readers, e.g. "Withdrawals". */
  label: string;
}) {
  const totalPages = meta?.totalPages ?? 1;
  if (totalPages <= 1) return null;
  const btn =
    "inline-flex h-9 items-center gap-1.5 rounded-full border border-cloud bg-canvas px-3.5 text-xs font-semibold text-ink transition-colors duration-300 hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40";

  return (
    <nav aria-label={`${label} pages`} className="mt-4 flex items-center justify-between gap-3 px-1">
      <p className="text-xs text-ink-soft tabular-nums" aria-live="polite">
        Page <span className="font-semibold text-ink">{page}</span> of {totalPages}
        {meta?.total != null && <span className="max-sm:hidden"> · {meta.total} total</span>}
        {busy && <span className="ml-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-cloud border-t-brand align-[-2px]" />}
      </p>
      <div className="flex items-center gap-2">
        <button type="button" className={btn} disabled={page <= 1 || busy} onClick={() => onPage(page - 1)}>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} />
          <span className="max-[380px]:sr-only">Prev</span>
        </button>
        <button type="button" className={btn} disabled={page >= totalPages || busy} onClick={() => onPage(page + 1)}>
          <span className="max-[380px]:sr-only">Next</span>
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
        </button>
      </div>
    </nav>
  );
}
