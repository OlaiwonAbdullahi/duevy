"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  MoneyReceive02Icon,
  MoneySend01Icon,
  ReceiptDollarIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { listTransactions } from "@/lib/api/transactions";
import type { Transaction as ApiTransaction } from "@/lib/api/types";
import { StatCard } from "../_components/StatCard";
import { InlineStat } from "../_components/overview/OverviewUI";
import { BARE_INPUT } from "../_components/form-styles";
import type { Transaction, TxnFilter, TxnType } from "./_components/types";
import { TXN_META, naira, groupByDay } from "./_components/data";
import { TransactionRow } from "./_components/TransactionRow";
import { EmptyState } from "../_components/EmptyState";

const ReceiptModal = dynamic(() => import("./_components/ReceiptModal").then((mod) => mod.ReceiptModal), { ssr: false });

const TABS: { value: TxnFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in", label: "Money in" },
  { value: "out", label: "Money out" },
];

/** Map an API transaction (kobo, minimal fields) to the ledger row shape. */
function adapt(t: ApiTransaction): Transaction {
  const type: TxnType = t.type in TXN_META ? (t.type as TxnType) : "due";
  const meta = TXN_META[type];
  return {
    id: t.id,
    type,
    title: t.title ?? meta.label,
    detail: t.detail ?? t.method ?? meta.label,
    amount: t.amount / 100, // kobo → naira for the whole-naira `naira()` helper
    method: t.method ?? "—",
    date: t.createdAt,
    status: t.status,
    reference: t.reference,
  };
}

const EMPTY_TRANSACTIONS: Transaction[] = [];

export default function TransactionsPage() {
  const [filter, setFilter] = useState<TxnFilter>("all");
  const [query, setQuery] = useState("");
  const [receiptTxn, setReceiptTxn] = useState<Transaction | null>(null);

  // Cached: revisiting the page renders instantly and refreshes in the background.
  const txQuery = useQuery({
    queryKey: ["me", "transactions"],
    queryFn: () => listTransactions({ perPage: 100 }).then(({ data }) => data.map(adapt)),
  });
  const transactions = txQuery.data ?? EMPTY_TRANSACTIONS;
  const loading = txQuery.isPending;
  const error = txQuery.isError;

  useEffect(() => {
    if (txQuery.isError) toast.error("Couldn't load your transactions.");
  }, [txQuery.isError]);

  // Newest first, then apply the direction tab and search box.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...transactions]
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
      .filter((t) => (filter === "in" ? t.amount > 0 : true))
      .filter((t) => (filter === "out" ? t.amount < 0 : true))
      .filter(
        (t) =>
          q === "" ||
          t.title.toLowerCase().includes(q) ||
          t.detail.toLowerCase().includes(q) ||
          t.reference.toLowerCase().includes(q),
      );
  }, [filter, query, transactions]);

  const groups = useMemo(() => groupByDay(filtered), [filtered]);

  // Totals reflect settled money only — pending/failed don't move the balance.
  const totals = useMemo(() => {
    const settled = transactions.filter((t) => t.status === "completed");
    return {
      in: settled.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0),
      out: settled
        .filter((t) => t.amount < 0)
        .reduce((s, t) => s + Math.abs(t.amount), 0),
    };
  }, [transactions]);

  return (
    <div className="mx-auto max-w-6xl">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          Transactions
        </h1>
        <p className="mt-1 text-[13px] text-ink-soft max-sm:hidden">
          Every top up, due and bonus — your full money trail.
        </p>
      </header>

      {/* Phones: money out as the headline figure, money in beside it. */}
      <div className="mt-4 sm:hidden">
        <InlineStat
          label="Money out"
          value={naira(totals.out)}
          caption={`Net ${totals.in - totals.out < 0 ? "−" : ""}${naira(totals.in - totals.out)} · settled only`}
          aside={
            <div className="shrink-0 text-right">
              <p className="text-xs font-medium text-ink-soft">Money in</p>
              <p className="mt-1 text-lg font-semibold tracking-tight text-brand tabular-nums">
                +{naira(totals.in)}
              </p>
            </div>
          }
        />
      </div>

      {/* Money in / out this session. */}
      <div className="mt-6 hidden gap-4 sm:grid sm:grid-cols-3">
        <StatCard
          icon={MoneyReceive02Icon}
          label="Money in"
          value={naira(totals.in)}
          tone="brand"
        />
        <StatCard
          icon={MoneySend01Icon}
          label="Money out"
          value={naira(totals.out)}
        />
        <StatCard
          icon={ReceiptDollarIcon}
          label="Net"
          value={`${totals.in - totals.out < 0 ? "−" : ""}${naira(
            totals.in - totals.out,
          )}`}
        />
      </div>

      {/* Controls. */}
      <div className="mt-5 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Filter transactions"
          className="flex items-center rounded-full border border-cloud bg-paper p-1"
        >
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={filter === tab.value}
              onClick={() => setFilter(tab.value)}
              className={`flex-1 rounded-full px-4 py-2 text-[13px] font-semibold sm:flex-none sm:py-1.5 transition-colors duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                filter === tab.value
                  ? "bg-brand text-white"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-full border border-cloud bg-canvas px-4 transition-colors focus-within:border-brand sm:w-64">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            className="shrink-0 text-ink-soft"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transactions"
            aria-label="Search transactions"
            className={cn(BARE_INPUT, "h-10 px-0")}
          />
        </div>
      </div>

      {/* Ledger. */}
      {/* Phones: no outer card — each day is its own card below. */}
      <div className="mt-4 sm:rounded-3xl sm:border sm:border-cloud sm:bg-canvas sm:p-6">
        {loading ? (
          <ul className="flex animate-pulse flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="h-14 rounded-2xl bg-paper" />
            ))}
          </ul>
        ) : error ? (
          <EmptyState
            icon={ReceiptDollarIcon}
            title="Couldn't load transactions"
            description="Something went wrong reaching the server. Refresh the page to try again."
          />
        ) : groups.length === 0 ? (
          <EmptyState
            icon={ReceiptDollarIcon}
            title="No transactions found"
            description="Nothing matches the current filters. Try a different tab or clear your search."
            action={
              (filter !== "all" || query.trim() !== "") && (
                <Button
                  variant="brand-outline"
                  size="pill"
                  onClick={() => {
                    setFilter("all");
                    setQuery("");
                  }}
                >
                  Clear filters
                </Button>
              )
            }
          />
        ) : (
          <div className="flex flex-col gap-5 sm:gap-6">
            {groups.map(([label, txns]) => (
              <div key={label}>
                <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-ink-soft sm:mb-1 sm:px-0">
                  {label}
                </p>
                <ul className="flex flex-col max-sm:rounded-3xl max-sm:border max-sm:border-cloud max-sm:bg-canvas max-sm:px-4">
                  {txns.map((txn) => (
                    <TransactionRow
                      key={txn.id}
                      txn={txn}
                      onSelect={setReceiptTxn}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {receiptTxn && (
        <ReceiptModal txn={receiptTxn} onClose={() => setReceiptTxn(null)} />
      )}
    </div>
  );
}
