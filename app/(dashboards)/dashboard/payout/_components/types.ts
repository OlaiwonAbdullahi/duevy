export type PayoutStatus = "pending_approval" | "processing" | "completed" | "failed" | "cancelled";

export type Payout = {
  id: string;
  /** Set when this payout is scoped to a single due rather than the whole space. */
  dueId: string | null;
  amount: number;
  /** Display string, e.g. "Today, 8:15 AM" or "Jun 20, 2026". */
  requestedAt: string;
  reference: string;
  status: PayoutStatus;
  requestedById: string | null;
  /** Masked destination, e.g. "GTBank •••• 4021". */
  account: string;
};

export type BankAccount = {
  bankName: string;
  accountName: string;
  /** Full number — masked in the UI. */
  accountNumber: string;
};
