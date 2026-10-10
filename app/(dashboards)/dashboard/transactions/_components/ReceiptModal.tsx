"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Copy01Icon,
  Download01Icon,
  ReceiptDollarIcon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { Modal } from "../../_components/Modal";
import { STATUS_META, TXN_META, formatDateTime } from "./data";
import { printReceipt, signedAmount } from "./receipt";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { transactionReceiptPath } from "@/lib/api/transactions";
import type { Transaction } from "./types";

export function ReceiptModal({
  txn,
  onClose,
}: {
  txn: Transaction;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // The official receipt is the server's PDF. A transaction without one (e.g.
  // still pending → 404) falls back to a printable summary of this row.
  const downloadReceipt = async () => {
    setDownloading(true);
    try {
      const blob = await apiClient.getBlob(transactionReceiptPath(txn.id));
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Duevy-receipt-${txn.reference}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
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
  const status = STATUS_META[txn.status];

  const copyRef = async () => {
    try {
      await navigator.clipboard.writeText(txn.reference);
      setCopied(true);
      toast.success("Reference copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — copy it manually");
    }
  };

  const meta = TXN_META[txn.type];
  const isIn = txn.amount > 0;

  return (
    <Modal title="Payment receipt" icon={ReceiptDollarIcon} onClose={onClose}>
      {/* Hero — the amount on the doodle artwork. */}
      <section className="doodle-card relative overflow-hidden rounded-3xl p-5 text-white ">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-white/75">
            {isIn ? "Money in" : "Money out"}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm">
            <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[txn.status]}`} />
            {status.label}
          </span>
        </div>
        <p
          className={`mt-3 text-[34px] font-semibold leading-none tracking-tight tabular-nums ${
            txn.status === "failed" ? "line-through decoration-white/50" : ""
          }`}
        >
          {signedAmount(txn)}
        </p>
        <p className="mt-2 truncate text-xs text-white/75">{formatDateTime(txn.date)}</p>
      </section>

      {/* What it was for. */}
      <section className="mt-3 flex items-center gap-3 rounded-2xl border border-cloud bg-canvas p-3.5">
        <span
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
            isIn ? "bg-cloud text-brand" : "bg-paper text-ink-soft"
          }`}
        >
          <HugeiconsIcon icon={meta.icon} size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{txn.title}</p>
          <p className="truncate text-xs text-ink-soft">{txn.detail}</p>
        </div>
      </section>

      {/* Details. */}
      <dl className="mt-3 rounded-2xl bg-paper px-4 py-1">
        <Row label="Type" value={meta.label} />
        <Row label="Payment method" value={txn.method} />
        <Row label="Date" value={formatDateTime(txn.date)} />
        <Row label="Status" value={status.label} />
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
          aria-label="Copy reference"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cloud text-brand transition-colors active:bg-cloud/70 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={16} />
        </button>
      </section>

      <button
        type="button"
        onClick={downloadReceipt}
        disabled={downloading}
        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:opacity-70 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        {downloading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        ) : (
          <HugeiconsIcon icon={Download01Icon} size={16} />
        )}
        {downloading ? "Downloading…" : "Download receipt"}
      </button>
    </Modal>
  );
}

/** Status dot colour on the doodle header. */
const STATUS_DOT: Record<Transaction["status"], string> = {
  completed: "bg-emerald-300",
  pending: "bg-amber-300",
  failed: "bg-rose-300",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-ink-soft/10 py-3 first:border-t-0">
      <dt className="shrink-0 text-xs text-ink-soft">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}
