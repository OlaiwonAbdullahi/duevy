import {
  Invoice01Icon,
  MoneyAdd01Icon,
  GiftIcon,
  MoneySend01Icon,
  ArrowReloadHorizontalIcon,
} from "@hugeicons/core-free-icons";
import type { HugeIcon } from "../../_components/nav-config";
import type { Transaction, TxnStatus, TxnType } from "./types";

export const naira = (n: number) =>
  `₦${Math.abs(n).toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;

/** Icon + human label per transaction type. */
export const TXN_META: Record<TxnType, { icon: HugeIcon; label: string }> = {
  due: { icon: Invoice01Icon, label: "Due payment" },
  topup: { icon: MoneyAdd01Icon, label: "Wallet top up" },
  referral: { icon: GiftIcon, label: "Referral bonus" },
  withdrawal: { icon: MoneySend01Icon, label: "Withdrawal" },
  refund: { icon: ArrowReloadHorizontalIcon, label: "Refund" },
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

/* ---- Mock ledger. Swapped for real queries once the API lands. ---- */
export const TRANSACTIONS: Transaction[] = [
  {
    id: "t1",
    type: "topup",
    title: "Wallet top up",
    detail: "Visa •••• 4242",
    amount: 5000,
    method: "Visa •••• 4242",
    date: "2026-07-03T09:12:00+01:00",
    status: "completed",
    reference: "DUEVY-TP84KQ2",
  },
  {
    id: "t2",
    type: "due",
    title: "First Semester Departmental Levy",
    detail: "Computer Science Students' Association",
    amount: -7500,
    method: "Wallet",
    date: "2026-07-03T09:15:00+01:00",
    status: "completed",
    reference: "DUEVY-8F2A9KQ",
  },
  {
    id: "t3",
    type: "referral",
    title: "Referral bonus",
    detail: "Chidera joined and paid their first due",
    amount: 500,
    method: "Duevy",
    date: "2026-07-02T14:40:00+01:00",
    status: "completed",
    reference: "DUEVY-RF01MZ7",
  },
  {
    id: "t4",
    type: "due",
    title: "Data Structures Handout",
    detail: "Computer Science Students' Association",
    amount: -2000,
    method: "Visa •••• 4242",
    date: "2026-07-02T11:05:00+01:00",
    status: "completed",
    reference: "DUEVY-2H7BC10",
  },
  {
    id: "t5",
    type: "due",
    title: "Tech Week Access Pass",
    detail: "Nigeria Association of Computing Students",
    amount: -5000,
    method: "Monnify",
    date: "2026-07-01T16:22:00+01:00",
    status: "pending",
    reference: "DUEVY-TW5PN33",
  },
  {
    id: "t6",
    type: "topup",
    title: "Wallet top up",
    detail: "Monnify · Bank transfer",
    amount: 7000,
    method: "Monnify",
    date: "2026-06-28T10:02:00+01:00",
    status: "completed",
    reference: "DUEVY-TP7712X",
  },
  {
    id: "t7",
    type: "refund",
    title: "Refund · Science Games Levy",
    detail: "Event postponed by the faculty",
    amount: 1000,
    method: "Wallet",
    date: "2026-06-27T13:47:00+01:00",
    status: "completed",
    reference: "DUEVY-RB9021K",
  },
  {
    id: "t8",
    type: "due",
    title: "Welfare Contribution",
    detail: "Computer Science Students' Association",
    amount: -1500,
    method: "Wallet",
    date: "2026-06-20T08:30:00+01:00",
    status: "completed",
    reference: "DUEVY-WC3340B",
  },
  {
    id: "t9",
    type: "due",
    title: "Annual Dinner ticket",
    detail: "Engineering Students' Society",
    amount: -12000,
    method: "Visa •••• 4242",
    date: "2026-06-14T19:10:00+01:00",
    status: "failed",
    reference: "DUEVY-AD1188F",
  },
  {
    id: "t10",
    type: "withdrawal",
    title: "Withdrawal to bank",
    detail: "GTBank •••• 0912",
    amount: -3000,
    method: "Bank transfer",
    date: "2026-06-12T12:00:00+01:00",
    status: "completed",
    reference: "DUEVY-WD5567H",
  },
];
