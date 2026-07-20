"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BankIcon,
  Copy01Icon,
  Tick02Icon,
  CheckmarkCircle02Icon,
  Alert01Icon,
} from "@hugeicons/core-free-icons";
import { Modal } from "./Modal";
import { getPaymentStatus, type PaymentStatus } from "@/lib/api/dues";
import { ApiError } from "@/lib/api/errors";
import { nairaFromKobo } from "./format";

export type InvoiceDetails = {
  reference: string;
  amount: number; // kobo
  bankTransfer: {
    accountNumber: string;
    bankName: string;
    accountName: string;
    expiresAt: string | null;
  };
};

const BACKGROUND_POLL_MS = 5000;

/**
 * In-app "invoice" flow (payment architecture migration) — replaces the old
 * hosted-checkout redirect. Shows the dedicated bank-transfer account inline;
 * the payer taps "I've made payment" to check now, and this also polls
 * quietly in the background, but the webhook (server-side) remains the real
 * source of truth — this modal is just a UX accelerant on top of it.
 */
export function InvoiceModal({
  invoice,
  onClose,
  onConfirmed,
}: {
  invoice: InvoiceDetails;
  onClose: () => void;
  onConfirmed: (result: PaymentStatus) => void;
}) {
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const settled = useRef(false);

  const expired =
    !!invoice.bankTransfer.expiresAt &&
    new Date(invoice.bankTransfer.expiresAt).getTime() < Date.now();

  const check = async (manual: boolean) => {
    if (settled.current) return;
    if (manual) setChecking(true);
    try {
      const res = await getPaymentStatus(invoice.reference);
      if (settled.current) return;
      if (res.status === "completed") {
        settled.current = true;
        onConfirmed(res);
        return;
      }
      if (res.status === "failed") {
        settled.current = true;
        setFailed(true);
        return;
      }
      if (manual) {
        toast.info("Still waiting for your transfer", {
          description: "We'll keep checking automatically — no need to keep tapping.",
        });
      }
    } catch (err) {
      if (manual) {
        toast.error(err instanceof ApiError ? err.message : "Couldn't check payment status.");
      }
    } finally {
      if (manual) setChecking(false);
    }
  };

  useEffect(() => {
    if (expired || failed) return;
    const interval = setInterval(() => check(false), BACKGROUND_POLL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expired, failed]);

  const copyAccountNumber = async () => {
    try {
      await navigator.clipboard.writeText(invoice.bankTransfer.accountNumber);
      setCopied(true);
      toast.success("Account number copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy the account number");
    }
  };

  if (failed) {
    return (
      <Modal title="Payment failed" icon={Alert01Icon} onClose={onClose}>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-rose-50 text-rose-600">
            <HugeiconsIcon icon={Alert01Icon} size={24} />
          </span>
          <p className="text-sm text-ink-soft">
            This payment didn&apos;t go through. You weren&apos;t charged — close this and try again.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Complete your payment" icon={BankIcon} onClose={onClose}>
      <div className="rounded-2xl border border-cloud bg-paper/50 p-4">
        <p className="text-[11px] font-medium text-ink-soft">Transfer exactly</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-ink">
          {nairaFromKobo(invoice.amount)}
        </p>
      </div>

      {expired ? (
        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-rose-50 p-3 text-xs text-rose-700">
          <HugeiconsIcon icon={Alert01Icon} size={15} className="mt-px shrink-0" />
          <p>This account has expired. Close this and start the payment again.</p>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-cloud bg-canvas p-4">
          <Row label="Bank" value={invoice.bankTransfer.bankName} />
          <button
            type="button"
            onClick={copyAccountNumber}
            className="flex items-center justify-between gap-3 rounded-xl px-1 py-1 text-left transition-colors duration-300 hover:bg-paper cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            aria-label="Copy account number"
          >
            <span>
              <span className="block text-[11px] text-ink-soft">Account number</span>
              <span className="text-sm font-semibold tracking-wide text-ink">
                {invoice.bankTransfer.accountNumber}
              </span>
            </span>
            <HugeiconsIcon
              icon={copied ? Tick02Icon : Copy01Icon}
              size={16}
              className={copied ? "text-brand" : "text-ink-soft"}
            />
          </button>
          <Row label="Account name" value={invoice.bankTransfer.accountName} />
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-ink-soft">
        Transfer the exact amount above to the account shown, then tap the button below. We&apos;ll
        also confirm automatically once the transfer lands.
      </p>

      <button
        type="button"
        disabled={checking || expired}
        onClick={() => check(true)}
        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:opacity-60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        {checking ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        ) : (
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
        )}
        {checking ? "Checking…" : "I've made payment"}
      </button>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-1">
      <span className="text-[11px] text-ink-soft">{label}</span>
      <span className="text-sm font-medium text-ink">{value}</span>
    </div>
  );
}
