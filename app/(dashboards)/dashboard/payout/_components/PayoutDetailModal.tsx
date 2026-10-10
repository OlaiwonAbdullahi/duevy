"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Copy01Icon,
  Download04Icon,
  MoneySend01Icon,
  ArrowReloadHorizontalIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { Modal } from "../../_components/Modal";
import { useRepSpace } from "../../_components/use-rep-space";
import { formatDateTime } from "../../transactions/_components/data";
import type { HugeIcon } from "../../_components/nav-config";
import { BankLogo } from "./BankLogo";
import { naira, PAYOUT_STATUS_META } from "./data";
import { printPayoutReceipt } from "./payout-receipt";
import type { Payout, PayoutStatus } from "./types";

/** Status dot colour on the doodle header. */
const STATUS_DOT: Record<PayoutStatus, string> = {
  pending: "bg-amber-300",
  processing: "bg-amber-300",
  success: "bg-emerald-300",
  failed: "bg-rose-300",
  reversed: "bg-white/70",
};

type Step = { label: string; at: string; icon: HugeIcon; tone: "brand" | "amber" | "danger" };

/** One withdrawal in full: amounts, destination, reference and its status trail. */
export function PayoutDetailModal({
  payout,
  onClose,
}: {
  payout: Payout;
  onClose: () => void;
}) {
  const repSpace = useRepSpace();
  const [copied, setCopied] = useState(false);
  const meta = PAYOUT_STATUS_META[payout.status];
  const failed = payout.status === "failed" || payout.status === "reversed";
  const t = payout.timeline;

  // `account` arrives masked as "<Bank name> •••• 1234".
  const [bankName, masked] = (() => {
    const i = payout.account.indexOf(" •");
    return i === -1 ? [payout.account, ""] : [payout.account.slice(0, i), payout.account.slice(i + 1)];
  })();

  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(payout.reference);
      setCopied(true);
      toast.success("Reference copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — copy it manually");
    }
  };

  // Only the steps that actually happened, in order.
  const steps: Step[] = [
    { label: "Requested", at: t.requestedAt, icon: MoneySend01Icon, tone: "brand" },
    ...(t.processingAt
      ? [{ label: "Processing", at: t.processingAt, icon: Clock01Icon, tone: "amber" } as Step]
      : []),
    ...(t.settledAt
      ? [{ label: "Paid out", at: t.settledAt, icon: CheckmarkCircle02Icon, tone: "brand" } as Step]
      : []),
    ...(t.failedAt ? [{ label: "Failed", at: t.failedAt, icon: Alert01Icon, tone: "danger" } as Step] : []),
    ...(t.reversedAt
      ? [{ label: "Reversed · balance restored", at: t.reversedAt, icon: ArrowReloadHorizontalIcon, tone: "danger" } as Step]
      : []),
  ];

  const toneClass = {
    brand: "bg-cloud text-brand",
    amber: "bg-amber-100 text-amber-700",
    danger: "bg-rose-100 text-rose-600",
  } as const;

  return (
    <Modal title="Withdrawal details" icon={MoneySend01Icon} onClose={onClose}>
      {/* Hero — the amount on the doodle artwork. */}
      <section className="doodle-card relative overflow-hidden rounded-3xl p-5 text-white ">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-white/75">Withdrawal</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm">
            <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[payout.status]}`} />
            {meta.label}
          </span>
        </div>
        <p className="mt-3 text-[34px] font-semibold leading-none tracking-tight tabular-nums">
          {naira(payout.amount)}
        </p>
        <p className="mt-2 truncate text-xs text-white/75">
          {formatDateTime(t.requestedAt)}
        </p>
      </section>

      {failed && payout.failureReason && (
        <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          <HugeiconsIcon icon={Alert01Icon} size={15} className="mt-px shrink-0" />
          <span>{payout.failureReason}</span>
        </div>
      )}

      {/* Recipient. */}
      <section className="mt-3 flex items-center gap-3 rounded-2xl border border-cloud bg-canvas p-3.5">
        <BankLogo name={bankName} className="h-11 w-11 shrink-0 text-[11px]" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-ink-soft">Sent to</p>
          <p className="truncate text-sm font-semibold text-ink">{payout.accountName ?? bankName}</p>
          <p className="truncate text-xs text-ink-soft">
            {bankName}
            {masked ? ` · ${masked}` : ""}
          </p>
        </div>
      </section>

      {/* Breakdown, receipt-style. */}
      <section className="mt-3 rounded-2xl bg-paper p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-soft">Amount</span>
          <span className="font-semibold text-ink tabular-nums">{naira(payout.amount)}</span>
        </div>
        <div className="mt-2.5 flex items-center justify-between text-sm">
          <span className="text-ink-soft">Withdrawal fee</span>
          <span className="font-semibold text-ink tabular-nums">
            {payout.fee > 0 ? `−${naira(payout.fee)}` : "Free"}
          </span>
        </div>
        <div className="my-3.5 border-t border-dashed border-ink-soft/25" />
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-ink">Received by bank</span>
          <span className="text-lg font-bold tracking-tight text-brand tabular-nums">
            {naira(payout.net)}
          </span>
        </div>
      </section>

      {/* Reference + note. */}
      <section className="mt-3 rounded-2xl border border-cloud bg-canvas">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-ink-soft">Reference</p>
            <p className="truncate font-mono text-[13px] font-semibold text-ink">{payout.reference}</p>
          </div>
          <button
            type="button"
            onClick={copyRef}
            aria-label="Copy reference"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cloud text-brand transition-colors active:bg-cloud/70 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={16} />
          </button>
        </div>
        {payout.note && (
          <div className="border-t border-cloud px-4 py-3">
            <p className="text-[11px] font-medium text-ink-soft">Note</p>
            <p className="text-sm text-ink">{payout.note}</p>
          </div>
        )}
      </section>

      {/* Status trail. */}
      <section className="mt-3 rounded-2xl border border-cloud bg-canvas p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Timeline</p>
        <ol className="mt-3 flex flex-col">
          {steps.map((step, i) => (
            <li key={step.label} className="relative flex gap-3 pb-4 last:pb-0">
              {i < steps.length - 1 && (
                <span aria-hidden className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px bg-cloud" />
              )}
              <span className={`relative grid h-8 w-8 shrink-0 place-items-center rounded-full ${toneClass[step.tone]}`}>
                <HugeiconsIcon icon={step.icon} size={15} />
              </span>
              <div className="min-w-0 pt-0.5">
                <p className={`text-sm font-semibold ${step.tone === "danger" ? "text-rose-600" : "text-ink"}`}>
                  {step.label}
                </p>
                <p className="text-xs text-ink-soft">{formatDateTime(step.at)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <button
        type="button"
        onClick={() => printPayoutReceipt(payout, repSpace?.name ?? "Your department")}
        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <HugeiconsIcon icon={Download04Icon} size={16} />
        Download receipt
      </button>
    </Modal>
  );
}
