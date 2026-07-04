import { HugeiconsIcon } from "@hugeicons/react";
import { MoneySend01Icon } from "@hugeicons/core-free-icons";
import { EmptyState } from "../../_components/EmptyState";
import { naira, PAYOUT_STATUS_META } from "./data";
import type { Payout } from "./types";

export function PayoutHistory({ payouts }: { payouts: Payout[] }) {
  return (
    <section className="rounded-3xl border border-cloud bg-canvas p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4 px-1">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-ink">
            Payout history
          </h2>
          <p className="mt-0.5 text-xs text-ink-soft">
            Every withdrawal you&apos;ve requested and its status.
          </p>
        </div>
        <span className="rounded-full bg-cloud px-2.5 py-1 text-[11px] font-semibold text-brand tabular-nums">
          {payouts.length}
        </span>
      </div>

      {payouts.length === 0 ? (
        <EmptyState
          icon={MoneySend01Icon}
          title="No payouts yet"
          description="When you withdraw collected funds, each request will show up here with its reference and status."
        />
      ) : (
        <ul className="mt-4 divide-y divide-cloud overflow-hidden rounded-2xl border border-cloud">
          {payouts.map((payout) => {
            const meta = PAYOUT_STATUS_META[payout.status];
            return (
              <li
                key={payout.id}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors duration-300 hover:bg-paper/70 sm:gap-4"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cloud text-brand">
                  <HugeiconsIcon icon={MoneySend01Icon} size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {naira(payout.amount)}
                  </p>
                  <p className="truncate text-xs text-ink-soft">
                    {payout.account} · {payout.reference}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 text-right">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.className}`}
                  >
                    {meta.label}
                  </span>
                  <span className="text-[11px] text-ink-soft">
                    {payout.requestedAt}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
