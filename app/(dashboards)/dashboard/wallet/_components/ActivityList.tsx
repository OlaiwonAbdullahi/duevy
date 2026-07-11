import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDownLeft01Icon,
  ArrowUpRight01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import type { Activity } from "./types";
import { naira } from "./utils";
import { EmptyState } from "../../_components/EmptyState";

export function ActivityList({ activity }: { activity: Activity[] }) {
  return (
    <section className="rounded-3xl border border-cloud bg-canvas p-6">
      <h2 className="text-base font-semibold tracking-tight text-ink">
        Recent activity
      </h2>
      {activity.length === 0 ? (
        <EmptyState
          size="sm"
          icon={Clock01Icon}
          title="No activity yet"
          description="Your top-ups, payments and payouts will show up here."
        />
      ) : (
        <ul className="mt-3 flex flex-col">
          {activity.map((item) => {
            const isIn = item.amount > 0;
            return (
              <li
                key={item.id}
                className="flex items-center gap-4 border-t border-cloud py-3.5 first:border-t-0"
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                    isIn
                      ? "bg-cloud text-brand"
                      : "bg-paper text-ink-soft"
                  }`}
                >
                  <HugeiconsIcon
                    icon={isIn ? ArrowDownLeft01Icon : ArrowUpRight01Icon}
                    size={16}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{item.label}</p>
                  <p className="truncate text-xs text-ink-soft">{item.detail}</p>
                </div>
                <span
                  className={`shrink-0 text-sm font-semibold ${
                    isIn ? "text-brand" : "text-ink"
                  }`}
                >
                  {isIn ? "+" : "−"}
                  {naira(item.amount)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
