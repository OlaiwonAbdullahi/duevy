import {
  Invoice01Icon,
  MoneyAdd01Icon,
  GiftIcon,
  MoneySend01Icon,
  ArrowReloadHorizontalIcon,
  CheckmarkSquare01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  CancelCircleIcon,
} from "@hugeicons/core-free-icons";
import type { Transaction as ApiTransaction } from "@/lib/api/types";
import type { HugeIcon } from "../../_components/nav-config";
import type { Transaction, TxnStatus, TxnType } from "./types";

/** Icon + human label per transaction type. */
export const TXN_META: Record<TxnType, { icon: HugeIcon; label: string }> = {
  due: { icon: Invoice01Icon, label: "Due payment" },
  topup: { icon: MoneyAdd01Icon, label: "Top up" },
  referral: { icon: GiftIcon, label: "Referral bonus" },
  withdrawal: { icon: MoneySend01Icon, label: "Withdrawal" },
  refund: { icon: ArrowReloadHorizontalIcon, label: "Refund" },
  vote: { icon: CheckmarkSquare01Icon, label: "Poll vote" },
};

export const TXN_TYPES = Object.keys(TXN_META) as TxnType[];

/**
 * One look per status everywhere on the page. Pending is amber with a clock,
 * failed is rose with a cross — never the brand green that means "settled".
 */
export const STATUS_META: Record<
  TxnStatus,
  { label: string; icon: HugeIcon; className: string; dot: string }
> = {
  completed: {
    label: "Completed",
    icon: CheckmarkCircle02Icon,
    className: "bg-cloud text-brand",
    dot: "bg-emerald-300",
  },
  pending: {
    label: "Pending",
    icon: Clock01Icon,
    className: "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300",
    dot: "bg-amber-300",
  },
  failed: {
    label: "Failed",
    icon: CancelCircleIcon,
    className: "bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300",
    dot: "bg-rose-300",
  },
};

export const TXN_STATUSES = Object.keys(STATUS_META) as TxnStatus[];

/** Map an API transaction to the row shape; unknown types fall back to "due". */
export function adaptTransaction(t: ApiTransaction): Transaction {
  const type: TxnType = t.type in TXN_META ? t.type : "due";
  return {
    id: t.id,
    type,
    title: t.title?.trim() || TXN_META[type].label,
    detail: t.detail?.trim() || null,
    amount: t.amount,
    method: t.method?.trim() || null,
    date: t.createdAt,
    status: t.status,
    reference: t.reference,
  };
}

/** Kobo as naira, kobo shown only when there are any, e.g. 250000 → "₦2,500", 250050 → "₦2,500.50". */
export function formatKobo(kobo: number) {
  const n = Math.abs(kobo) / 100;
  const fraction = Number.isInteger(n) ? 0 : 2;
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: fraction, maximumFractionDigits: 2 })}`;
}

/** Exact naira with kobo, e.g. 512000 → "₦5,120.00", as on the PDF receipt. */
export function exactNaira(kobo: number) {
  return `₦${(Math.abs(kobo) / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Signed amount for a row, e.g. "+₦2,500" / "−₦7,500". */
export function signedKobo(kobo: number) {
  return `${kobo < 0 ? "−" : "+"}${formatKobo(kobo)}`;
}

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

/** Calendar date, e.g. "18 Jun 2026". */
export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Short time-of-day, e.g. "02:30 PM". */
export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/**
 * "just now", "12 minutes ago", "3 hours ago", "yesterday", "4 days ago" —
 * then the plain date once it's over a week old. Days are counted by
 * calendar date, so last night at 11pm reads "yesterday", not "2 hours ago".
 */
export function formatRelative(iso: string, now = new Date()) {
  const then = new Date(iso);
  const seconds = (then.getTime() - now.getTime()) / 1000;
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(then) - startOf(now)) / 86_400_000);

  if (days === 0) {
    if (Math.abs(seconds) < 60) return "just now";
    if (Math.abs(seconds) < 3600) return rtf.format(Math.round(seconds / 60), "minute");
    return rtf.format(Math.round(seconds / 3600), "hour");
  }
  if (Math.abs(days) < 7) return rtf.format(days, "day");
  return formatDate(then);
}
