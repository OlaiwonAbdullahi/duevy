import {
  CheckmarkCircle02Icon,
  Clock01Icon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import { naira } from "../../create-dues/_components/data";
import type { CollectionTotals } from "./types";
import { StatCard } from "./StatCard";

export function CollectionSummary({
  totals,
  trackedCount,
}: {
  totals: CollectionTotals;
  trackedCount: number;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard
        icon={CheckmarkCircle02Icon}
        label="Collected"
        value={naira(totals.collected)}
        hint={`${totals.paid} paid students`}
        tone="brand"
      />
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
