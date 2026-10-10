import {
  CheckmarkCircle02Icon,
  Clock01Icon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { naira } from "../../_components/format";
import { StatCard } from "../../_components/StatCard";
import type { CollectionTotals } from "./types";

export function CollectionSummary({
  totals,
  trackedCount,
}: {
  totals: CollectionTotals;
  trackedCount: number;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_0.85fr_0.85fr]">
      <div className="rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-ink-soft">Collected</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-brand">
              {naira(totals.collected)}
            </p>
            <p className="mt-1 text-xs text-ink-soft">
              {totals.paid} of {trackedCount} students have paid.
            </p>
          </div>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cloud text-brand">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={19} />
          </span>
        </div>
        <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-paper">
          <div
            className="h-full rounded-full bg-brand"
            style={{ width: `${totals.rate}%` }}
          />
        </div>
      </div>

      <StatCard
        icon={Clock01Icon}
        label="Outstanding"
        value={naira(totals.expected - totals.collected)}
        hint={`${totals.unpaid} unpaid students`}
      />
      <StatCard
        icon={UserMultipleIcon}
        label="Collection rate"
        value={`${totals.rate}%`}
        hint={`${trackedCount} students tracked`}
      />
    </div>
  );
}
