"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  Copy01Icon,
  Download01Icon,
  InformationCircleIcon,
  ReceiptDollarIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { Modal } from "../../_components/Modal";
import { STATUS_META, TXN_META, adaptTransaction, exactNaira, formatDateTime, signedKobo } from "./data";
import { printReceipt } from "./receipt";
import { StatusBadge } from "./StatusBadge";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { getTransaction, transactionReceiptPath } from "@/lib/api/transactions";
import { receiptPdfPath, type CheckoutStatus, type PaymentStatus } from "@/lib/api/dues";
import { queryKeys, usePaymentStatus } from "@/lib/api/queries";
import { cn } from "@/lib/utils";
import type { Transaction } from "./types";

const CHECKOUT_STATUS: Record<CheckoutStatus, { label: string; className: string }> = {
  paid: { label: "Paid", className: STATUS_META.completed.className },
  pending: { label: "Awaiting transfer", className: STATUS_META.pending.className },
  underpaid: { label: "Underpaid", className: STATUS_META.pending.className },
  expired: { label: "Expired", className: STATUS_META.failed.className },
};

/**
 * A transaction's full details. Opens instantly from the row, then refreshes
 * from `GET /transactions/:id`. A due payment also shows its checkout (what
 * was received, the fee breakdown, the receipt number), polled while the
 * transfer is still pending. Only a completed transaction offers a receipt.
 */
export function ReceiptModal({ txn: initial, onClose }: { txn: Transaction; onClose: () => void }) {
  const detail = useQuery({
    queryKey: [...queryKeys.transactionsRoot, "detail", initial.id] as const,
    queryFn: () => getTransaction(initial.id).then(adaptTransaction),
    placeholderData: initial,
  });
  const txn = detail.data ?? initial;

  const hasCheckout = txn.type === "due" && !!txn.reference;
  const payment = usePaymentStatus(hasCheckout ? txn.reference : undefined);
  // No checkout behind this reference (older payments): just leave the section out.
  const checkoutMissing = payment.error instanceof ApiError && payment.error.status === 404;
  const receiptNumber = payment.data?.receiptNumber ?? null;

  // The checkout settled while this was open: refresh the row and the list
  // from the server rather than assuming the transaction completed.
  const queryClient = useQueryClient();
  const checkoutPaid = payment.data?.status === "paid";
  useEffect(() => {
    if (checkoutPaid && txn.status !== "completed") {
      void queryClient.invalidateQueries({ queryKey: queryKeys.transactionsRoot });
    }
  }, [checkoutPaid, txn.status, queryClient]);

  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(txn.reference);
      setCopied(true);
      toast.success("Reference copied");
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — copy it manually");
    }
  };

  const completed = txn.status === "completed";

  // The official receipt is the server's PDF: the checkout receipt when there
  // is one, else the transaction's. A completed row with no PDF (404) falls
  // back to a printable summary of the row.
  const downloadReceipt = async () => {
    if (!completed) return;
    setDownloading(true);
    try {
      const path = receiptNumber ? receiptPdfPath(receiptNumber) : transactionReceiptPath(txn.id);
      const blob = await apiClient.getBlob(path);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Duevy-receipt-${receiptNumber ?? txn.reference}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        printReceipt(txn);
      } else {
        toast.error("Couldn't download the receipt. Please try again.");
      }
    } finally {
      setDownloading(false);
    }
  };

  const meta = TXN_META[txn.type];
  const isIn = txn.amount > 0;

  return (
    <Modal title="Transaction details" icon={ReceiptDollarIcon} onClose={onClose}>
      {/* Hero — the amount on the doodle artwork. */}
      <section className="doodle-card relative overflow-hidden rounded-3xl p-5 text-white">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-white/75">{isIn ? "Money in" : "Money out"}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm">
            <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${STATUS_META[txn.status].dot}`} />
            {STATUS_META[txn.status].label}
          </span>
        </div>
        <p
          className={cn(
            "mt-3 text-[34px] leading-none font-semibold tracking-tight tabular-nums",
            txn.status === "failed" && "line-through decoration-white/50",
            txn.status === "pending" && "text-white/80",
          )}
        >
          {txn.amount < 0 ? "−" : "+"}
          {exactNaira(txn.amount)}
        </p>
        <p className="mt-2 truncate text-xs text-white/75">{formatDateTime(txn.date)}</p>
      </section>

      {txn.status !== "completed" && (
        <p
          className={cn(
            "mt-3 flex items-start gap-2 rounded-2xl px-3.5 py-3 text-xs leading-5",
            STATUS_META[txn.status].className,
          )}
        >
          <HugeiconsIcon icon={txn.status === "failed" ? Alert02Icon : InformationCircleIcon} size={16} className="mt-0.5 shrink-0" aria-hidden />
          {txn.status === "pending"
            ? "This payment hasn't completed yet. It updates on its own once it settles — no receipt until then."
            : "This payment failed, so no money moved and there's no receipt for it."}
        </p>
      )}

      {/* What it was for. */}
      <section className="mt-3 flex items-center gap-3 rounded-2xl border border-cloud bg-canvas p-3.5">
        <span
          aria-hidden
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-2xl",
            isIn ? "bg-cloud text-brand" : "bg-paper text-ink-soft",
          )}
        >
          <HugeiconsIcon icon={meta.icon} size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{txn.title}</p>
          <p className="truncate text-xs text-ink-soft">{txn.detail ?? meta.label}</p>
        </div>
      </section>

      {hasCheckout && !checkoutMissing && (
        <CheckoutSection payment={payment.data} loading={payment.isPending} failed={payment.isError} onRetry={() => void payment.refetch()} />
      )}

      {/* Every field the API returns for the row. */}
      <dl className="mt-3 rounded-2xl bg-paper px-4 py-1">
        {receiptNumber && <Row label="Receipt no." value={receiptNumber} mono />}
        <Row label="Type" value={meta.label} />
        <Row label="Amount" value={signedKobo(txn.amount)} />
        <Row label="Payment method" value={txn.method ?? "—"} />
        <Row label="Date" value={formatDateTime(txn.date)} />
        <Row label="Status" value={<StatusBadge status={txn.status} />} />
        <Row label="Transaction ID" value={txn.id} mono />
      </dl>

      {/* Reference. */}
      <section className="mt-3 flex items-center gap-3 rounded-2xl border border-cloud bg-canvas px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium text-ink-soft">Reference</p>
          <p className="truncate font-mono text-[13px] font-semibold text-ink">{txn.reference}</p>
        </div>
        <button
          type="button"
          onClick={copyRef}
          aria-label={copied ? "Reference copied" : "Copy reference"}
          className="grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-full bg-cloud text-brand transition-colors focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none active:bg-cloud/70"
        >
          <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={16} />
        </button>
      </section>

      {detail.isError && (
        <p className="mt-3 text-xs text-ink-soft" role="status">
          Showing the saved copy — couldn&apos;t refresh this transaction.{" "}
          <button type="button" onClick={() => void detail.refetch()} className="cursor-pointer font-semibold text-brand underline-offset-2 hover:underline">
            Retry
          </button>
        </p>
      )}

      {completed && (
        <button
          type="button"
          onClick={downloadReceipt}
          disabled={downloading}
          className="mt-5 inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none disabled:opacity-70"
        >
          {downloading ? (
            <span aria-hidden className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <HugeiconsIcon icon={Download01Icon} size={16} aria-hidden />
          )}
          {downloading ? "Downloading…" : "Download receipt"}
        </button>
      )}
    </Modal>
  );
}

/** The checkout behind a due payment: status, dues covered, face/fee/total, what arrived. */
function CheckoutSection({
  payment,
  loading,
  failed,
  onRetry,
}: {
  payment: PaymentStatus | undefined;
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
}) {
  if (loading) return <div className="mt-3 h-32 animate-pulse rounded-2xl bg-paper" aria-label="Loading payment details" />;
  if (!payment) {
    return failed ? (
      <p className="mt-3 rounded-2xl border border-cloud bg-canvas px-4 py-3 text-xs text-ink-soft">
        Couldn&apos;t load this payment&apos;s checkout.{" "}
        <button type="button" onClick={onRetry} className="cursor-pointer font-semibold text-brand underline-offset-2 hover:underline">
          Retry
        </button>
      </p>
    ) : null;
  }

  const status = CHECKOUT_STATUS[payment.status] ?? CHECKOUT_STATUS.pending;
  const items = payment.items ?? [];
  const breakdown = payment.breakdown;
  const received = payment.receivedKobo;

  return (
    <section className="mt-3 overflow-hidden rounded-2xl border border-cloud bg-canvas" aria-label="Checkout">
      <div className="flex items-center justify-between gap-3 bg-paper px-4 py-2.5">
        <span className="text-[10px] font-semibold tracking-wider text-ink-soft uppercase">Checkout</span>
        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", status.className)}>{status.label}</span>
      </div>

      {items.length > 0 && (
        <>
          <div className="flex items-center justify-between px-4 pt-2.5 text-[10px] font-semibold tracking-wider text-ink-soft uppercase">
            <span>{items.length > 1 ? `Dues (${items.length})` : "Due"}</span>
            <span>Amount</span>
          </div>
          <ul className="divide-y divide-cloud px-4">
            {items.map((item) => (
              <li key={item.dueId} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0 text-ink">{item.title}</span>
                <span className="shrink-0 font-semibold text-ink tabular-nums">{exactNaira(item.amount)}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {breakdown && (
        <>
          <div className="border-t border-cloud px-4 py-2.5 text-xs">
            <Line label={items.length > 1 ? "Dues total" : "Due amount"} value={exactNaira(breakdown.face)} />
            <Line label="Service fee" value={exactNaira(breakdown.fee)} className="mt-1.5" />
          </div>
          <div className="mx-2 mb-2 flex items-center justify-between rounded-xl bg-cloud/60 px-3 py-2.5">
            <span className="text-sm font-semibold text-ink">{payment.status === "paid" ? "Total paid" : "Total due"}</span>
            <span className="text-base font-semibold text-brand tabular-nums">{exactNaira(breakdown.total)}</span>
          </div>
        </>
      )}

      {(received != null || payment.paidAt || (payment.status === "pending" && payment.expiresAt)) && (
        <div className="border-t border-cloud px-4 py-2.5 text-xs">
          {received != null && <Line label="Received" value={exactNaira(received)} />}
          {payment.overpaidKobo > 0 && <Line label="Overpaid" value={exactNaira(payment.overpaidKobo)} className="mt-1.5" />}
          {payment.paidAt && <Line label="Paid at" value={formatDateTime(payment.paidAt)} className="mt-1.5 first:mt-0" />}
          {payment.status === "pending" && payment.expiresAt && (
            <Line label="Transfer window closes" value={formatDateTime(payment.expiresAt)} className="mt-1.5 first:mt-0" />
          )}
        </div>
      )}
    </section>
  );
}

function Line({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("flex justify-between gap-3 text-ink-soft", className)}>
      <span>{label}</span>
      <span className="font-medium text-ink tabular-nums">{value}</span>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-ink-soft/10 py-3 first:border-t-0">
      <dt className="shrink-0 text-xs text-ink-soft">{label}</dt>
      <dd className={cn("min-w-0 text-right text-sm font-semibold break-all text-ink", mono && "font-mono text-[13px]")}>{value}</dd>
    </div>
  );
}
