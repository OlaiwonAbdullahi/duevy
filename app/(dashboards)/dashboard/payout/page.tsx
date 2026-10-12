"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Beneficiary, Payout } from "./_components/types";
import { PayoutBalanceCard } from "./_components/PayoutBalanceCard";
import { BeneficiariesCard } from "./_components/BeneficiariesCard";
import Link from "next/link";
import { PayoutHistory } from "./_components/PayoutHistory";
import type { WithdrawTarget } from "./_components/WithdrawModal";
import { useRepSpace } from "../_components/use-rep-space";
import { fromKobo } from "../_components/format";
import { timeAgo } from "../_components/notifications-data";
import { Skeleton } from "../_components/Skeleton";
import {
  getPayoutSummary,
  listBeneficiaries,
  addBeneficiary,
  removeBeneficiary,
  requestPayout,
  setWithdrawalPin,
  resetWithdrawalPin,
  listPayouts,
} from "@/lib/api/payouts";
import type { BeneficiaryDraft } from "./_components/AddBeneficiaryModal";
import type { Payout as ApiPayout, PayoutSummary } from "@/lib/api/types";
import { ApiError } from "@/lib/api/errors";
import type { PinMode } from "./_components/PinModal";

const WithdrawModal = dynamic(() => import("./_components/WithdrawModal").then((mod) => mod.WithdrawModal), { ssr: false });
const PinModal = dynamic(() => import("./_components/PinModal").then((mod) => mod.PinModal), { ssr: false });
const AddBeneficiaryModal = dynamic(() => import("./_components/AddBeneficiaryModal").then((mod) => mod.AddBeneficiaryModal), { ssr: false });

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
    accountName: p.accountName ?? null,
    failureReason: p.failureReason,
    note: p.note ?? null,
    timeline: {
      requestedAt: p.requestedAt,
      processingAt: p.processingAt,
      settledAt: p.settledAt,
      failedAt: p.failedAt,
      reversedAt: p.reversedAt,
    },
  };
}

/** API error code → what the rep should do about it. */
const PAYOUT_ERRORS: Record<string, string> = {
  KYC_NOT_VERIFIED: "Finish verification on the Verification page before withdrawing.",
  BENEFICIARY_NOT_FOUND: "That beneficiary was removed. Pick another one.",
  ACCOUNT_UNVERIFIABLE: "We couldn't verify that account. Check the bank and number.",
  WITHDRAWAL_IN_PROGRESS: "Another withdrawal is still in progress. Try again once it settles.",
  INSUFFICIENT_BALANCE: "That's more than your available balance.",
  BELOW_MIN_PAYOUT: "That's below the minimum withdrawal.",
  PAYOUTS_FROZEN: "Withdrawals for this space are paused. Contact support.",
  WITHDRAWAL_PIN_NOT_SET: "Set a withdrawal security code first.",
  WITHDRAWAL_PIN_LOCKED: "Too many wrong security codes. Try again in 30 minutes, or reset your code.",
  WITHDRAWAL_PIN_HOLD: "Your code was reset recently. Withdrawals reopen 24 hours after a reset.",
  FORBIDDEN: "Only the department's lead rep can withdraw.",
};

/** Setting/changing/resetting the withdrawal code. */
const PIN_ERRORS: Record<string, string> = {
  INVALID_PASSWORD: "Your password is incorrect.",
  PASSWORD_REQUIRED: "Your account has no password yet. Sign out, use \u201cForgot password\u201d to create one, then try again.",
  WEAK_PIN: "Choose a less predictable code.",
  INVALID_WITHDRAWAL_PIN: "Your current code is incorrect.",
  WITHDRAWAL_PIN_LOCKED: "Too many wrong codes. Reset your code instead.",
};

const BENEFICIARY_ERRORS: Record<string, { title: string; description: string }> = {
  ACCOUNT_UNVERIFIABLE: {
    title: "We couldn't verify that account",
    description: "Double-check the bank and account number and try again.",
  },
  TOO_MANY_BENEFICIARIES: {
    title: "Too many beneficiaries",
    description: "Remove one you no longer use, then try again.",
  },
  KYC_NOT_VERIFIED: {
    title: "Verify your identity first",
    description: "You can add beneficiaries once your NIN is verified.",
  },
  FORBIDDEN: {
    title: "Only the lead rep can do this",
    description: "Ask your department's lead rep to manage beneficiaries.",
  },
};

/** The lead rep's withdrawal-code state: set it, it's locked/on hold, or a quiet "change" link. */
function PinStatusBanner({ summary, onAction }: { summary: PayoutSummary; onAction: (mode: PinMode) => void }) {
  const box =
    "mt-4 flex flex-col gap-2 rounded-3xl border px-4 py-3.5 sm:mt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-4";
  const link = "shrink-0 text-left text-[13px] font-semibold text-brand cursor-pointer hover:underline";

  if (!summary.withdrawalPinSet) {
    return (
      <div className={`${box} border-amber-200 bg-amber-50`}>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">Set a withdrawal security code</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            Choose a 4-digit code you&apos;ll enter every time you withdraw. Only you know it.
          </p>
        </div>
        <button type="button" onClick={() => onAction("set")} className={link}>
          Set code →
        </button>
      </div>
    );
  }
  if (summary.withdrawalPinHoldUntil) {
    return (
      <div className={`${box} border-amber-200 bg-amber-50`}>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">Withdrawals paused after a code reset</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            For your safety, withdrawals reopen {new Date(summary.withdrawalPinHoldUntil).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}.
          </p>
        </div>
      </div>
    );
  }
  if (summary.withdrawalPinLockedUntil) {
    return (
      <div className={`${box} border-amber-200 bg-amber-50`}>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">Withdrawals are locked</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            Too many wrong security codes. Try again in 30 minutes, or reset your code.
          </p>
        </div>
        <button type="button" onClick={() => onAction("reset")} className={link}>
          Forgot code? Reset it →
        </button>
      </div>
    );
  }
  return (
    <div className="mt-4 flex items-center justify-end gap-3 text-xs sm:mt-6">
      <span className="text-ink-soft">Withdrawal security code is set</span>
      <button type="button" onClick={() => onAction("change")} className="font-semibold text-brand cursor-pointer hover:underline">
        Change code
      </button>
    </div>
  );
}

export default function PayoutPage() {
  const repSpace = useRepSpace();
  const spaceId = repSpace?.id;
  // Withdrawals and beneficiaries are lead-only.
  const isLead = repSpace?.membership !== "co";

  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [pinMode, setPinMode] = useState<PinMode | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh(id: string) {
    const [nextSummary, list, history] = await Promise.all([
      getPayoutSummary(id),
      listBeneficiaries(id),
      listPayouts(id),
    ]);
    setSummary(nextSummary);
    setBeneficiaries(list);
    setPayouts(history.map(adaptPayout));
  }

  useEffect(() => {
    if (!spaceId) return;
    refresh(spaceId)
      .catch(() => toast.error("Couldn't load your payout details."))
      .finally(() => setLoading(false));
  }, [spaceId]);

  const handleWithdraw = async (amount: number, target: WithdrawTarget, pin: string) => {
    if (!spaceId) return;
    let destination: { beneficiaryId: string } | { bankCode: string; accountNumber: string };
    if ("beneficiaryId" in target) {
      destination = target;
    } else if (target.saveAsBeneficiary) {
      try {
        const saved = await addBeneficiary(spaceId, {
          bankCode: target.account.bankCode,
          accountNumber: target.account.accountNumber,
        });
        destination = { beneficiaryId: saved.id };
      } catch (err) {
        const known = err instanceof ApiError ? BENEFICIARY_ERRORS[err.code] : undefined;
        toast.error(known?.title ?? "Couldn't save the beneficiary", {
          description: known?.description ?? "Untick “Save as a beneficiary” to send without saving.",
        });
        return;
      }
    } else {
      destination = { bankCode: target.account.bankCode, accountNumber: target.account.accountNumber };
    }
    try {
      const payout = await requestPayout(spaceId, { amount: Math.round(amount * 100), pin, ...destination });
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
      if (err instanceof ApiError && err.code === "INVALID_WITHDRAWAL_PIN") {
        // The modal stays open so the rep can try again; the server says how many tries are left.
        const left = err.details?.find((d) => d.field === "pin")?.issue.match(/(\d+) attempt/)?.[1];
        toast.error("Wrong security code", {
          description: left ? `${left} attempt${left === "1" ? "" : "s"} left before withdrawals lock.` : "Check the code and try again.",
        });
        return;
      }
      toast.error("Couldn't request the withdrawal", {
        description:
          (err instanceof ApiError && PAYOUT_ERRORS[err.code]) || "Something went wrong. Please try again.",
      });
      if (err instanceof ApiError && err.code === "WITHDRAWAL_PIN_LOCKED") {
        setWithdrawOpen(false);
        await refresh(spaceId).catch(() => {});
      }
    }
  };

  const handleSavePin = async (payload: { pin: string; password: string; currentPin?: string }) => {
    if (!spaceId || !pinMode) return;
    try {
      const res =
        pinMode === "reset"
          ? await resetWithdrawalPin(spaceId, { pin: payload.pin, password: payload.password })
          : await setWithdrawalPin(spaceId, payload);
      setPinMode(null);
      if (res.change === "reset") {
        toast.success("Withdrawal code reset", {
          description: "For your safety, withdrawals reopen in 24 hours. Your co-reps have been notified.",
        });
      } else {
        toast.success(res.change === "set" ? "Withdrawal code saved" : "Withdrawal code changed", {
          description: "You'll enter it every time you withdraw.",
        });
      }
      await refresh(spaceId).catch(() => {});
    } catch (err) {
      toast.error("Couldn't save the code", {
        description: (err instanceof ApiError && PIN_ERRORS[err.code]) || "Something went wrong. Please try again.",
      });
    }
  };

  /** "Forgot code?" from the withdraw form or the change dialog. */
  const handleForgotPin = () => {
    setWithdrawOpen(false);
    setPinMode("reset");
  };

  const handleAddBeneficiary = async (next: BeneficiaryDraft) => {
    if (!spaceId) return;
    try {
      // The account name is resolved server-side via Bachs name-enquiry.
      const added = await addBeneficiary(spaceId, {
        bankCode: next.bankCode,
        accountNumber: next.accountNumber,
        label: next.label,
      });
      setAddOpen(false);
      toast.success("Beneficiary added", {
        description: `${added.accountName} · ${added.bankName} ${added.accountNumber}`,
      });
      await refresh(spaceId);
    } catch (err) {
      const known = err instanceof ApiError ? BENEFICIARY_ERRORS[err.code] : undefined;
      toast.error(known?.title ?? "Couldn't add the beneficiary", {
        description: known?.description ?? "Something went wrong. Please try again.",
      });
    }
  };

  const handleRemoveBeneficiary = async (b: Beneficiary) => {
    if (!spaceId) return;
    try {
      await removeBeneficiary(spaceId, b.id);
      setBeneficiaries((list) => list.filter((x) => x.id !== b.id));
      toast.success("Beneficiary removed");
    } catch {
      toast.error("Couldn't remove the beneficiary. Please try again.");
    }
  };

  const available = fromKobo(summary?.available ?? 0);
  const withdrawBlockedReason = !summary
    ? null
    : !summary.kyc.canWithdraw
      ? "Withdrawals open once verification is complete."
      : summary.withdrawalPinSet === false
        ? "Set a withdrawal security code first."
        : summary.withdrawalPinHoldUntil
          ? "Your code was reset. Withdrawals reopen 24 hours after a reset."
          : summary.withdrawalPinLockedUntil
            ? "Too many wrong security codes. Try again in 30 minutes."
            : summary.inFlight > 0
            ? "A withdrawal is still in progress."
            : null;

  return (
    <div className="mx-auto max-w-6xl">
      <header>
        <span className="mb-2 hidden rounded-full bg-cloud sm:inline-block px-3 py-1 text-[11px] font-semibold text-brand">
          Rep tools
        </span>
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          Payout
        </h1>
        <p className="mt-1 text-[13px] text-ink-soft max-sm:hidden">
          Send the funds your department has collected to any bank account: yours, a lecturer&apos;s or a vendor&apos;s.
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
              className="mt-4 flex flex-col gap-2 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3.5 transition-colors hover:bg-amber-100/60 sm:mt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-4"
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
          {isLead && summary?.kyc.canWithdraw && (
            <PinStatusBanner summary={summary} onAction={setPinMode} />
          )}
          {/* Desktop: balance | beneficiaries, history full width below.
              Mobile: balance → history → beneficiaries. The minmax(0, …)
              tracks stop long (truncated) text widening the page. */}
          <div className="mt-4 grid grid-cols-1 gap-5 sm:mt-6 sm:gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <PayoutBalanceCard
              available={available}
              collected={fromKobo(summary?.collected ?? 0)}
              inFlight={fromKobo(summary?.inFlight ?? 0)}
              canWithdraw={isLead}
              blockedReason={withdrawBlockedReason}
              onWithdraw={() => setWithdrawOpen(true)}
            />
            <div className="grid min-w-0 grid-cols-1 max-lg:order-last">
              <BeneficiariesCard
                beneficiaries={beneficiaries}
                canManage={isLead}
                onAdd={() => setAddOpen(true)}
                onRemove={handleRemoveBeneficiary}
              />
            </div>
            <div className="min-w-0 lg:col-span-2">
              <PayoutHistory payouts={payouts} />
            </div>
          </div>
        </>
      )}

      {loading && <Skeleton className="mt-5 h-64 rounded-3xl sm:mt-6" />}

      {withdrawOpen && (
        <WithdrawModal
          spaceId={spaceId ?? ""}
          available={available}
          minPayout={fromKobo(summary?.minPayout ?? 0)}
          beneficiaries={beneficiaries}
          onClose={() => setWithdrawOpen(false)}
          onConfirm={handleWithdraw}
          onForgotPin={handleForgotPin}
        />
      )}
      {pinMode && (
        <PinModal
          mode={pinMode}
          onClose={() => setPinMode(null)}
          onSubmit={handleSavePin}
          onForgot={() => setPinMode("reset")}
        />
      )}
      {addOpen && (
        <AddBeneficiaryModal
          spaceId={spaceId ?? ""}
          onClose={() => setAddOpen(false)}
          onSave={handleAddBeneficiary}
        />
      )}
    </div>
  );
}
