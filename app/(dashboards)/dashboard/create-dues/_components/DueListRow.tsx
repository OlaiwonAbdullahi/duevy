import { HugeiconsIcon } from "@hugeicons/react";
import {
  PencilEdit01Icon,
  Delete02Icon,
  Clock01Icon,
  UserMultipleIcon,
  SquareLock02Icon,
} from "@hugeicons/core-free-icons";
import {
  relativeDue,
  CATEGORY_ICON,
  CATEGORY_LABEL,
} from "../../dues/_components/data";
import { naira, STATUS_META } from "./data";
import type { RepDue } from "./types";

export function DueListRow({
  due,
  onEdit,
  onDelete,
  onClose,
  onViewCollections,
}: {
  due: RepDue;
  onEdit: (due: RepDue) => void;
  onDelete: (due: RepDue) => void;
  onClose: (due: RepDue) => void;
  onViewCollections: (due: RepDue) => void;
}) {
  const rel = relativeDue(due.dueDate);
  const status = STATUS_META[due.status];
  const pct = due.memberCount
    ? Math.round((due.paidCount / due.memberCount) * 100)
    : 0;
  const collected = due.paidCount * due.amount;

  return (
    <li className="flex flex-col gap-4 border-t border-cloud py-4 first:border-t-0 sm:flex-row sm:items-center">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cloud text-brand">
        <HugeiconsIcon icon={CATEGORY_ICON[due.category]} size={20} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-ink">{due.title}</p>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.className}`}
          >
            {status.label}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-soft">
          <span>{CATEGORY_LABEL[due.category]}</span>
          <span className="text-cloud">•</span>
          <span
            className={`inline-flex items-center gap-1 ${
              rel.past && due.status === "active" ? "text-rose-600" : ""
            }`}
          >
            <HugeiconsIcon icon={Clock01Icon} size={12} />
            {rel.text}
          </span>
        </div>

        {/* Collection progress. */}
        <button
          type="button"
          onClick={() => onViewCollections(due)}
          aria-label={`View who paid ${due.title}`}
          className="group mt-2 flex items-center gap-2 cursor-pointer"
        >
          <div className="h-1.5 w-28 overflow-hidden rounded-full bg-paper">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[11px] text-ink-soft group-hover:text-brand group-hover:underline">
            {due.paidCount}/{due.memberCount} paid · {naira(collected)}
          </span>
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <p className="text-base font-semibold tracking-tight text-ink">
          {naira(due.amount)}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onViewCollections(due)}
            aria-label={`View who paid ${due.title}`}
            title="Collections"
            className="grid h-9 w-9 place-items-center rounded-full text-ink-soft transition-colors duration-300 hover:bg-paper hover:text-brand cursor-pointer"
          >
            <HugeiconsIcon icon={UserMultipleIcon} size={16} />
          </button>
          <button
            type="button"
            onClick={() => onEdit(due)}
            aria-label={`Edit ${due.title}`}
            className="grid h-9 w-9 place-items-center rounded-full text-ink-soft transition-colors duration-300 hover:bg-paper hover:text-ink cursor-pointer"
          >
            <HugeiconsIcon icon={PencilEdit01Icon} size={16} />
          </button>
          {due.status === "active" && (
            <button
              type="button"
              onClick={() => onClose(due)}
              aria-label={`Close ${due.title}`}
              title="Close due"
              className="grid h-9 w-9 place-items-center rounded-full text-ink-soft transition-colors duration-300 hover:bg-paper hover:text-ink cursor-pointer"
            >
              <HugeiconsIcon icon={SquareLock02Icon} size={16} />
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(due)}
            aria-label={`Delete ${due.title}`}
            className="grid h-9 w-9 place-items-center rounded-full text-ink-soft transition-colors duration-300 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
          >
            <HugeiconsIcon icon={Delete02Icon} size={16} />
          </button>
        </div>
      </div>
    </li>
  );
}
