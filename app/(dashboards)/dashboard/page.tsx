"use client";

import { useMemo } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Wallet01Icon,
  ReceiptDollarIcon,
  UserMultipleIcon,
  MoneySend01Icon,
  MoneyAdd01Icon,
  GiftIcon,
  Invoice01Icon,
  ArrowUpRight01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import type { HugeIcon } from "./_components/nav-config";
import { EmptyState } from "./_components/EmptyState";
import { useRole } from "./_components/role-context";
import {
  DUES,
  naira,
  relativeDue,
  CATEGORY_ICON,
  CATEGORY_LABEL,
} from "./dues/_components/data";
import { TRANSACTIONS, TXN_META, formatTime } from "./transactions/_components/data";

/** A student's wallet balance — seeded to match the wallet demo. */
const WALLET_BALANCE = 8500;

function StatCard({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: HugeIcon;
  label: string;
  value: string;
  hint?: string;
  tone?: "brand";
}) {
  return (
    <div className="rounded-3xl border border-cloud bg-canvas p-6">
      <div className="mb-4 grid h-9 w-9 place-items-center rounded-full bg-cloud text-brand">
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
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
  hint,
}: {
  href: string;
  icon: HugeIcon;
  label: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-cloud bg-canvas p-4 transition-colors duration-300 hover:bg-paper cursor-pointer"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cloud text-brand">
        <HugeiconsIcon icon={icon} size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="truncate text-xs text-ink-soft">{hint}</p>
      </div>
      <HugeiconsIcon
        icon={ArrowRight01Icon}
        size={16}
        className="shrink-0 text-ink-soft transition-transform duration-300 group-hover:translate-x-0.5"
      />
    </Link>
  );
}

export default function DashboardPage() {
  const { isRep } = useRole();

  // Top open dues, soonest first — the things a student should act on.
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
      {/* ---- Shared: every viewer (student + rep) sees this ---- */}
      <section>
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          Overview
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

        {/* Quick actions. */}
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <QuickAction
            href="/dashboard/dues"
            icon={Invoice01Icon}
            label="Pay dues"
            hint="Settle what you owe"
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

        {/* Dues + activity. */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Outstanding dues. */}
          <section className="rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold tracking-tight text-ink">
                Outstanding dues
              </h2>
              <Link
                href="/dashboard/dues"
                className="text-xs font-semibold text-brand transition-colors hover:text-brand-bright cursor-pointer"
              >
                View all
              </Link>
            </div>

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
                        <HugeiconsIcon
                          icon={CATEGORY_ICON[due.category]}
                          size={18}
                        />
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

            <Link
              href="/dashboard/dues"
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright cursor-pointer"
            >
              Pay dues
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </Link>
          </section>

          {/* Recent activity. */}
          <section className="rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold tracking-tight text-ink">
                Recent activity
              </h2>
              <Link
                href="/dashboard/transactions"
                className="text-xs font-semibold text-brand transition-colors hover:text-brand-bright cursor-pointer"
              >
                View all
              </Link>
            </div>

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
      </section>

      {/* ---- Rep-only: same /dashboard route, extra section for reps ---- */}
      {isRep && (
        <section className="mt-10">
          <div className="mb-4 flex items-center gap-2">
            <span className="rounded-full bg-cloud px-3 py-1 text-[11px] font-semibold text-brand">
              Rep tools
            </span>
            <h2 className="text-base font-semibold tracking-tight text-ink">
              Department at a glance
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              icon={Wallet01Icon}
              label="Wallet balance"
              value="₦486,000"
              hint="Available to pay out"
            />
            <StatCard
              icon={UserMultipleIcon}
              label="Collection rate"
              value="82%"
              hint="164 of 200 students paid"
            />
            <StatCard
              icon={MoneySend01Icon}
              label="Pending payout"
              value="₦120,000"
              hint="Awaiting student approval"
            />
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-3xl border border-cloud bg-cloud/50 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">36 students haven&apos;t paid</p>
              <p className="text-xs text-ink-soft">
                Send a reminder before the deadline on Fri.
              </p>
            </div>
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright cursor-pointer">
              Send reminders
              <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} />
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
