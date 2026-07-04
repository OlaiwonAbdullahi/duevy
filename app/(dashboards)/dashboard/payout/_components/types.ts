export type PayoutStatus = "completed" | "processing" | "failed";

export type Payout = {
  id: string;
  amount: number;
  /** Display string, e.g. "Today, 8:15 AM" or "Jun 20, 2026". */
  requestedAt: string;
  reference: string;
  status: PayoutStatus;
  /** Masked destination, e.g. "GTBank •••• 4021". */
  account: string;
};

export type BankAccount = {
  bankName: string;
  accountName: string;
  /** Full number — masked in the UI. */
  accountNumber: string;
};
