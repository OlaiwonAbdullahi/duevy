import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import type { Transaction } from "./types";
import { naira, formatTime, TXN_META, STATUS_META } from "./data";

export function TransactionRow({
  txn,
  onSelect,
}: {
  txn: Transaction;
  onSelect: (txn: Transaction) => void;
}) {
  const isIn = txn.amount > 0;
  const meta = TXN_META[txn.type];
  const status = STATUS_META[txn.status];
  const failed = txn.status === "failed";

  return (
    <li className="border-t border-cloud first:border-t-0">
      <button
        type="button"
        onClick={() => onSelect(txn)}
        aria-label={`View receipt for ${txn.title}`}
        className="group flex w-full items-center gap-3 py-3.5 text-left transition-colors duration-300 hover:bg-paper/60 sm:gap-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 rounded-2xl"
      >
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
            isIn ? "bg-cloud text-brand" : "bg-paper text-ink-soft"
          }`}
        >
          <HugeiconsIcon icon={meta.icon} size={18} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{txn.title}</p>
          <p className="truncate text-xs text-ink-soft">
            {meta.label} · {formatTime(txn.date)}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={`text-sm font-semibold ${
              failed
                ? "text-ink-soft line-through"
                : isIn
                  ? "text-brand"
                  : "text-ink"
            }`}
          >
            {isIn ? "+" : "−"}
            {naira(txn.amount)}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.className}`}
          >
            {status.label}
          </span>
        </div>

        <HugeiconsIcon
          icon={ArrowRight01Icon}
          size={16}
          className="shrink-0 text-ink-soft opacity-0 transition-opacity group-hover:opacity-100"
        />
      </button>
    </li>
  );
}
