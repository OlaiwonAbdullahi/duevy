import { naira, REP_SPACE } from "../../create-dues/_components/data";
import type { BankAccount, PayoutStatus } from "./types";

export { naira, REP_SPACE };

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
