import type { TxnDirection } from "@/lib/api/transactions";
import type { TxnStatus, TxnType } from "@/lib/api/types";

export type { TxnDirection, TxnStatus, TxnType };

/** A ledger row as the page renders it. Amounts stay in kobo, as the API sends them. */
export type Transaction = {
  id: string;
  type: TxnType;
  title: string;
  /** Secondary line — usually the space or counterparty. */
  detail: string | null;
  /** Signed kobo: positive = money credited in, negative = money out. */
  amount: number;
  /** How it moved, e.g. "Wallet", "Bank transfer". */
  method: string | null;
  /** ISO timestamp the transaction posted. */
  date: string;
  status: TxnStatus;
  reference: string;
};

/** Quick date windows offered beside the custom range. */
export type DatePreset = "7d" | "30d" | "90d" | "month";

/** Everything the URL carries for this page. Custom dates are local yyyy-mm-dd. */
export type TxnFilters = {
  q: string;
  direction: TxnDirection;
  status?: TxnStatus;
  type?: TxnType;
  range?: DatePreset;
  from?: string;
  to?: string;
  page: number;
};
