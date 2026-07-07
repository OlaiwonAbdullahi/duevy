"use client";

import { useMemo } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Wallet01Icon,
  ReceiptDollarIcon,
  MoneyAdd01Icon,
  GiftIcon,
  Invoice01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { EmptyState } from "../EmptyState";
import {
  DUES,
  naira,
  relativeDue,
  CATEGORY_ICON,
  CATEGORY_LABEL,
} from "../../dues/_components/data";
import {
  TRANSACTIONS,
  TXN_META,
  formatTime,
} from "../../transactions/_components/data";
import { StatCard, QuickAction, PanelHeader } from "./OverviewUI";

/** A student's wallet balance — seeded to match the wallet demo. */
const WALLET_BALANCE = 8500;

export function StudentOverview({ name = "Amara" }: { name?: string }) {
  const openDues = useMemo(
    () =>
      [...DUES]
        .filter((d) => d.status !== "paid")
        .sort((a, b) => {
          const rank = (s: string) => (s === "overdue" ? 0 : 1);
          return (
            rank(a.status) - rank(b.status) ||
            +new Date(a.dueDate) - +new Date(b.dueDate)
          );
        }),
    [],
  );
  const outstanding = useMemo(
    () => openDues.reduce((sum, d) => sum + d.amount, 0),
    [openDues],
  );
  const paidThisSession = useMemo(
    () =>
      TRANSACTIONS.filter(
        (t) => t.type === "due" && t.status === "completed" && t.amount < 0,
      ).reduce((sum, t) => sum + Math.abs(t.amount), 0),
    [],
  );
  const recent = useMemo(
    () =>
      [...TRANSACTIONS]
        .sort((a, b) => +new Date(b.date) - +new Date(a.date))
        .slice(0, 4),
    [],
  );

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
        Welcome back, {name}
      </h1>
      <p className="mt-1 text-[13px] text-ink-soft">
        Your dues and payments at a glance.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={Invoice01Icon}
          label="Outstanding dues"
          value={naira(outstanding)}
          hint={`${openDues.length} due${openDues.length === 1 ? "" : "s"} awaiting payment`}
        />
        <StatCard
          icon={ReceiptDollarIcon}
          label="Paid this session"
          value={naira(paidThisSession)}
          hint="Across your settled dues"
        />
        <StatCard
          icon={Wallet01Icon}
          label="Wallet balance"
          value={naira(WALLET_BALANCE)}
          hint="Available to pay dues"
          tone="brand"
        />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAction
          href="/dashboard/dues"
          icon={Invoice01Icon}
          label="Pay dues"
          hint="Settle what you owe"
        />
        <QuickAction
          href="/dashboard/dues#join"
          icon={UserAdd01Icon}
          label="Join a department"
          hint="Enter a code to join"
        />
        <QuickAction
          href="/dashboard/wallet"
          icon={MoneyAdd01Icon}
          label="Top up wallet"
          hint="Add funds to pay faster"
        />
        <QuickAction
          href="/dashboard/referrals"
          icon={GiftIcon}
          label="Invite friends"
          hint="Earn ₦500 each"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
          <PanelHeader title="Outstanding dues" href="/dashboard/dues" />

          {openDues.length === 0 ? (
            <EmptyState
              icon={CheckmarkCircle02Icon}
              title="You're all settled"
              description="No outstanding dues right now. New dues from your spaces will show up here."
            />
          ) : (
            <ul className="mt-3 flex flex-col">
              {openDues.slice(0, 4).map((due) => {
                const rel = relativeDue(due.dueDate);
                return (
                  <li
                    key={due.id}
                    className="flex items-center gap-3 border-t border-cloud py-3.5 first:border-t-0"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cloud text-brand">
                      <HugeiconsIcon icon={CATEGORY_ICON[due.category]} size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {due.title}
                      </p>
                      <p
                        className={`truncate text-xs ${
                          rel.past ? "text-rose-600" : "text-ink-soft"
                        }`}
                      >
                        {CATEGORY_LABEL[due.category]} · {rel.text}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-ink">
                      {naira(due.amount)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          <Button variant="brand" size="pill-lg" asChild className="mt-4 w-full">
            <Link href="/dashboard/dues">
              Pay dues
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </Link>
          </Button>
        </section>

        <section className="rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
          <PanelHeader title="Recent activity" href="/dashboard/transactions" />

          <ul className="mt-3 flex flex-col">
            {recent.map((txn) => {
              const isIn = txn.amount > 0;
              return (
                <li
                  key={txn.id}
                  className="flex items-center gap-3 border-t border-cloud py-3.5 first:border-t-0"
                >
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                      isIn ? "bg-cloud text-brand" : "bg-paper text-ink-soft"
                    }`}
                  >
                    <HugeiconsIcon icon={TXN_META[txn.type].icon} size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {txn.title}
                    </p>
                    <p className="truncate text-xs text-ink-soft">
                      {formatTime(txn.date)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-semibold ${
                      isIn ? "text-brand" : "text-ink"
                    }`}
                  >
                    {isIn ? "+" : "−"}
                    {naira(txn.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
