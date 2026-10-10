import { HugeiconsIcon } from "@hugeicons/react";
import { DUE_TYPES, type DueType } from "@/lib/api/types";
import { CATEGORY_ICON, CATEGORY_LABEL } from "../../dues/_components/data";

const CATEGORIES: readonly DueType[] = DUE_TYPES;

/** A tile grid for picking the due's type — mirrors the pay-modal tiles. */
export function CategoryPicker({
  value,
  onChange,
}: {
  value: DueType;
  onChange: (next: DueType) => void;
}) {
  return (
    <>
    {/* Phones: one swipeable row of chips. */}
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5 [scrollbar-width:none] sm:hidden">
      {CATEGORIES.map((cat) => {
        const on = cat === value;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(cat)}
            aria-pressed={on}
            className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold transition-colors cursor-pointer ${
              on ? "border-brand bg-cloud text-brand" : "border-cloud bg-paper text-ink-soft"
            }`}
          >
            <HugeiconsIcon icon={CATEGORY_ICON[cat]} size={16} />
            {CATEGORY_LABEL[cat]}
          </button>
        );
      })}
    </div>

    <div className="hidden grid-cols-5 gap-2 sm:grid">
      {CATEGORIES.map((cat) => {
        const on = cat === value;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(cat)}
            aria-pressed={on}
            className={`flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3 transition-colors duration-300 cursor-pointer ${
              on
                ? "border-brand bg-cloud text-brand"
                : "border-cloud bg-paper text-ink-soft hover:text-ink"
            }`}
          >
            <HugeiconsIcon icon={CATEGORY_ICON[cat]} size={20} />
            <span className="text-center text-[11px] font-semibold leading-tight">
              {CATEGORY_LABEL[cat]}
            </span>
          </button>
        );
      })}
    </div>
    </>
  );
}
