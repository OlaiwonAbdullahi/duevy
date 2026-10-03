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
            <span className="text-center text-[11px] font-semibold leading-tight">
              {CATEGORY_LABEL[cat]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
