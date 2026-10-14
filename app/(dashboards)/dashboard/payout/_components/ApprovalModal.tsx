"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mail01Icon, SignatureIcon } from "@hugeicons/core-free-icons";
import { Modal } from "../../_components/Modal";
import { fromKobo } from "../../_components/format";
import { approvePayout, sendApprovalOtp } from "@/lib/api/payouts";
import type { Payout } from "@/lib/api/types";
import { ApiError } from "@/lib/api/errors";
import { naira } from "./data";
import { SecurityCodeInput } from "./SecurityCodeInput";

/** Approve-time errors → what the signatory should do. */
const APPROVE_ERRORS: Record<string, string> = {
  OTP_EXPIRED: "That code has expired. Send yourself a new one.",
  OTP_LOCKED: "Too many wrong codes. Send yourself a new one.",
  ALREADY_SIGNED: "You've already approved this withdrawal.",
  NOT_A_SIGNATORY: "Only this department's signatories can approve withdrawals.",
  NOT_AWAITING_APPROVAL: "This withdrawal is no longer waiting for approval.",
  APPROVAL_EXPIRED: "This withdrawal wasn't approved in time and has been cancelled.",
  OTP_RECENTLY_SENT: "A code was just sent. Check your email, or try again in a minute.",
};

const RESEND_AFTER_S = 60;

/**
 * A signatory approves a waiting withdrawal with the 6-digit code Duevy
 * emails them. `codeSent` is true when the code went out already (the
 * requester gets theirs as soon as they ask to withdraw).
 */
export function ApprovalModal({
  spaceId,
  payout,
  codeSent: initiallySent = false,
  onClose,
  onApproved,
}: {
  spaceId: string;
  payout: Payout;
  codeSent?: boolean;
  onClose: () => void;
  /** Receives the updated payout: still `awaiting_approval`, or on its way to the bank. */
  onApproved: (payout: Payout) => void;
}) {
  const [sent, setSent] = useState(initiallySent);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(initiallySent ? RESEND_AFTER_S : 0);
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const send = async () => {
    setSending(true);
    setError(null);
    try {
      await sendApprovalOtp(spaceId, payout.id);
      setSent(true);
      setCooldown(RESEND_AFTER_S);
      setOtp("");
      toast.success("Code sent", { description: "Check your email for your 6-digit approval code." });
    } catch (err) {
      setError((err instanceof ApiError && APPROVE_ERRORS[err.code]) || "Couldn't send the code. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const approve = async () => {
    if (!/^\d{6}$/.test(otp)) return;
    setSubmitting(true);
    setError(null);
    try {
      onApproved(await approvePayout(spaceId, payout.id, otp));
    } catch (err) {
      setOtp("");
      if (err instanceof ApiError && err.code === "INVALID_OTP") {
        const left = err.details?.find((d) => d.field === "otp")?.issue.match(/(\d+) attempt/)?.[1];
        setError(left ? `Wrong code. ${left} attempt${left === "1" ? "" : "s"} left.` : "Wrong code. Check it and try again.");
      } else {
        setError((err instanceof ApiError && APPROVE_ERRORS[err.code]) || "Couldn't approve the withdrawal. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Approve withdrawal" icon={SignatureIcon} onClose={onClose}>
      {/* What they're signing for, so the code confirms something concrete. */}
      <dl className="flex flex-col gap-2 rounded-2xl border border-cloud bg-paper p-4 text-xs">
        <div className="flex justify-between gap-3 text-ink-soft">
          <dt>Amount</dt>
          <dd className="font-semibold text-ink tabular-nums">{naira(fromKobo(payout.amount))}</dd>
        </div>
        <div className="flex justify-between gap-3 text-ink-soft">
          <dt>They&apos;ll receive</dt>
          <dd className="font-semibold text-ink tabular-nums">{naira(fromKobo(payout.net))}</dd>
        </div>
        <div className="flex justify-between gap-3 text-ink-soft">
          <dt>To</dt>
          <dd className="min-w-0 truncate text-right font-semibold text-ink">
            {payout.accountName ? `${payout.accountName} · ` : ""}
            {payout.account}
          </dd>
        </div>
        <div className="flex justify-between gap-3 text-ink-soft">
          <dt>Reference</dt>
          <dd className="font-mono font-semibold text-ink">{payout.reference}</dd>
        </div>
      </dl>

      {!sent ? (
        <>
          <p className="mt-5 text-xs leading-5 text-ink-soft">
            We&apos;ll email you a 6-digit code. Entering it approves this withdrawal. It needs 2 approvals before the
            money is sent.
          </p>
          {error && <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-2.5 text-xs text-rose-600">{error}</p>}
          <button
            type="button"
            onClick={send}
            disabled={sending}
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            {sending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <HugeiconsIcon icon={Mail01Icon} size={16} />
            )}
            {sending ? "Sending…" : "Email me a code"}
          </button>
        </>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void approve();
          }}
        >
          <div className="mt-5">
            <div className="flex items-center justify-between">
              <label htmlFor="approval-otp" className="block text-xs font-medium text-ink-soft">
                Approval code
              </label>
              <button
                type="button"
                onClick={send}
                disabled={sending || cooldown > 0}
                className="text-xs font-semibold text-brand hover:underline disabled:cursor-not-allowed disabled:text-ink-soft disabled:no-underline cursor-pointer"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
            </div>
            <SecurityCodeInput
              id="approval-otp"
              value={otp}
              onChange={(v) => {
                setOtp(v);
                setError(null);
              }}
              length={6}
              masked={false}
              autoFocus
              disabled={submitting}
              invalid={!!error}
              className="mt-1.5"
            />
            <p className="mt-2 text-xs text-ink-soft">
              Sent to your email. It expires in 10 minutes. Never share it with anyone.
            </p>
          </div>
          {error && <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-2.5 text-xs text-rose-600">{error}</p>}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-12 flex-1 rounded-full border border-cloud bg-canvas text-sm font-semibold text-ink transition-colors duration-300 hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              Later
            </button>
            <button
              type="submit"
              disabled={otp.length !== 6 || submitting}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              {submitting && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {submitting ? "Approving…" : "Approve"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
