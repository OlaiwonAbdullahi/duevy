"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, MoneySend01Icon } from "@hugeicons/core-free-icons";
import { EmptyState } from "../../_components/EmptyState";
import { naira, PAYOUT_STATUS_META } from "./data";
import type { Payout } from "./types";

const PayoutDetailModal = dynamic(
  () => import("./PayoutDetailModal").then((mod) => mod.PayoutDetailModal),
  { ssr: false },
);

export function PayoutHistory({ payouts }: { payouts: Payout[] }) {
  const [viewing, setViewing] = useState<Payout | null>(null);

  return (
    <section className="rounded-3xl border border-cloud bg-canvas p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4 px-1">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-ink">
            Payout history
          </h2>
          <p className="mt-0.5 text-xs text-ink-soft max-sm:hidden">
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
              <li key={payout.id}>
                <button
                  type="button"
                  onClick={() => setViewing(payout)}
                  aria-label={`View withdrawal of ${naira(payout.amount)}`}
                  className="group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-300 hover:bg-paper/70 active:bg-paper cursor-pointer focus-visible:outline-none focus-visible:bg-paper sm:gap-4"
                >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cloud text-brand">
                  <HugeiconsIcon icon={MoneySend01Icon} size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {naira(payout.amount)}
                  </p>
                  <p className="truncate text-xs text-ink-soft">
                    {payout.accountName ? `${payout.accountName} · ` : ""}
                    {payout.account}
                    <span className="max-sm:hidden"> · {payout.reference}</span>
                  </p>
                  {payout.fee > 0 && (
                    <p className="truncate text-[11px] text-ink-soft">
                      {naira(payout.net)} received after {naira(payout.fee)} fee
                    </p>
                  )}
                  {payout.failureReason && (payout.status === "failed" || payout.status === "reversed") && (
                    <p className="truncate text-[11px] text-rose-600">{payout.failureReason}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5 text-right">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold sm:px-2.5 sm:py-1 ${meta.className}`}
                  >
                    {meta.label}
                  </span>
                  <span className="text-[11px] text-ink-soft">
                    {payout.requestedAt}
                  </span>
                </div>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={16}
                  className="shrink-0 text-ink-soft/70 transition-transform group-hover:translate-x-0.5"
                />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {viewing && <PayoutDetailModal payout={viewing} onClose={() => setViewing(null)} />}
    </section>
  );
}
