"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ChartLineData01Icon,
  Clock01Icon,
  Copy01Icon,
  MoneySend01Icon,
  Tick02Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import type { PayoutSummary, SpaceAccount, SpaceFunds } from "@/lib/api/types";
import { nairaFromKobo } from "../../_components/format";
import { InfoTip } from "@/components/ui/info-tip";
import { BankLogo } from "./BankLogo";


export function PayoutBalanceCard({
  summary,
  canWithdraw = true,
  blockedReason,
  onWithdraw,
}: {
  summary: PayoutSummary;
  canWithdraw?: boolean;
  blockedReason?: string | null;
  onWithdraw: () => void;
}) {
  const reserved = Math.max(0, summary.balance - summary.available);

  return (
    <div className="doodle-card relative flex h-full min-w-0 flex-col overflow-hidden rounded-[28px] p-5 sm:rounded-3xl sm:p-8">
      <div className="relative flex items-center gap-1.5 text-white/80">
        <HugeiconsIcon icon={Wallet01Icon} size={16} />
        <span className="text-xs font-medium">Available to withdraw</span>
        {reserved > 0 && (
          <InfoTip tone="onDark" label="Why this is less than the balance">
            Balance {nairaFromKobo(summary.balance)}. {nairaFromKobo(reserved)} is set aside for a withdrawal in
            progress.
          </InfoTip>
        )}
      </div>
      <p className="relative mt-2 text-[32px] font-semibold leading-none tracking-tight text-white tabular-nums sm:mt-3 sm:text-4xl">
        {nairaFromKobo(summary.available)}
      </p>

      {summary.funds && <DailyLimit funds={summary.funds} />}

      <div className="relative mt-5 flex gap-2.5 sm:mt-6 sm:flex-wrap sm:gap-3">
        {canWithdraw && (
          <button
            type="button"
            onClick={onWithdraw}
            disabled={summary.available <= 0 || !!blockedReason}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-brand transition-colors duration-300 hover:bg-cloud disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:h-12 sm:flex-none sm:px-7"
          >
            <HugeiconsIcon icon={MoneySend01Icon} size={16} />
            Withdraw<span className="max-sm:hidden"> funds</span>
          </button>
        )}
        <Link
          href="/dashboard/payout/breakdown"
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-white/15 px-4 text-sm font-semibold text-white backdrop-blur-sm transition-colors duration-300 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:h-12 sm:flex-none sm:border sm:border-white/30 sm:bg-transparent sm:px-7"
        >
          <HugeiconsIcon icon={ChartLineData01Icon} size={16} />
          <span className="max-sm:hidden">View </span>Breakdown
        </Link>
      </div>
      {canWithdraw && blockedReason && (
        <p className="relative mt-3 text-xs text-white/85" role="status">
          {blockedReason}
        </p>
      )}

      <dl className="relative mt-auto grid grid-cols-2 gap-2.5 pt-5 sm:gap-3 sm:pt-6">
        <Chip label="Total collected" value={nairaFromKobo(summary.collected)} />
        <Chip label="Withdrawn" value={nairaFromKobo(summary.withdrawn)} />
      </dl>

    </div>
  );
}

/** The department's own 9jaPay account (or its "being opened" state). */
export function SpaceAccountCard({ account }: { account: SpaceAccount | null | undefined }) {
  return (
    <section aria-labelledby="space-account-title" className="flex h-full flex-col rounded-3xl border border-cloud bg-canvas p-4 sm:p-6">
      <div className="flex items-center gap-3 px-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <h2 id="space-account-title" className="text-base font-semibold tracking-tight text-ink">
            Department account
          </h2>
          <InfoTip label="About the department account">
            The department&apos;s own account. The money belongs to the department, not any rep. Anyone, such
            as a sponsor or the faculty, can transfer to it; it lands in the balance as a direct deposit with
            the sender&apos;s name in Activity.
          </InfoTip>
        </div>
      </div>
      {account ? <AccountDetails account={account} /> : <AccountOpening />}
    </section>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-white/12 px-3.5 py-2.5 backdrop-blur-sm sm:px-4">
      <dt className="truncate text-[11px] font-medium text-white/70">{label}</dt>
      <dd className="mt-0.5 truncate text-sm font-semibold text-white tabular-nums">{value}</dd>
    </div>
  );
}

function groupAccountNumber(n: string) {
  return /^\d{10}$/.test(n) ? `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}` : n;
}

function AccountDetails({ account }: { account: SpaceAccount }) {
  const [copied, setCopied] = useState(false);
  const bankName = account.bankName ?? "9jaPay";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(account.accountNumber);
      setCopied(true);
      toast.success("Account number copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — copy it manually");
    }
  };

  return (
    // The account, styled like a light bank card so it sits quietly beside the balance.
    <div className="relative mt-4 flex flex-1 flex-col justify-between gap-5 overflow-hidden rounded-2xl border border-cloud bg-gradient-to-br from-cloud/70 via-paper to-paper p-4 sm:p-5">
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <BankLogo name={bankName} className="h-9 w-9 shrink-0 text-[10px]" />
          <span className="truncate text-sm font-semibold text-ink">{bankName}</span>
        </div>
        <span className="shrink-0 rounded-md border border-cloud bg-canvas/70 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-ink-soft">
          NGN
        </span>
      </div>

      <div className="relative">
        <p className="text-[11px] font-medium text-ink-soft">Account number</p>
        <div className="mt-1 flex items-center gap-2">
          <p className="font-mono text-[22px] font-semibold leading-tight tracking-[0.08em] text-ink tabular-nums sm:text-2xl">
            {groupAccountNumber(account.accountNumber)}
          </p>
          <button
            type="button"
            onClick={copy}
            aria-label="Copy account number"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-brand transition-colors duration-300 hover:bg-cloud cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={16} />
          </button>
        </div>
      </div>

      {account.accountName && (
        <p className="relative truncate text-xs font-semibold uppercase tracking-wider text-ink-soft">
          {account.accountName}
        </p>
      )}
    </div>
  );
}

function AccountOpening() {
  return (
    <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3.5" role="status">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700">
        <HugeiconsIcon icon={Clock01Icon} size={18} className="motion-safe:animate-pulse" />
      </span>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          The account is being opened
        </p>
        <p className="mt-0.5 text-xs text-ink-soft">Withdrawals open once it&apos;s ready.</p>
      </div>
    </div>
  );
}

/**
 * Today's withdrawal limit — kept small and muted on purpose so it isn't
 * mistaken for the balance.
 */
function DailyLimit({ funds }: { funds: SpaceFunds }) {
  const limit = funds.dailyLimitKobo;
  const remaining = Math.max(0, Math.min(limit, funds.dailyRemainingKobo));
  const usedPct = limit > 0 ? Math.round(((limit - remaining) / limit) * 100) : 0;

  return (
    <div className="relative mt-3 max-w-xs">
      <div className="flex items-center gap-1.5 text-[11px] text-white/70">
        <span>
          Daily limit · <span className="font-medium text-white/85 tabular-nums">{nairaFromKobo(remaining)}</span>{" "}
          left of {nairaFromKobo(limit)}
        </span>
        <InfoTip tone="onDark" label="About the daily limit">
          The most the department can withdraw in a day. It resets at midnight, Lagos time.
        </InfoTip>
      </div>
      <div
        className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/15"
        role="progressbar"
        aria-label="Today's withdrawal limit used"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={usedPct}
      >
        <span
          className={`block h-full rounded-full transition-[width] duration-500 ${usedPct >= 90 ? "bg-amber-300" : "bg-white/60"}`}
          style={{ width: `${usedPct}%` }}
        />
      </div>
    </div>
  );
}
