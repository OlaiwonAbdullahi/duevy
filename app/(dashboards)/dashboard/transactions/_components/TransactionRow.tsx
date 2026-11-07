import { memo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { Transaction } from "./types";
import { TXN_META, STATUS_META, formatDateTime, formatRelative, signedKobo } from "./data";
import { StatusBadge } from "./StatusBadge";

/**
 * Columns shared by the desktop header and every row. Method gets its own
 * column only on wide screens; below that it rides in the detail line.
 */
export const ROW_GRID =
  "md:grid md:grid-cols-[minmax(0,1fr)_8.5rem_6.5rem_8rem] md:items-center md:gap-4 xl:grid-cols-[minmax(0,1fr)_8rem_8.5rem_6.5rem_8rem]";

/** Credit in green, debit in ink; pending is muted so it never reads as settled; failed is struck through. */
function amountClass(txn: Transaction) {
  if (txn.status === "failed") return "text-ink-soft line-through decoration-ink-soft/60";
  if (txn.status === "pending") return "text-ink-soft";
  return txn.amount > 0 ? "text-brand" : "text-ink";
}

export const TransactionRow = memo(function TransactionRow({
  txn,
  onSelect,
}: {
  txn: Transaction;
  onSelect: (txn: Transaction) => void;
}) {
  const isIn = txn.amount > 0;
  const meta = TXN_META[txn.type];
  const amount = signedKobo(txn.amount);
  const absolute = formatDateTime(txn.date);
  const relative = formatRelative(txn.date);
  const secondary = [txn.detail ?? meta.label, txn.method].filter(Boolean).join(" · ");

  return (
    <li>
      <button
        type="button"
        data-txn-row
        onClick={() => onSelect(txn)}
        aria-haspopup="dialog"
        aria-label={`${txn.title}, ${isIn ? "money in" : "money out"} ${amount}, ${STATUS_META[txn.status].label}, ${absolute}. View details`}
        className={cn(
          "group relative flex w-full cursor-pointer items-start gap-3 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40",
          "rounded-2xl border border-cloud bg-canvas p-4 hover:border-brand/30 active:bg-paper/60",
          "md:rounded-none md:border-0 md:bg-transparent md:px-6 md:py-3.5 md:hover:bg-paper/60",
          ROW_GRID,
        )}
      >
        {/* Transaction: icon, title, detail. */}
        <span className="flex min-w-0 flex-1 items-center gap-3">
          <span
            aria-hidden
            className={cn(
              "grid h-10 w-10 shrink-0 place-items-center rounded-full",
              isIn ? "bg-cloud text-brand" : "bg-paper text-ink-soft",
            )}
          >
            <HugeiconsIcon icon={meta.icon} size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-ink">{txn.title}</span>
            <span className="block truncate text-xs text-ink-soft">
              <span className="xl:hidden">{secondary}</span>
              <span className="max-xl:hidden">{txn.detail ?? meta.label}</span>
            </span>
            {/* Phones: the date sits under the title. */}
            <time dateTime={txn.date} title={absolute} className="mt-1 block text-[11px] text-ink-soft md:hidden">
              {relative}
            </time>
          </span>
        </span>

        {/* Method — wide screens only. */}
        <span className="truncate text-[13px] text-ink-soft max-xl:hidden">{txn.method ?? "—"}</span>

        {/* Date — relative, with the exact time under it. */}
        <span className="min-w-0 max-md:hidden">
          <time dateTime={txn.date} className="block truncate text-[13px] text-ink">
            {relative}
          </time>
          <span className="block truncate text-[11px] text-ink-soft">{absolute}</span>
        </span>

        {/* Status — desktop column. */}
        <span className="max-md:hidden">
          <StatusBadge status={txn.status} />
        </span>

        {/* Amount (+ status on phones). */}
        <span className="flex shrink-0 flex-col items-end gap-1.5 md:flex-row md:items-center md:justify-end md:gap-2">
          <span className={cn("text-sm font-semibold tabular-nums", amountClass(txn))}>{amount}</span>
          <StatusBadge status={txn.status} className="md:hidden" />
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={16}
            aria-hidden
            className="shrink-0 text-ink-soft opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 max-md:hidden"
          />
        </span>
      </button>
    </li>
  );
});
