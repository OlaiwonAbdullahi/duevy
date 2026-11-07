"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert01Icon,
  ArrowReloadHorizontalIcon,
  BankIcon,
  Invoice01Icon,
  MoneyAdd01Icon,
  MoneySend01Icon,
  ReceiptDollarIcon,
} from "@hugeicons/core-free-icons";
import { useLedgerPage } from "@/lib/api/queries";
import type { LedgerEntry, LedgerEntryType } from "@/lib/api/types";
import type { HugeIcon } from "../../_components/nav-config";
import { EmptyState } from "../../_components/EmptyState";
import { Skeleton } from "../../_components/Skeleton";
import { nairaFromKobo } from "../../_components/format";
import { formatDateTime } from "../../transactions/_components/data";
import { timeAgo } from "../../_components/notifications-data";
import { Pager } from "./Pager";

const LEDGER_META: Record<LedgerEntryType, { icon: HugeIcon; label: string }> = {
  due_payment: { icon: Invoice01Icon, label: "Due payment" },
  manual_credit: { icon: MoneyAdd01Icon, label: "Credit from Duevy" },
  direct_deposit: { icon: BankIcon, label: "Direct deposit" },
  payout: { icon: MoneySend01Icon, label: "Withdrawal" },
  payout_fee: { icon: ReceiptDollarIcon, label: "Transfer fee" },
  payout_reversal: { icon: ArrowReloadHorizontalIcon, label: "Withdrawal returned" },
  refund: { icon: ArrowReloadHorizontalIcon, label: "Refund" },
};
const LEDGER_FALLBACK = { icon: ReceiptDollarIcon as HugeIcon, label: "Transaction" };

/** The line's headline: who sent a direct deposit, else the server's description, else the type. */
function entryTitle(entry: LedgerEntry, label: string) {
  if (entry.type === "direct_deposit") return entry.description ? `From ${entry.description}` : "Bank transfer in";
  return entry.description || label;
}

/**
 * The department's ledger, a page at a time: collections, direct deposits,
 * withdrawals and their fees, reversals and refunds, signed and coloured by
 * direction. It's what the balance is computed from.
 */
export function LedgerCard({ spaceId, perPage = 20 }: { spaceId: string | undefined; perPage?: number }) {
  const [page, setPage] = useState(1);
  const query = useLedgerPage(spaceId, page, perPage);
  const entries = query.data?.data ?? [];

  return (
    <section aria-labelledby="ledger-title" className="rounded-3xl border border-cloud bg-canvas p-4 sm:p-6">
      <div className="flex items-center gap-3 px-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <h2 id="ledger-title" className="text-base font-semibold tracking-tight text-ink">
            All activity
          </h2>
        </div>
      </div>

      {query.isPending ? (
        <ul className="mt-4 flex flex-col" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 border-t border-cloud py-3.5 first:border-t-0">
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-3.5 w-40 max-w-full" />
                <Skeleton className="mt-2 h-3 w-24" />
              </div>
              <Skeleton className="h-4 w-16" />
            </li>
          ))}
        </ul>
      ) : query.isError && entries.length === 0 ? (
        <EmptyState
          icon={Alert01Icon}
          title="Couldn't load activity"
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
      ) : entries.length === 0 ? (
        <EmptyState
          icon={ReceiptDollarIcon}
          title="No activity yet"
          description="Student payments, transfers into the department account and withdrawals will show up here."
        />
      ) : (
        <ul className={`mt-3 flex flex-col transition-opacity ${query.isPlaceholderData ? "opacity-60" : ""}`}>
          {entries.map((entry) => {
            const meta = LEDGER_META[entry.type] ?? LEDGER_FALLBACK;
            const isIn = entry.signedAmount > 0 || (entry.signedAmount === 0 && entry.direction === "credit");
            return (
              <li key={entry.id} className="flex items-center gap-3 border-t border-cloud py-3.5 first:border-t-0">
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                    isIn ? "bg-cloud text-brand" : "bg-paper text-ink-soft"
                  }`}
                >
                  <HugeiconsIcon icon={meta.icon} size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{entryTitle(entry, meta.label)}</p>
                  <p className="truncate text-xs text-ink-soft">
                    {meta.label} ·{" "}
                    <time dateTime={entry.createdAt} title={formatDateTime(entry.createdAt)}>
                      {timeAgo(entry.createdAt)}
                    </time>
                    {entry.reference && <span className="max-sm:hidden"> · {entry.reference}</span>}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-sm font-semibold tabular-nums ${isIn ? "text-brand" : "text-ink"}`}
                  aria-label={`${isIn ? "In" : "Out"} ${nairaFromKobo(entry.signedAmount)}`}
                >
                  {isIn ? "+" : "−"}
                  {nairaFromKobo(entry.signedAmount)}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <Pager
        meta={query.data?.meta}
        page={page}
        onPage={setPage}
        busy={query.isPlaceholderData}
        label="Activity"
      />
    </section>
  );
}
