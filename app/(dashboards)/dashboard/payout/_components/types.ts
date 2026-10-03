import type { PayoutStatus } from "@/lib/api/types";

export type { PayoutStatus };

export type Payout = {
  id: string;
  /** Gross, in naira. */
  amount: number;
  /** Withdrawal fee deducted from `amount`, in naira. */
  fee: number;
  /** What reaches the bank, in naira. */
  net: number;
  /** Display string, e.g. "Today, 8:15 AM" or "Jun 20, 2026". */
  requestedAt: string;
  reference: string;
  status: PayoutStatus;
  requestedById: string | null;
  /** Masked destination, e.g. "GTBank •••• 4021". */
  account: string;
  failureReason: string | null;
};

export type BankAccount = {
  bankName: string;
  accountName: string;
  /** Full number — masked in the UI. */
  accountNumber: string;
};
