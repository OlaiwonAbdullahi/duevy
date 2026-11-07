"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon, Clock01Icon } from "@hugeicons/core-free-icons";
import { PayoutBalanceCard, SpaceAccountCard } from "./_components/PayoutBalanceCard";
import { PayoutHistory } from "./_components/PayoutHistory";
import type { WithdrawRequest } from "./_components/WithdrawModal";
import { PendingApprovalCard } from "./_components/PendingApprovalCard";
import { isPayoutInFlight } from "./_components/data";
import { ConfirmDialog } from "../_components/ConfirmDialog";
import { EmptyState } from "../_components/EmptyState";
import { useAuth } from "@/lib/auth/auth-context";
import {
  invalidateSpaceMoney,
  queryKeys,
  useBeneficiaries,
  usePayoutSummary,
  useSpaceReps,
  useWithdrawableDues,
} from "@/lib/api/queries";
import { useRepSpace } from "../_components/use-rep-space";
import { nairaFromKobo } from "../_components/format";
import { Skeleton } from "../_components/Skeleton";
import {
  addBeneficiary,
  requestPayout,
  setWithdrawalPin,
  resetWithdrawalPin,
  getPayout,
  rejectPayout,
} from "@/lib/api/payouts";
import type { Payout as ApiPayout, PayoutSummary } from "@/lib/api/types";
import { ApiError } from "@/lib/api/errors";
import { PIN_ERRORS, type PinMode } from "./_components/PinModal";

const WithdrawModal = dynamic(() => import("./_components/WithdrawModal").then((mod) => mod.WithdrawModal), { ssr: false });
const PinModal = dynamic(() => import("./_components/PinModal").then((mod) => mod.PinModal), { ssr: false });
const ApprovalModal = dynamic(() => import("./_components/ApprovalModal").then((mod) => mod.ApprovalModal), { ssr: false });

/** While a withdrawal is moving, re-read the summary and history this often. */
const IN_FLIGHT_POLL_MS = 7_000;
/** The withdrawal this tab just sent is polled a little faster, to confirm it promptly. */
const TRACKED_POLL_MS = 5_000;

const REJECT_ERRORS: Record<string, string> = {
  NOT_AWAITING_APPROVAL: "This withdrawal is no longer waiting for approval.",
  NOT_A_SIGNATORY: "Only signatories can reject withdrawals.",
};

const fmtWhen = (iso: string) => new Date(iso).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });


/** The lead rep's withdrawal-code state when it needs action: not set yet, or locked. */
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
  if (summary.withdrawalPinLockedUntil) {
    return (
      <div className={`${box} border-amber-200 bg-amber-50`}>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">Withdrawals are locked</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            Too many wrong security codes. Try again after {fmtWhen(summary.withdrawalPinLockedUntil)}, or reset your
            code.
          </p>
        </div>
        <button type="button" onClick={() => onAction("reset")} className={link}>
          Forgot code? Reset it →
        </button>
      </div>
    );
  }
  // Code is set: changing it lives in Settings → Security.
  return null;
}

/** Security banners every rep sees: a hold after a security change, or approvals missing signatories. */
function SecurityStatusBanner({ summary, isLead }: { summary: PayoutSummary; isLead: boolean }) {
  const box =
    "mt-4 flex flex-col gap-2 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3.5 sm:mt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-4";
  if (summary.withdrawalPinHoldUntil) {
    return (
      <div className={box}>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">Withdrawals paused after a security change</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            For your safety, withdrawals reopen {fmtWhen(summary.withdrawalPinHoldUntil)}.
          </p>
        </div>
      </div>
    );
  }
  if (summary.withdrawalAuthMode === "multisig" && !summary.signatoriesComplete) {
    return (
      <Link href="/dashboard/manage" className={`${box} transition-colors hover:bg-amber-100/60`}>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">Withdrawals need 3 signatories</p>
          <p className="mt-0.5 text-xs text-ink-soft">
            {isLead
              ? "Nominate two co-reps as signatories to withdraw again."
              : "Your lead rep needs to nominate two co-reps as signatories."}
          </p>
        </div>
        {isLead && <span className="shrink-0 text-[13px] font-semibold text-brand">Manage signatories →</span>}
      </Link>
    );
  }
  return null;
}

/** The withdrawal this tab just sent, until the bank confirms or refuses it. */
function TrackedWithdrawalBanner({ payout }: { payout: ApiPayout }) {
  return (
    <div
      role="status"
      className="mt-4 flex items-center gap-3 rounded-3xl border border-sky-200 bg-sky-50 px-4 py-3.5 sm:mt-6 sm:px-5 sm:py-4"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-sky-100 text-sky-700">
        <HugeiconsIcon icon={Clock01Icon} size={17} className="motion-safe:animate-pulse" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink tabular-nums">
          {nairaFromKobo(payout.amount)} to {payout.accountName ?? payout.account} is{" "}
          {payout.status === "pending" ? "being prepared" : "with the bank"}
        </p>
        <p className="mt-0.5 text-xs text-ink-soft">
          Usually takes a few minutes. This updates on its own; you&apos;ll see it here once the bank confirms.
        </p>
      </div>
    </div>
  );
}

export default function PayoutPage() {
  const repSpace = useRepSpace();
  const spaceId = repSpace?.id;
  const { user } = useAuth();
  const meId = user?.id;
  const queryClient = useQueryClient();
  // Beneficiaries and the security code are lead-only; a co-rep can withdraw
  // from the dues assigned to them.
  const isLead = repSpace?.membership !== "co";
  const { data: reps = [] } = useSpaceReps(spaceId);

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [pinMode, setPinMode] = useState<PinMode | null>(null);
  const [approving, setApproving] = useState<{ payout: ApiPayout; codeSent: boolean } | null>(null);
  const [rejecting, setRejecting] = useState(false);
  // The withdrawal this tab requested (or approved), watched until it settles.
  const [trackedId, setTrackedId] = useState<string | null>(null);

  // Poll only while something is moving; `pollMs` is derived from the last summary.
  const [pollMs, setPollMs] = useState<number | false>(false);
  const summaryQuery = usePayoutSummary(spaceId, { refetchInterval: pollMs });
  const summary = summaryQuery.data ?? null;
  const moving = !!summary && (summary.inFlight > 0 || !!summary.awaitingApprovalPayoutId);
  const nextPoll = moving ? IN_FLIGHT_POLL_MS : false;
  if (nextPoll !== pollMs) setPollMs(nextPoll);

  const beneficiariesQuery = useBeneficiaries(spaceId);
  const beneficiaries = useMemo(() => beneficiariesQuery.data ?? [], [beneficiariesQuery.data]);
  const duesQuery = useWithdrawableDues(spaceId);
  const dues = useMemo(() => duesQuery.data ?? [], [duesQuery.data]);
  const withdrawableDues = useMemo(() => dues.filter((d) => d.available > 0), [dues]);

  // The withdrawal waiting for signatures, with who has signed.
  const awaitingId = summary?.awaitingApprovalPayoutId ?? null;
  const pendingQuery = useQuery({
    queryKey: queryKeys.payoutDetail(spaceId ?? "", awaitingId ?? ""),
    queryFn: () => getPayout(spaceId!, awaitingId!),
    enabled: !!spaceId && !!awaitingId,
    refetchInterval: pollMs,
  });
  const pending = awaitingId && pendingQuery.data?.status === "awaiting_approval" ? pendingQuery.data : null;

  const trackedQuery = useQuery({
    queryKey: queryKeys.payoutDetail(spaceId ?? "", trackedId ?? ""),
    queryFn: () => getPayout(spaceId!, trackedId!),
    enabled: !!spaceId && !!trackedId,
    refetchInterval: (q) => (q.state.data && !isPayoutInFlight(q.state.data.status) ? false : TRACKED_POLL_MS),
  });
  const tracked = trackedId ? trackedQuery.data ?? null : null;

  // Announce the outcome once, when the API says it settled. Success is only ever
  // claimed on `status: "success"`.
  const announced = useRef<string | null>(null);
  useEffect(() => {
    if (!tracked || !spaceId || isPayoutInFlight(tracked.status) || announced.current === tracked.id) return;
    announced.current = tracked.id;
    if (tracked.status === "success") {
      toast.success("Withdrawal paid out", {
        description: `${nairaFromKobo(tracked.net)} reached ${tracked.accountName ?? tracked.account}.`,
      });
    } else if (tracked.status === "cancelled") {
      toast("Withdrawal cancelled", { description: "The full amount is back in the balance." });
    } else {
      toast.error("The withdrawal didn't go through", {
        description: `${tracked.failureReason ?? "The bank refused the transfer."} The full amount is back in the balance.`,
      });
    }
    invalidateSpaceMoney(queryClient, spaceId);
  }, [tracked, spaceId, queryClient]);

  /** Show the result of a request/approval and keep watching it if it's still moving. */
  const followPayout = (payout: ApiPayout) => {
    if (!spaceId) return;
    queryClient.setQueryData(queryKeys.payoutDetail(spaceId, payout.id), payout);
    if (isPayoutInFlight(payout.status) && payout.status !== "awaiting_approval") {
      announced.current = null;
      setTrackedId(payout.id);
    }
  };

  const withdrawMutation = useMutation({
    mutationFn: async ({ amountKobo, target, auth, idempotencyKey }: WithdrawRequest) => {
      const id = spaceId!;
      let destination: { beneficiaryId: string } | { bankCode: string; accountNumber: string };
      if ("beneficiaryId" in target) {
        destination = target;
      } else if (target.saveAsBeneficiary) {
        // Saving twice returns the same beneficiary, so a retry is harmless.
        const saved = await addBeneficiary(id, {
          bankCode: target.account.bankCode,
          accountNumber: target.account.accountNumber,
        });
        destination = { beneficiaryId: saved.id };
      } else {
        destination = { bankCode: target.account.bankCode, accountNumber: target.account.accountNumber };
      }
      return requestPayout(id, { amount: amountKobo, ...auth, ...destination }, idempotencyKey);
    },
    onSettled: (_data, _error, request) => {
      if (!spaceId) return;
      // Whatever happened (sent, refused, locked), re-read the balance and limits.
      invalidateSpaceMoney(queryClient, spaceId);
      if (!("beneficiaryId" in request.target) && request.target.saveAsBeneficiary) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.beneficiaries(spaceId) });
      }
    },
  });

  const handleWithdraw = async (request: WithdrawRequest) => {
    if (!spaceId) return;
    // Errors propagate to the modal, which explains them in place.
    const payout = await withdrawMutation.mutateAsync(request);
    setWithdrawOpen(false);
    followPayout(payout);
    if (payout.status === "awaiting_approval") {
      // A signatory requester was emailed their code: let them sign straight away.
      if (payout.approval?.otpSentToRequester) {
        setApproving({ payout, codeSent: true });
        toast("Withdrawal sent for approval", { description: "Enter the code we emailed you to add your approval." });
      } else {
        toast("Withdrawal sent for approval", {
          description: "2 signatories must approve it before it's sent. They've been notified.",
        });
      }
    } else if (payout.status === "success") {
      toast.success("Withdrawal paid out", { description: `${nairaFromKobo(payout.net)} sent.` });
    } else if (payout.status === "failed" || payout.status === "reversed" || payout.status === "cancelled") {
      // A 201 can already carry a provider refusal; the balance is restored then.
      announced.current = payout.id;
      toast.error("The withdrawal didn't go through", {
        description: payout.failureReason ?? "The full amount is back in the balance. Please try again later.",
      });
    } else {
      toast("Withdrawal requested", { description: "It's on its way. We'll confirm here once the bank does." });
    }
  };

  const pinMutation = useMutation({
    mutationFn: (payload: { mode: PinMode; pin: string; password: string; currentPin?: string }) =>
      payload.mode === "reset"
        ? resetWithdrawalPin(spaceId!, { pin: payload.pin, password: payload.password })
        : setWithdrawalPin(spaceId!, { pin: payload.pin, password: payload.password, currentPin: payload.currentPin }),
    onSuccess: (res) => {
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
    },
    onError: (err) => {
      toast.error("Couldn't save the code", {
        description: (err instanceof ApiError && PIN_ERRORS[err.code]) || "Something went wrong. Please try again.",
      });
    },
    onSettled: () => {
      if (spaceId) void queryClient.invalidateQueries({ queryKey: queryKeys.payoutSummary(spaceId) });
    },
  });

  const handleSavePin = async (payload: { pin: string; password: string; currentPin?: string }) => {
    if (!spaceId || !pinMode || pinMutation.isPending) return;
    await pinMutation.mutateAsync({ mode: pinMode, ...payload }).catch(() => {});
  };

  const handleApproved = (payout: ApiPayout) => {
    setApproving(null);
    followPayout(payout);
    if (spaceId) invalidateSpaceMoney(queryClient, spaceId);
    if (payout.status === "awaiting_approval") {
      toast.success("Approval added", { description: "One more signatory needs to approve it." });
    } else if (payout.status === "failed" || payout.status === "reversed") {
      announced.current = payout.id;
      toast.error("The withdrawal didn't go through", {
        description: payout.failureReason ?? "The balance has been restored. Please try again later.",
      });
    } else if (payout.status === "success") {
      toast.success("Withdrawal paid out", { description: `${nairaFromKobo(payout.net)} sent.` });
    } else {
      toast("Withdrawal approved", { description: "It's on its way to the bank. We'll confirm once it lands." });
    }
  };

  const rejectMutation = useMutation({
    mutationFn: (payout: ApiPayout) => rejectPayout(spaceId!, payout.id),
    onSuccess: (_res, payout) => {
      toast.success(payout.requestedById === meId ? "Withdrawal request cancelled" : "Withdrawal rejected", {
        description: "The amount is back in the balance.",
      });
    },
    onError: (err) => {
      toast.error("Couldn't cancel the withdrawal", {
        description: (err instanceof ApiError && REJECT_ERRORS[err.code]) || "Something went wrong. Please try again.",
      });
    },
    onSettled: () => {
      if (spaceId) invalidateSpaceMoney(queryClient, spaceId);
    },
  });

  const handleReject = () => {
    setRejecting(false);
    if (pending && !rejectMutation.isPending) rejectMutation.mutate(pending);
  };

  /** "Forgot code?" from the withdraw form. */
  const handleForgotPin = () => {
    setWithdrawOpen(false);
    setPinMode("reset");
  };

  const mode = summary?.withdrawalAuthMode ?? "pin";
  // A co-rep withdraws only from the dues the lead assigned them.
  const canWithdraw = isLead || withdrawableDues.length > 0;
  const withdrawBlockedReason = !summary
    ? null
    : !summary.kyc.canWithdraw
      ? "Withdrawals open once verification is complete."
      : summary.account === null
        ? "Withdrawals open once the department account is ready."
        : summary.withdrawalPinHoldUntil
          ? `Withdrawals are paused after a security change until ${fmtWhen(summary.withdrawalPinHoldUntil)}.`
          : mode === "multisig" && !summary.signatoriesComplete
            ? "Withdrawals need 3 signatories."
            : mode === "pin" && summary.withdrawalPinSet === false
              ? isLead
                ? "Set a withdrawal security code first."
                : "Your lead rep needs to set a withdrawal security code."
              : mode === "pin" && summary.withdrawalPinLockedUntil
                ? `Too many wrong security codes. Try again after ${fmtWhen(summary.withdrawalPinLockedUntil)}.`
                : summary.awaitingApprovalPayoutId
                  ? "A withdrawal is waiting for approval."
                  : summary.inFlight > 0
                    ? "A withdrawal is still in progress. You can send another once it settles."
                    : summary.funds && summary.funds.dailyRemainingKobo < summary.minPayout
                      ? "Today's withdrawal limit has been reached. It resets at midnight, Lagos time."
                      : null;
  const nameOf = (id: string | null) => reps.find((r) => r.id === id)?.name ?? null;
  // Pending until the space resolves and its summary arrives (a disabled query stays pending).
  const loading = summaryQuery.isPending;

  return (
    <div className="mx-auto max-w-6xl">
      <header>
        <span className="mb-2 hidden rounded-full bg-cloud px-3 py-1 text-[11px] font-semibold text-brand sm:inline-block">
          Rep tools
        </span>
        <div className="flex items-center gap-1.5">
          <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">Payout</h1>
        </div>
      </header>

      {loading ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]" aria-busy="true">
          <Skeleton className="h-60 rounded-3xl" />
          <div className="flex flex-col gap-6">
            <Skeleton className="h-40 rounded-3xl" />
            <Skeleton className="h-36 rounded-3xl" />
          </div>
          <Skeleton className="h-64 rounded-3xl lg:col-span-2" />
        </div>
      ) : !summary ? (
        <div className="mt-6 rounded-3xl border border-cloud bg-canvas">
          <EmptyState
            icon={Alert01Icon}
            title="Couldn't load your payout details"
            description="Something went wrong reaching the server."
            action={
              spaceId && (
                <button
                  type="button"
                  onClick={() => void summaryQuery.refetch()}
                  className="rounded-full border border-cloud px-4 py-2 text-xs font-semibold text-brand transition-colors hover:bg-paper cursor-pointer"
                >
                  Try again
                </button>
              )
            }
          />
        </div>
      ) : (
        <>
          {!summary.kyc.canWithdraw && (
            <Link
              href="/dashboard/kyc"
              className="mt-4 flex flex-col gap-2 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3.5 transition-colors hover:bg-amber-100/60 sm:mt-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5 sm:py-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">Finish verification to withdraw</p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {isLead
                    ? "Complete your verification on the Verification page."
                    : "Your lead rep needs to finish verification."}
                </p>
              </div>
              <span className="shrink-0 text-[13px] font-semibold text-brand">Go to verification →</span>
            </Link>
          )}
          <SecurityStatusBanner summary={summary} isLead={isLead} />
          {isLead && summary.kyc.canWithdraw && mode === "pin" && !summary.withdrawalPinHoldUntil && (
            <PinStatusBanner summary={summary} onAction={setPinMode} />
          )}
          {tracked && isPayoutInFlight(tracked.status) && tracked.status !== "awaiting_approval" && (
            <TrackedWithdrawalBanner payout={tracked} />
          )}
          {pending && (
            <PendingApprovalCard
              payout={pending}
              signatories={summary.signatories ?? []}
              requesterName={nameOf(pending.requestedById)}
              dueTitle={dues.find((d) => d.id === pending.dueId)?.title ?? null}
              meId={meId}
              onApprove={() => setApproving({ payout: pending, codeSent: false })}
              onReject={() => setRejecting(true)}
            />
          )}
          {/* Desktop: balance | department account on one row (same height), then the
              withdrawal history full width. Mobile stacks them in that order. minmax(0, …)
              stops truncated text widening the page. */}
          <div className="mt-4 grid grid-cols-1 gap-5 sm:mt-6 sm:gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
            <div className="min-w-0">
              <PayoutBalanceCard
                summary={summary}
                canWithdraw={canWithdraw}
                blockedReason={withdrawBlockedReason}
                onWithdraw={() => setWithdrawOpen(true)}
              />
            </div>
            <div className="min-w-0">
              <SpaceAccountCard account={summary.account} />
            </div>
            <div className="min-w-0 lg:col-span-2">
              <PayoutHistory spaceId={spaceId} pollMs={pollMs} />
            </div>
          </div>
        </>
      )}

      {withdrawOpen && summary && spaceId && (
        <WithdrawModal
          spaceId={spaceId}
          summary={summary}
          beneficiaries={beneficiaries}
          dues={withdrawableDues}
          spaceWide={isLead}
          onClose={() => setWithdrawOpen(false)}
          onConfirm={handleWithdraw}
          onForgotPin={isLead && mode === "pin" ? handleForgotPin : undefined}
        />
      )}
      {approving && spaceId && (
        <ApprovalModal
          spaceId={spaceId}
          payout={approving.payout}
          codeSent={approving.codeSent}
          onClose={() => setApproving(null)}
          onApproved={handleApproved}
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
      <ConfirmDialog
        open={rejecting}
        title={pending?.requestedById === meId ? "Cancel this withdrawal?" : "Reject this withdrawal?"}
        description="It won't be sent, and the full amount goes back to the balance."
        confirmLabel={pending?.requestedById === meId ? "Cancel withdrawal" : "Reject"}
        cancelLabel="Keep it"
        onConfirm={handleReject}
        onClose={() => setRejecting(false)}
      />
    </div>
  );
}
