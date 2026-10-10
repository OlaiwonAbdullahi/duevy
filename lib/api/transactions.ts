import { apiClient, type Page } from "./client";
import type { Transaction, TxnStatus, TxnType } from "./types";

export type TransactionsQuery = {
  type?: TxnType;
  status?: TxnStatus;
  page?: number;
  perPage?: number;
};

function toQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/** The caller's ledger, newest first. */
export function listTransactions(query: TransactionsQuery = {}): Promise<Page<Transaction[]>> {
  return apiClient.getPage<Transaction[]>(`/transactions${toQuery(query)}`);
}

export function getTransaction(transactionId: string) {
  return apiClient.get<Transaction>(`/transactions/${transactionId}`);
}

/** URL for a transaction's PDF receipt. */
export function transactionReceiptPath(transactionId: string) {
  return `/transactions/${transactionId}/receipt`;
}
