"use client";

import { memo, type KeyboardEvent } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Skeleton } from "../../_components/Skeleton";
import { ROW_GRID, TransactionRow } from "./TransactionRow";
import type { Transaction } from "./types";

/** Up/Down (and Home/End) move between rows, like a list. */
function onListKeyDown(e: KeyboardEvent<HTMLUListElement>) {
  if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
  const rows = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>("[data-txn-row]"));
  const index = rows.indexOf(document.activeElement as HTMLButtonElement);
  if (index === -1) return;
  e.preventDefault();
  const next =
    e.key === "Home" ? 0 : e.key === "End" ? rows.length - 1 : e.key === "ArrowDown" ? Math.min(index + 1, rows.length - 1) : Math.max(index - 1, 0);
  rows[next]?.focus();
}

/** Desktop: one card with a column header. Phones: a stack of cards. */
export const TransactionList = memo(function TransactionList({
  rows,
  updating,
  onSelect,
}: {
  rows: Transaction[];
  updating: boolean;
  onSelect: (txn: Transaction) => void;
}) {
  return (
    <div className="relative md:overflow-hidden md:rounded-3xl md:border md:border-cloud md:bg-canvas" aria-busy={updating}>
      <UpdatingBar active={updating} />
      <div
        aria-hidden
        className={cn(
          "border-b border-cloud bg-paper/60 px-6 py-2.5 text-[11px] font-semibold tracking-wide text-ink-soft uppercase max-md:hidden",
          ROW_GRID,
        )}
      >
        <span>Transaction</span>
        <span className="max-xl:hidden">Method</span>
        <span>Date</span>
        <span>Status</span>
        <span className="pr-6 text-right">Amount</span>
      </div>
      <ul
        aria-label="Transactions"
        onKeyDown={onListKeyDown}
        className={cn(
          "flex flex-col gap-2 transition-opacity duration-200 md:gap-0 md:divide-y md:divide-cloud",
          updating && "opacity-60",
        )}
      >
        {rows.map((txn) => (
          <TransactionRow key={txn.id} txn={txn} onSelect={onSelect} />
        ))}
      </ul>
    </div>
  );
});

/** A thin indeterminate bar while the next page or filter loads over the current one. */
function UpdatingBar({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden transition-opacity duration-200 max-md:-top-2 max-md:rounded-full",
        active ? "opacity-100" : "opacity-0",
      )}
    >
      {active && <div className="h-full w-full animate-pulse rounded-full bg-brand/70" />}
    </div>
  );
}

export function TransactionListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="md:overflow-hidden md:rounded-3xl md:border md:border-cloud md:bg-canvas" aria-busy="true" aria-label="Loading transactions">
      <div className="border-b border-cloud bg-paper/60 px-6 py-3 max-md:hidden">
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="flex flex-col gap-2 md:gap-0 md:divide-y md:divide-cloud">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl border border-cloud bg-canvas p-4 md:rounded-none md:border-0 md:bg-transparent md:px-6 md:py-4">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-3.5 w-40 max-w-full" />
              <Skeleton className="mt-2 h-3 w-24" />
            </div>
            <Skeleton className="h-3.5 w-24 max-md:hidden" />
            <Skeleton className="h-5 w-20 rounded-full max-md:hidden" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Prev / next with the page and the slice of the total being shown. */
export function Pagination({
  page,
  totalPages,
  total,
  perPage,
  shownCount,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
  shownCount: number;
  onPage: (page: number) => void;
}) {
  const first = total === 0 ? 0 : (page - 1) * perPage + 1;
  const last = (page - 1) * perPage + shownCount;
  const btn =
    "inline-flex h-9 cursor-pointer items-center gap-1 rounded-full border border-cloud bg-canvas px-3 text-[13px] font-semibold text-ink transition-colors hover:bg-paper focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-canvas";

  return (
    <nav aria-label="Transactions pages" className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-ink-soft tabular-nums">
        Showing <span className="font-semibold text-ink">{first.toLocaleString("en-NG")}–{last.toLocaleString("en-NG")}</span> of{" "}
        {total.toLocaleString("en-NG")}
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <button type="button" className={btn} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={15} aria-hidden />
            <span className="max-[380px]:sr-only">Prev</span>
          </button>
          <span className="min-w-[5.5rem] text-center text-[13px] font-medium text-ink tabular-nums" aria-current="page">
            Page {page} of {totalPages}
          </span>
          <button type="button" className={btn} disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Next page">
            <span className="max-[380px]:sr-only">Next</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={15} aria-hidden />
          </button>
        </div>
      )}
    </nav>
  );
}

/** Route-level and Suspense placeholder: header, filters, summary, list. */
export function TransactionsPageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="mt-2 h-3 w-64 max-w-full max-sm:hidden" />
      <div className="mt-5 flex flex-col gap-3 sm:mt-6 md:flex-row md:justify-between">
        <Skeleton className="h-10 w-full rounded-full md:w-72" />
        <Skeleton className="h-10 w-full rounded-full md:w-72" />
      </div>
      <div className="mt-3 flex gap-2">
        <Skeleton className="h-10 w-32 rounded-full" />
        <Skeleton className="h-10 w-32 rounded-full" />
        <Skeleton className="h-10 w-32 rounded-full max-sm:hidden" />
      </div>
      <Skeleton className="mt-4 h-[74px] w-full rounded-3xl" />
      <div className="mt-4">
        <TransactionListSkeleton />
      </div>
    </div>
  );
}
