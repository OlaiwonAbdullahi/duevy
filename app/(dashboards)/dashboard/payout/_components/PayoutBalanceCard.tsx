import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ChartLineData01Icon,
  MoneySend01Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { naira } from "./data";

/**
 * Hero card for the payout page, on the Duevy doodle artwork. Shows what can
 * be withdrawn now, with the collected total and withdrawals still in flight
 * as context chips.
 */
export function PayoutBalanceCard({
  available,
  collected,
  inFlight,
  canWithdraw = true,
  blockedReason,
  onWithdraw,
}: {
  available: number;
  collected: number;
  /** Withdrawals requested but not yet settled. */
  inFlight: number;
  /** Withdrawal is lead-only. */
  canWithdraw?: boolean;
  /** Why the lead can't withdraw right now (verification, no beneficiary, one in flight, …). */
  blockedReason?: string | null;
  onWithdraw: () => void;
}) {
  return (
    <div className="doodle-card relative overflow-hidden rounded-[28px] p-5  sm:rounded-3xl sm:p-8">
      <div className="relative flex items-center gap-2 text-white/80">
        <HugeiconsIcon icon={Wallet01Icon} size={16} />
        <span className="text-xs font-medium">Available to withdraw</span>
      </div>
      <p className="relative mt-2 text-[32px] font-semibold leading-none tracking-tight text-white tabular-nums sm:mt-3 sm:text-4xl">
        {naira(available)}
      </p>

      <div className="relative mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 sm:flex sm:flex-wrap sm:gap-3">
        <Chip label="Total collected" value={naira(collected)} />
        <Chip label="In progress" value={naira(inFlight)} />
      </div>

      <div className="relative mt-5 flex gap-2.5 sm:mt-8 sm:flex-wrap sm:gap-3">
        {canWithdraw && (
          <button
            type="button"
            onClick={onWithdraw}
            disabled={available <= 0 || !!blockedReason}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-brand sm:h-12 sm:flex-none sm:px-7 transition-colors duration-300 hover:bg-cloud disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <HugeiconsIcon icon={MoneySend01Icon} size={16} />
            Withdraw<span className="max-sm:hidden"> funds</span>
          </button>
        )}
        <Link
          href="/dashboard/payout/breakdown"
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-white/15 px-4 text-sm font-semibold text-white backdrop-blur-sm sm:h-12 sm:flex-none sm:border sm:border-white/30 sm:bg-transparent sm:px-7 transition-colors duration-300 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <HugeiconsIcon icon={ChartLineData01Icon} size={16} />
          <span className="max-sm:hidden">View </span>Breakdown
        </Link>
      </div>
      {canWithdraw && blockedReason && (
        <p className="relative mt-3 text-xs text-white/80">{blockedReason}</p>
      )}
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-white/12 px-3.5 py-2.5 backdrop-blur-sm sm:px-4">
      <p className="truncate text-[11px] font-medium text-white/70">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-white tabular-nums">{value}</p>
    </div>
  );
}
