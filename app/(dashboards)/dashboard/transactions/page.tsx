"use client";

import { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  MoneyReceive02Icon,
  MoneySend01Icon,
  ReceiptDollarIcon,
} from "@hugeicons/core-free-icons";
import type { HugeIcon } from "../_components/nav-config";
import type { TxnFilter } from "./_components/types";
import { TRANSACTIONS, naira, groupByDay } from "./_components/data";
import type { Transaction } from "./_components/types";
import { TransactionRow } from "./_components/TransactionRow";
import { ReceiptModal } from "./_components/ReceiptModal";
import { EmptyState } from "../_components/EmptyState";

const TABS: { value: TxnFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in", label: "Money in" },
  { value: "out", label: "Money out" },
];

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: HugeIcon;
  label: string;
  value: string;
  tone?: "brand";
}) {
  return (
    <div className="rounded-3xl border border-cloud bg-canvas p-5">
      <div className="mb-3 grid h-9 w-9 place-items-center rounded-full bg-cloud text-brand">
        <HugeiconsIcon icon={icon} size={18} />
      </div>
      <p className="text-xs font-medium text-ink-soft">{label}</p>
      <p
        className={`mt-1 text-xl font-semibold tracking-tight ${
          tone === "brand" ? "text-brand" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function TransactionsPage() {
  const [filter, setFilter] = useState<TxnFilter>("all");
  const [query, setQuery] = useState("");
  const [receiptTxn, setReceiptTxn] = useState<Transaction | null>(null);

  // Newest first, then apply the direction tab and search box.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...TRANSACTIONS]
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
  }, [filter, query]);

  const groups = useMemo(() => groupByDay(filtered), [filtered]);

  // Totals reflect settled money only — pending/failed don't move the balance.
  const totals = useMemo(() => {
    const settled = TRANSACTIONS.filter((t) => t.status === "completed");
    return {
      in: settled.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0),
      out: settled
        .filter((t) => t.amount < 0)
        .reduce((s, t) => s + Math.abs(t.amount), 0),
    };
  }, []);

  return (
    <div className="mx-auto max-w-4xl">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          Transactions
        </h1>
        <p className="mt-1 text-[13px] text-ink-soft">
          Every top up, due and bonus — your full money trail.
        </p>
      </header>

      {/* Money in / out this session. */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
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
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
              className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
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
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transactions"
            aria-label="Search transactions"
            className="h-10 w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft"
          />
        </div>
      </div>

      {/* Ledger. */}
      <div className="mt-4 rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
        {groups.length === 0 ? (
          <EmptyState
            icon={ReceiptDollarIcon}
            title="No transactions found"
            description="Nothing matches the current filters. Try a different tab or clear your search."
            action={
              (filter !== "all" || query.trim() !== "") && (
                <button
                  type="button"
                  onClick={() => {
                    setFilter("all");
                    setQuery("");
                  }}
                  className="inline-flex h-9 items-center justify-center rounded-full border border-cloud bg-paper px-4 text-xs font-semibold text-ink transition-colors duration-300 hover:bg-cloud cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                >
                  Clear filters
                </button>
              )
            }
          />
        ) : (
          <div className="flex flex-col gap-6">
            {groups.map(([label, txns]) => (
              <div key={label}>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                  {label}
                </p>
                <ul className="flex flex-col">
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
