import {
  Invoice01Icon,
  MoneyAdd01Icon,
  GiftIcon,
  MoneySend01Icon,
  ArrowReloadHorizontalIcon,
  CheckmarkSquare01Icon,
} from "@hugeicons/core-free-icons";
import type { HugeIcon } from "../../_components/nav-config";
import type { Transaction, TxnStatus, TxnType } from "./types";

export { naira } from "../../_components/format";

/** Icon + human label per transaction type. */
export const TXN_META: Record<TxnType, { icon: HugeIcon; label: string }> = {
  due: { icon: Invoice01Icon, label: "Due payment" },
  topup: { icon: MoneyAdd01Icon, label: "Wallet top up" },
  referral: { icon: GiftIcon, label: "Referral bonus" },
  withdrawal: { icon: MoneySend01Icon, label: "Withdrawal" },
  refund: { icon: ArrowReloadHorizontalIcon, label: "Refund" },
  vote: { icon: CheckmarkSquare01Icon, label: "Poll vote" },
};

export const STATUS_META: Record<
  TxnStatus,
  { label: string; className: string }
> = {
  completed: { label: "Completed", className: "bg-cloud text-brand" },
  pending: { label: "Pending", className: "bg-amber-100 text-amber-700" },
  failed: { label: "Failed", className: "bg-rose-100 text-rose-700" },
};

/** Full timestamp for a transaction, e.g. "18 Jun 2026, 02:30 PM". */
export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Short time-of-day, e.g. "02:30 PM". */
export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * A relative bucket for grouping the ledger: "Today", "Yesterday", "This week"
 * or the month name. Compared date-only, so times of day don't split a day.
 */
export function dayBucket(iso: string): string {
  const day = 86_400_000;
  const startOf = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((startOf(new Date()) - startOf(new Date(iso))) / day);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return "This week";
  return new Date(iso).toLocaleDateString("en-NG", {
    month: "long",
    year: "numeric",
  });
}

/** Group transactions (already sorted newest-first) into labelled buckets. */
export function groupByDay(txns: Transaction[]): [string, Transaction[]][] {
  const groups = new Map<string, Transaction[]>();
  for (const txn of txns) {
    const key = dayBucket(txn.date);
    const list = groups.get(key);
    if (list) list.push(txn);
    else groups.set(key, [txn]);
  }
  return [...groups.entries()];
}
