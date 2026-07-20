/** The kind of money movement — drives the row's icon, label and tint. */
export type TxnType = "due" | "topup" | "referral" | "withdrawal" | "refund" | "vote";

export type TxnStatus = "completed" | "pending" | "failed";

export type Transaction = {
  id: string;
  type: TxnType;
  title: string;
  /** Secondary line — usually the space or counterparty. */
  detail: string;
  /** Positive = money credited in, negative = money out. */
  amount: number;
  /** How it moved: "Visa •••• 4242", "Paystack". */
  method: string;
  /** ISO timestamp the transaction posted. */
  date: string;
  status: TxnStatus;
  reference: string;
};

/** The direction filter shown as segmented tabs above the ledger. */
export type TxnFilter = "all" | "in" | "out";
