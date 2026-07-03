import { HugeiconsIcon } from "@hugeicons/react";
import type { DueCategory } from "../../dues/_components/types";
import { CATEGORY_ICON, CATEGORY_LABEL } from "../../dues/_components/data";

const CATEGORIES: DueCategory[] = [
  "levy",
  "dinner",
  "handout",
  "welfare",
  "sport",
];

/** A tile grid for picking the due's category — mirrors the pay-modal tiles. */
export function CategoryPicker({
  value,
  onChange,
}: {
  value: DueCategory;
  onChange: (next: DueCategory) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
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
            <span className="text-[11px] font-semibold">
              {CATEGORY_LABEL[cat]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
