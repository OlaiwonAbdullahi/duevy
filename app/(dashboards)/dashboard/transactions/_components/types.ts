/** The kind of money movement — drives the row's icon, label and tint. */
export type TxnType = "due" | "topup" | "referral" | "withdrawal" | "refund";

export type TxnStatus = "completed" | "pending" | "failed";

export type Transaction = {
  id: string;
  type: TxnType;
  title: string;
  /** Secondary line — usually the space or counterparty. */
  detail: string;
  /** Positive = money into the wallet, negative = money out. */
  amount: number;
  /** How it moved: "Wallet", "Visa •••• 4242", "Monnify". */
  method: string;
  /** ISO timestamp the transaction posted. */
  date: string;
  status: TxnStatus;
  reference: string;
};

/** The direction filter shown as segmented tabs above the ledger. */
export type TxnFilter = "all" | "in" | "out";
