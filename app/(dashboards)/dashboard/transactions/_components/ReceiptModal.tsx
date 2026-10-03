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

  const rows: [string, string][] = [
    ["Description", txn.title],
    ["Details", txn.detail],
    ["Type", TXN_META[txn.type].label],
    ["Payment method", txn.method],
    ["Date", formatDateTime(txn.date)],
  ];

  return (
    <Modal title="Payment receipt" icon={ReceiptDollarIcon} onClose={onClose}>
      <div className="rounded-2xl border border-cloud bg-paper p-5 text-center">
        <p className="text-2xl font-semibold tracking-tight text-ink">
          {signedAmount(txn)}
        </p>
        <span
          className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <dl className="mt-4 flex flex-col">
        <Row label="Reference" value={txn.reference} mono />
        {rows.map(([label, value]) => (
          <Row key={label} label={label} value={value} />
        ))}
      </dl>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={copyRef}
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-cloud bg-canvas text-sm font-semibold text-ink transition-colors duration-300 hover:bg-paper cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={16} />
          {copied ? "Copied" : "Copy ref"}
        </button>
        <button
          type="button"
          onClick={downloadReceipt}
          disabled={downloading}
          className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <HugeiconsIcon icon={Download01Icon} size={16} />
          {downloading ? "Downloading…" : "Download PDF"}
        </button>
      </div>
    </Modal>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-cloud py-3 first:border-t-0">
      <dt className="shrink-0 text-xs text-ink-soft">{label}</dt>
      <dd
        className={`min-w-0 text-right text-sm font-semibold text-ink ${
          mono ? "tabular-nums" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
