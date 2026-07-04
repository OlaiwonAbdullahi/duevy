import { INITIAL_REP_DUES, naira, REP_SPACE } from "../../create-dues/_components/data";
import type { BankAccount, Payout, PayoutStatus } from "./types";

export { naira, REP_SPACE };

/** Everything collected across published dues — the pool a payout draws from. */
export const TOTAL_COLLECTED = INITIAL_REP_DUES
  .filter((due) => due.status !== "draft")
  .reduce((sum, due) => sum + due.paidCount * due.amount, 0);

/** Where cleared funds are settled. Editable by the rep. */
export const PAYOUT_ACCOUNT: BankAccount = {
  bankName: "Guaranty Trust Bank",
  accountName: "CSSA Departmental Account",
  accountNumber: "0123454021",
};

export const INITIAL_PAYOUTS: Payout[] = [
  {
    id: "po-1",
    amount: 250000,
    requestedAt: "Today, 8:15 AM",
    reference: "PYT-90231",
    status: "processing",
    account: "GTBank •••• 4021",
  },
  {
    id: "po-2",
    amount: 800000,
    requestedAt: "Jun 20, 2026",
    reference: "PYT-88110",
    status: "completed",
    account: "GTBank •••• 4021",
  },
  {
    id: "po-3",
    amount: 500000,
    requestedAt: "Jun 2, 2026",
    reference: "PYT-85002",
    status: "completed",
    account: "GTBank •••• 4021",
  },
  {
    id: "po-4",
    amount: 120000,
    requestedAt: "May 18, 2026",
    reference: "PYT-83771",
    status: "failed",
    account: "GTBank •••• 4021",
  },
];

/** Mask all but the last four digits of an account number. */
export function maskAccount(number: string) {
  const last4 = number.slice(-4);
  return `•••• ${last4}`;
}

/** Short destination label for a payout row, e.g. "GTBank •••• 4021". */
export function accountLabel(account: BankAccount) {
  const short = account.bankName.split(" ")[0];
  return `${short} •••• ${account.accountNumber.slice(-4)}`;
}

export const PAYOUT_STATUS_META: Record<
  PayoutStatus,
  { label: string; className: string }
> = {
  completed: { label: "Completed", className: "bg-cloud text-brand" },
  processing: { label: "Processing", className: "bg-amber-100 text-amber-700" },
  failed: { label: "Failed", className: "bg-rose-100 text-rose-600" },
};

/** Nigerian banks offered when editing the payout account. */
export const BANK_OPTIONS = [
  "Guaranty Trust Bank",
  "Access Bank",
  "Zenith Bank",
  "First Bank of Nigeria",
  "United Bank for Africa",
  "Kuda Microfinance Bank",
  "Opay",
  "Moniepoint",
];
