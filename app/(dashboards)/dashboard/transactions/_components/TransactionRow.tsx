import { HugeiconsIcon } from "@hugeicons/react";
import type { Transaction } from "./types";
import { naira, formatTime, TXN_META, STATUS_META } from "./data";

export function TransactionRow({ txn }: { txn: Transaction }) {
  const isIn = txn.amount > 0;
  const meta = TXN_META[txn.type];
  const status = STATUS_META[txn.status];
  const failed = txn.status === "failed";

  return (
    <li className="flex items-center gap-3 border-t border-cloud py-3.5 first:border-t-0 sm:gap-4">
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
    </li>
  );
}
