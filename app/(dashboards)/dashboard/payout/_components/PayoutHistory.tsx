"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon, ArrowRight01Icon, MoneySend01Icon } from "@hugeicons/core-free-icons";
import { usePayoutsPage } from "@/lib/api/queries";
import { EmptyState } from "../../_components/EmptyState";
import { Skeleton } from "../../_components/Skeleton";
import { adaptPayout, naira, PAYOUT_STATUS_META } from "./data";
import { Pager } from "./Pager";
import type { Payout, PayoutStatus } from "./types";

const PayoutDetailModal = dynamic(
  () => import("./PayoutDetailModal").then((mod) => mod.PayoutDetailModal),
  { ssr: false },
);

const PER_PAGE = 10;

/** The status pill used everywhere a withdrawal is listed. */
export function PayoutStatusBadge({ status }: { status: PayoutStatus }) {
  const meta = PAYOUT_STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold sm:px-2.5 sm:py-1 ${meta.className}`}
    >
      <span
        aria-hidden
        className={`h-1.5 w-1.5 rounded-full ${meta.dot} ${
          status === "pending" || status === "processing" || status === "awaiting_approval" ? "motion-safe:animate-pulse" : ""
        }`}
      />
      {meta.label}
    </span>
  );
}

/**
 * Every withdrawal for the department, newest first, a page at a time from
 * the server. `pollMs` keeps it fresh while one is still in flight.
 */
export function PayoutHistory({ spaceId, pollMs = false }: { spaceId: string | undefined; pollMs?: number | false }) {
  const [page, setPage] = useState(1);
  const query = usePayoutsPage(spaceId, page, PER_PAGE, { refetchInterval: pollMs });
  const payouts = useMemo(() => (query.data?.data ?? []).map(adaptPayout), [query.data]);
  const total = query.data?.meta?.total ?? payouts.length;
  const [viewingId, setViewingId] = useState<string | null>(null);
  const viewing = payouts.find((p) => p.id === viewingId) ?? null;

  return (
    <section aria-labelledby="payout-history-title" className="rounded-3xl border border-cloud bg-canvas p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4 px-1">
        <div>
          <div className="flex items-center gap-1.5">
            <h2 id="payout-history-title" className="text-base font-semibold tracking-tight text-ink">
              Withdrawal history
            </h2>
          </div>
        </div>
        {!query.isPending && (
          <span className="rounded-full bg-cloud px-2.5 py-1 text-[11px] font-semibold text-brand tabular-nums">
            {total}
          </span>
        )}
      </div>

      {query.isPending ? (
        <ul className="mt-4 divide-y divide-cloud overflow-hidden rounded-2xl border border-cloud" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-3.5 sm:gap-4">
              <Skeleton className="h-10 w-10 shrink-0 rounded-2xl" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="mt-2 h-3 w-40 max-w-full" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </li>
          ))}
        </ul>
      ) : query.isError && payouts.length === 0 ? (
        <EmptyState
          icon={Alert01Icon}
          title="Couldn't load withdrawals"
          description="Something went wrong reaching the server."
          action={
            <button
              type="button"
              onClick={() => void query.refetch()}
              className="rounded-full border border-cloud px-4 py-2 text-xs font-semibold text-brand transition-colors hover:bg-paper cursor-pointer"
            >
              Try again
            </button>
          }
        />
      ) : payouts.length === 0 ? (
        <EmptyState
          icon={MoneySend01Icon}
          title="No withdrawals yet"
          description="When you withdraw collected funds, each request shows up here with its reference and status."
        />
      ) : (
        <ul
          className={`mt-4 divide-y divide-cloud overflow-hidden rounded-2xl border border-cloud transition-opacity ${
            query.isPlaceholderData ? "opacity-60" : ""
          }`}
        >
          {payouts.map((payout) => (
            <HistoryRow key={payout.id} payout={payout} onOpen={() => setViewingId(payout.id)} />
          ))}
        </ul>
      )}

      <Pager
        meta={query.data?.meta}
        page={page}
        onPage={setPage}
        busy={query.isPlaceholderData}
        label="Withdrawals"
      />

      {viewing && <PayoutDetailModal payout={viewing} onClose={() => setViewingId(null)} />}
    </section>
  );
}

function HistoryRow({ payout, onOpen }: { payout: Payout; onOpen: () => void }) {
  const ended = payout.status === "failed" || payout.status === "reversed" || payout.status === "cancelled";
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`View withdrawal of ${naira(payout.amount)}, ${PAYOUT_STATUS_META[payout.status].label}`}
        className="group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-300 hover:bg-paper/70 active:bg-paper cursor-pointer focus-visible:outline-none focus-visible:bg-paper sm:gap-4"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cloud text-brand max-[380px]:hidden">
          <HugeiconsIcon icon={MoneySend01Icon} size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-semibold tabular-nums ${ended ? "text-ink-soft line-through decoration-ink-soft/40" : "text-ink"}`}>
            {naira(payout.amount)}
          </p>
          <p className="truncate text-xs text-ink-soft">
            {payout.accountName ? `${payout.accountName} · ` : ""}
            {payout.account}
            <span className="max-sm:hidden"> · {payout.reference}</span>
          </p>
          {payout.fee > 0 && !ended && (
            <p className="truncate text-[11px] text-ink-soft tabular-nums">
              {naira(payout.net)} received after {naira(payout.fee)} fee
            </p>
          )}
          {payout.failureReason && ended && (
            <p className="truncate text-[11px] text-rose-600">{payout.failureReason}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5 text-right">
          <PayoutStatusBadge status={payout.status} />
          <span className="text-[11px] text-ink-soft">{payout.requestedAt}</span>
        </div>
        <HugeiconsIcon
          icon={ArrowRight01Icon}
          size={16}
          className="shrink-0 text-ink-soft/70 transition-transform group-hover:translate-x-0.5 max-sm:hidden"
        />
      </button>
    </li>
  );
}
