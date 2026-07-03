import { HugeiconsIcon } from "@hugeicons/react";
import { Clock01Icon } from "@hugeicons/core-free-icons";
import type { DueCategory } from "../../dues/_components/types";
import {
  naira,
  relativeDue,
  CATEGORY_ICON,
  CATEGORY_LABEL,
} from "../../dues/_components/data";

/** How the due will look to a student in their dues list — updates live. */
export function DuePreview({
  title,
  category,
  amount,
  dueDate,
  note,
}: {
  title: string;
  category: DueCategory;
  amount: number;
  dueDate: string;
  note: string;
}) {
  const rel = dueDate ? relativeDue(dueDate) : null;

  return (
    <div className="rounded-2xl border border-cloud bg-paper/50 p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cloud text-brand">
          <HugeiconsIcon icon={CATEGORY_ICON[category]} size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">
            {title || "Untitled due"}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-ink-soft">
            <span className="rounded-full bg-canvas px-2 py-0.5">
              {CATEGORY_LABEL[category]}
            </span>
            {rel && (
              <span
                className={`inline-flex items-center gap-1 ${
                  rel.past ? "text-rose-600" : "text-ink-soft"
                }`}
              >
                <HugeiconsIcon icon={Clock01Icon} size={12} />
                {rel.text}
              </span>
            )}
          </div>
        </div>
        <p className="shrink-0 text-base font-semibold tracking-tight text-ink">
          {amount > 0 ? naira(amount) : "₦0"}
        </p>
      </div>
      {note && (
        <p className="mt-3 line-clamp-2 border-t border-cloud pt-3 text-xs text-ink-soft">
          {note}
        </p>
      )}
    </div>
  );
}
