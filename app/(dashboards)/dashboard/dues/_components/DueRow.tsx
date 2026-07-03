import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  Alert01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import type { Due } from "./types";
import {
  naira,
  relativeDue,
  CATEGORY_ICON,
  CATEGORY_LABEL,
} from "./data";

export function DueRow({
  due,
  onPay,
  pending,
}: {
  due: Due;
  onPay: (due: Due) => void;
  pending?: boolean;
}) {
  const paid = due.status === "paid";
  const rel = relativeDue(due.dueDate);
  const overdue = due.status === "overdue" || (!paid && rel.past);

  return (
    <li className="flex flex-col gap-4 border-t border-cloud py-4 first:border-t-0 sm:flex-row sm:items-center">
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
          paid ? "bg-paper text-ink-soft" : "bg-cloud text-brand"
        }`}
      >
        <HugeiconsIcon icon={CATEGORY_ICON[due.category]} size={20} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-ink">{due.title}</p>
          <span className="hidden rounded-full bg-paper px-2 py-0.5 text-[10px] font-medium text-ink-soft sm:inline">
            {CATEGORY_LABEL[due.category]}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-ink-soft">{due.note}</p>
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-medium">
          {paid ? (
            <span className="inline-flex items-center gap-1 text-brand">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={13} />
              Paid
            </span>
          ) : (
            <span
              className={`inline-flex items-center gap-1 ${
                overdue ? "text-rose-600" : "text-ink-soft"
              }`}
            >
              <HugeiconsIcon
                icon={overdue ? Alert01Icon : Clock01Icon}
                size={13}
              />
              {rel.text}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <p
          className={`text-base font-semibold tracking-tight ${
            paid ? "text-ink-soft line-through" : "text-ink"
          }`}
        >
          {naira(due.amount)}
        </p>
        {paid ? (
          <span className="w-[92px] text-right text-xs font-medium text-brand">
            Settled
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onPay(due)}
            disabled={pending}
            className="inline-flex h-9 w-[92px] items-center justify-center rounded-full bg-brand text-xs font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:opacity-60 cursor-pointer"
          >
            {pending ? "…" : "Pay now"}
          </button>
        )}
      </div>
    </li>
  );
}
