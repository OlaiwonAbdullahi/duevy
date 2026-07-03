import { HugeiconsIcon } from "@hugeicons/react";
import { Invoice01Icon } from "@hugeicons/core-free-icons";
import type { RepDue } from "../../create-dues/_components/types";
import { naira, REP_SPACE } from "../../create-dues/_components/data";

export function DueSelector({
  dues,
  selectedDue,
  onSelect,
}: {
  dues: RepDue[];
  selectedDue: RepDue;
  onSelect: (dueId: string) => void;
}) {
  return (
    <section className="rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
      <h2 className="text-base font-semibold tracking-tight text-ink">
        Select due
      </h2>
      <p className="mt-1 text-xs text-ink-soft">
        Collections are grouped by each due raised for {REP_SPACE.short}.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {dues.map((due) => {
          const active = due.id === selectedDue.id;
          const paidPercent = Math.round((due.paidCount / due.memberCount) * 100);

          return (
            <button
              key={due.id}
              type="button"
              onClick={() => onSelect(due.id)}
              className={`rounded-2xl border p-4 text-left transition-colors duration-300 cursor-pointer ${
                active
                  ? "border-brand bg-cloud/70"
                  : "border-cloud bg-canvas hover:bg-paper"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cloud text-brand">
                  <HugeiconsIcon icon={Invoice01Icon} size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold text-ink">
                    {due.title}
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">
                    {naira(due.amount)} - {due.paidCount}/{due.memberCount} paid
                  </p>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-paper">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${paidPercent}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
