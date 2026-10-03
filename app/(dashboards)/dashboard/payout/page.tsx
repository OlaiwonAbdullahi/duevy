"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { accountLabel } from "./_components/data";
import type { BankAccount, Payout } from "./_components/types";

/** Placeholder until the rep's real account loads from the API. */
const EMPTY_ACCOUNT: BankAccount = { bankName: "", accountName: "", accountNumber: "" };
import { PayoutBalanceCard } from "./_components/PayoutBalanceCard";
import { PayoutAccountCard } from "./_components/PayoutAccountCard";
import Link from "next/link";
import { PayoutHistory } from "./_components/PayoutHistory";
import { WithdrawModal } from "./_components/WithdrawModal";
import { EditAccountModal } from "./_components/EditAccountModal";
import { useRepSpace } from "../_components/use-rep-space";
import { fromKobo } from "../_components/format";
import { timeAgo } from "../_components/notifications-data";
import { Skeleton } from "../_components/Skeleton";
import {
  getPayoutSummary,
  getPayoutAccount,
  setPayoutAccount,
  requestPayout,
  listPayouts,
} from "@/lib/api/payouts";
import type { AccountEdit } from "./_components/EditAccountModal";
import type { Payout as ApiPayout, PayoutSummary } from "@/lib/api/types";
import { ApiError } from "@/lib/api/errors";

/** API payout (kobo, ISO date) → history row. */
function adaptPayout(p: ApiPayout): Payout {
  return {
    id: p.id,
    amount: fromKobo(p.amount),
    fee: fromKobo(p.fee),
    net: fromKobo(p.net),
    requestedAt: timeAgo(p.requestedAt),
    reference: p.reference,
    status: p.status,
    requestedById: p.requestedById,
    account: p.account,
    failureReason: p.failureReason,
  };
}

/** API error code → what the rep should do about it. */
const PAYOUT_ERRORS: Record<string, string> = {
  KYC_NOT_VERIFIED: "Finish verification on the Verification page before withdrawing.",
  NO_PAYOUT_ACCOUNT: "Add a payout account first.",
  ACCOUNT_COOLDOWN: "Withdrawals are on hold for 24 hours after an account change.",
  WITHDRAWAL_IN_PROGRESS: "Another withdrawal is still in progress. Try again once it settles.",
  INSUFFICIENT_BALANCE: "That's more than your available balance.",
  BELOW_MIN_PAYOUT: "That's below the minimum withdrawal.",
  PAYOUTS_FROZEN: "Withdrawals for this space are paused. Contact support.",
  FORBIDDEN: "Only the department's lead rep can withdraw.",
};

const ACCOUNT_ERRORS: Record<string, { title: string; description: string }> = {
  ACCOUNT_UNVERIFIABLE: {
    title: "We couldn't verify that account",
    description: "Double-check the bank and account number and try again.",
  },
  ACCOUNT_NAME_MISMATCH: {
    title: "That account isn't in your name",
    description: "Withdrawals can only go to a bank account in your own name.",
  },
  KYC_NOT_VERIFIED: {
    title: "Verify your identity first",
    description: "You can add a payout account once your NIN is verified.",
  },
  FORBIDDEN: {
    title: "Only the lead rep can change this",
    description: "Ask your department's lead rep to update the payout account.",
  },
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function PayoutPage() {
  const repSpace = useRepSpace();
  const spaceId = repSpace?.id;
  // Withdrawals and the payout account are lead-only.
  const isLead = repSpace?.membership !== "co";

  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [account, setAccount] = useState<BankAccount>(EMPTY_ACCOUNT);
  const [hasAccount, setHasAccount] = useState(false);
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  async function refresh(id: string) {
    const [nextSummary, acct, history] = await Promise.all([
      getPayoutSummary(id),
      getPayoutAccount(id).catch(() => null), // no account set yet is fine
      listPayouts(id),
    ]);
    setSummary(nextSummary);
    if (acct && acct.accountNumber) {
      setAccount({
        bankName: acct.bankName ?? "",
        accountName: acct.accountName ?? "",
        accountNumber: acct.accountNumber,
      });
      setHasAccount(true);
    } else {
      setHasAccount(false);
    }
    setPayouts(history.map(adaptPayout));
  }

  useEffect(() => {
    if (!spaceId) return;
    refresh(spaceId)
      .catch(() => toast.error("Couldn't load your payout details."))
      .finally(() => setLoading(false));
  }, [spaceId]);

  const handleWithdraw = async (amount: number) => {
    if (!spaceId) return;
    try {
      const payout = await requestPayout(spaceId, { amount: Math.round(amount * 100) });
      setWithdrawOpen(false);
      // A 201 can already carry a provider refusal; the balance is restored then.
      if (payout.status === "failed" || payout.status === "reversed") {
        toast.error("The withdrawal didn't go through", {
          description: payout.failureReason ?? "Your balance has been restored. Please try again later.",
        });
      } else {
        toast.success("Withdrawal requested", {
          description: "We're processing it now — check the history below for status.",
        });
      }
      await refresh(spaceId);
    } catch (err) {
      toast.error("Couldn't request the withdrawal", {
        description:
          (err instanceof ApiError && PAYOUT_ERRORS[err.code]) || "Something went wrong. Please try again.",
      });
    }
  };

  const handleSaveAccount = async (next: AccountEdit) => {
    if (!spaceId) return;
    try {
      // The API strictly takes { bankCode, accountNumber } — the account name is
      // resolved + verified server-side via Bachs name-enquiry.
      await setPayoutAccount(spaceId, {
        bankCode: next.bankCode,
        accountNumber: next.accountNumber,
      });
      setEditOpen(false);
      toast.success("Payout account updated", {
        description: `${next.bankName} · ${accountLabel({
          bankName: next.bankName,
          accountName: "",
          accountNumber: next.accountNumber,
        })}`,
      });
      await refresh(spaceId);
    } catch (err) {
      const known = err instanceof ApiError ? ACCOUNT_ERRORS[err.code] : undefined;
      toast.error(known?.title ?? "Couldn't update the account", {
        description: known?.description ?? "Something went wrong. Please try again.",
      });
    }
  };

  const available = fromKobo(summary?.available ?? 0);
  const cooldownUntil =
    summary?.cooldownUntil && new Date(summary.cooldownUntil) > new Date() ? summary.cooldownUntil : null;
  const withdrawBlockedReason = !summary
    ? null
    : !summary.kyc.canWithdraw
      ? "Withdrawals open once verification is complete."
      : !summary.payoutAccountReady
        ? "Add a payout account to withdraw."
        : cooldownUntil
          ? `Withdrawals are on hold until ${formatTime(cooldownUntil)} after the account change.`
          : summary.inFlight > 0
            ? "A withdrawal is still in progress."
            : null;

  return (
    <div className="mx-auto max-w-5xl">
      <header>
        <span className="mb-2 inline-block rounded-full bg-cloud px-3 py-1 text-[11px] font-semibold text-brand">
          Rep tools
        </span>
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          Payout
        </h1>
        <p className="mt-1 text-[13px] text-ink-soft">
          Withdraw the funds your department has collected to its bank account.
        </p>
      </header>

      {loading ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-48 rounded-3xl" />
        </div>
      ) : (
        <>
          {summary && !summary.kyc.canWithdraw && (
            <Link
              href="/dashboard/kyc"
              className="mt-6 flex items-center justify-between gap-4 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 transition-colors hover:bg-amber-100/60"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">Finish verification to withdraw</p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {isLead
                    ? "Verify your identity and student ID on the Verification page."
                    : "Your lead rep needs to finish verification."}
                </p>
              </div>
              <span className="shrink-0 text-[13px] font-semibold text-brand">Go to verification →</span>
            </Link>
          )}
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <PayoutBalanceCard
              available={available}
              collected={fromKobo(summary?.collected ?? 0)}
              inFlight={fromKobo(summary?.inFlight ?? 0)}
              canWithdraw={isLead}
              blockedReason={withdrawBlockedReason}
              onWithdraw={() => setWithdrawOpen(true)}
            />
            <PayoutAccountCard
              account={account}
              hasAccount={hasAccount}
              onEdit={() => setEditOpen(true)}
            />
          </div>
        </>
      )}

      <div className="mt-6">
        {loading ? (
          <Skeleton className="h-64 rounded-3xl" />
        ) : (
          <PayoutHistory payouts={payouts} />
        )}
      </div>

      {withdrawOpen && (
        <WithdrawModal
          spaceId={spaceId ?? ""}
          available={available}
          minPayout={fromKobo(summary?.minPayout ?? 0)}
          account={account}
          onClose={() => setWithdrawOpen(false)}
          onConfirm={handleWithdraw}
        />
      )}
      {editOpen && (
        <EditAccountModal
          spaceId={spaceId ?? ""}
          account={account}
          onClose={() => setEditOpen(false)}
          onSave={handleSaveAccount}
        />
      )}
    </div>
  );
}
