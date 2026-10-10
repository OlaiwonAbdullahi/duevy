"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Wallet01Icon,
  ReceiptDollarIcon,
  UserMultipleIcon,
  MoneySend01Icon,
  ArrowUpRight01Icon,
} from "@hugeicons/core-free-icons";
import type { HugeIcon } from "./_components/nav-config";
import { useRole } from "./_components/role-context";

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: HugeIcon;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-3xl border border-cloud bg-canvas p-6">
      <div className="mb-4 grid h-9 w-9 place-items-center rounded-full bg-cloud text-brand">
        <HugeiconsIcon icon={icon} size={18} />
      </div>
      <p className="text-xs font-medium text-ink-soft">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-ink">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { isRep } = useRole();

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
            icon={Wallet01Icon}
            label="Outstanding dues"
            value="₦12,500"
            hint="2 dues awaiting payment"
          />
          <StatCard
            icon={ReceiptDollarIcon}
            label="Paid this session"
            value="₦34,000"
            hint="Across 5 receipts"
          />
          <StatCard
            icon={ReceiptDollarIcon}
            label="Last payment"
            value="₦7,500"
            hint="Departmental levy · 2 days ago"
          />
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
