"use client";

import dynamic from "next/dynamic";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, ReceiptDollarIcon, SearchRemoveIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { useTransactions } from "@/lib/api/queries";
import { EmptyState } from "../_components/EmptyState";
import { Skeleton } from "../_components/Skeleton";
import { adaptTransaction } from "./_components/data";
import { PER_PAGE, describeFilters, hasActiveFilters, toApiQuery } from "./_components/filters";
import { useTransactionFilters } from "./_components/use-transaction-filters";
import { FilterBar } from "./_components/FilterBar";
import {
  Pagination,
  TransactionList,
  TransactionListSkeleton,
  TransactionsPageSkeleton,
} from "./_components/TransactionList";
import type { Transaction } from "./_components/types";

const ReceiptModal = dynamic(() => import("./_components/ReceiptModal").then((mod) => mod.ReceiptModal), { ssr: false });

export default function TransactionsPage() {
  // useSearchParams needs a Suspense boundary.
  return (
    <Suspense fallback={<TransactionsPageSkeleton />}>
      <TransactionsView />
    </Suspense>
  );
}

function TransactionsView() {
  const { filters, setFilters, clearFilters } = useTransactionFilters();
  // Server-side filtering and paging; the previous page stays up while the next loads.
  const query = useMemo(() => toApiQuery(filters), [filters]);
  const tx = useTransactions(query);
  const [selected, setSelected] = useState<Transaction | null>(null);
  const listTop = useRef<HTMLDivElement>(null);

  const rows = useMemo(() => (tx.data?.data ?? []).map(adaptTransaction), [tx.data]);
  const meta = tx.data?.meta;
  const total = meta?.total ?? rows.length;
  const totalPages = Math.max(1, meta?.totalPages ?? 1);
  const shownPage = meta?.page ?? filters.page;
  const active = hasActiveFilters(filters);
  const updating = tx.isPlaceholderData && tx.isFetching;
  const filterParts = useMemo(() => describeFilters(filters), [filters]);

  // A shared or stale link past the last page lands on the last real page.
  useEffect(() => {
    if (tx.isPlaceholderData || !meta?.totalPages) return;
    if (filters.page > meta.totalPages) setFilters({ page: meta.totalPages });
  }, [tx.isPlaceholderData, meta?.totalPages, filters.page, setFilters]);

  const goToPage = useCallback(
    (page: number) => {
      setFilters({ page });
      const el = listTop.current;
      if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [setFilters],
  );

  const closeDetails = useCallback(() => setSelected(null), []);

  return (
    <div className="mx-auto max-w-6xl">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">Transactions</h1>
        <p className="mt-1 text-[13px] text-ink-soft max-sm:hidden">
          Every top up, due and bonus — your full money trail.
        </p>
      </header>

      <div className="mt-5 sm:mt-6">
        <FilterBar filters={filters} onChange={setFilters} onClear={clearFilters} />
      </div>

      {/* Summary of the current filtered result — the count comes from the server's meta. */}
      <section
        ref={listTop}
        aria-label="Result summary"
        className="mt-4 flex scroll-mt-24 flex-col gap-3 rounded-3xl border border-cloud bg-canvas px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0">
          <p className="text-xs font-medium text-ink-soft">{active ? "Matching your filters" : "All transactions"}</p>
          {tx.isPending ? (
            <Skeleton className="mt-1.5 h-7 w-36" />
          ) : tx.isError && !tx.data ? (
            <p className="mt-0.5 text-sm font-medium text-ink-soft">—</p>
          ) : (
            <p className="mt-0.5 text-2xl font-semibold tracking-tight text-ink tabular-nums" aria-live="polite" aria-atomic="true">
              {total.toLocaleString("en-NG")}{" "}
              <span className="text-sm font-medium tracking-normal text-ink-soft">
                {total === 1 ? "transaction" : "transactions"}
              </span>
            </p>
          )}
        </div>
        {filterParts.length > 0 && (
          <ul aria-label="Active filters" className="flex min-w-0 flex-wrap gap-1.5 sm:justify-end">
            {filterParts.map((part) => (
              <li key={part} className="max-w-full truncate rounded-full bg-paper px-2.5 py-1 text-[11px] font-medium text-ink-soft">
                {part}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-4">
        {tx.isPending ? (
          <TransactionListSkeleton />
        ) : tx.isError && !tx.data ? (
          <Panel>
            <EmptyState
              icon={Alert02Icon}
              title="Couldn't load transactions"
              description="Something went wrong reaching the server. Check your connection and try again."
              action={
                <Button variant="brand-outline" size="pill" onClick={() => void tx.refetch()} disabled={tx.isFetching}>
                  {tx.isFetching ? "Retrying…" : "Try again"}
                </Button>
              }
            />
          </Panel>
        ) : rows.length === 0 && total === 0 ? (
          <Panel>
            {active ? (
              <EmptyState
                icon={SearchRemoveIcon}
                title="No results for these filters"
                description="Nothing matches what you've picked. Widen the dates or clear the filters to see everything."
                action={
                  <Button variant="brand-outline" size="pill" onClick={clearFilters}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={ReceiptDollarIcon}
                title="No transactions yet"
                description="Dues you pay, top ups and bonuses will show up here as soon as money moves."
              />
            )}
          </Panel>
        ) : (
          <>
            {tx.isError && (
              <p role="status" className="mb-3 flex items-center gap-2 rounded-2xl bg-rose-100 px-4 py-2.5 text-xs text-rose-700 dark:bg-rose-400/15 dark:text-rose-300">
                <HugeiconsIcon icon={Alert02Icon} size={14} aria-hidden className="shrink-0" />
                <span className="min-w-0 flex-1">Couldn&apos;t refresh — showing the last loaded results.</span>
                <button type="button" onClick={() => void tx.refetch()} className="cursor-pointer font-semibold underline-offset-2 hover:underline">
                  Retry
                </button>
              </p>
            )}
            <TransactionList rows={rows} updating={updating} onSelect={setSelected} />
            <Pagination
              page={shownPage}
              totalPages={totalPages}
              total={total}
              perPage={meta?.perPage ?? PER_PAGE}
              shownCount={rows.length}
              onPage={goToPage}
            />
          </>
        )}
      </div>

      {selected && <ReceiptModal txn={selected} onClose={closeDetails} />}
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-3xl border border-cloud bg-canvas">{children}</div>;
}
