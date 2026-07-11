import { apiClient, type Page } from "./client";
import type { Due, DueCategory, DueStatus, PayMethod, Transaction } from "./types";

export type DuesQuery = {
  spaceId?: string;
  status?: DueStatus;
  category?: DueCategory;
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

/** All dues for the caller across their spaces. */
export function listDues(query: DuesQuery = {}): Promise<Page<Due[]>> {
  return apiClient.getPage<Due[]>(`/dues${toQuery(query)}`);
}

/** A single due with the viewer's payment state. */
export function getDue(dueId: string) {
  return apiClient.get<Due>(`/dues/${dueId}`);
}

export type PayDuePayload =
  | { method: "wallet" }
  | { method: "card"; cardId: string }
  | { method: "online" };

export type PayDueResult = {
  transaction?: Transaction;
  receiptUrl?: string;
  /** Present for `online` — redirect the payer to Monnify. */
  checkoutUrl?: string;
  reference?: string;
};

/** Settle a due. Money-moving — an Idempotency-Key is attached automatically. */
export function payDue(dueId: string, payload: PayDuePayload) {
  return apiClient.post<PayDueResult>(`/dues/${dueId}/pay`, payload, {
    idempotencyKey: crypto.randomUUID(),
  });
}

export type PaymentStatus = {
  status: "pending" | "completed" | "failed";
  transaction?: Transaction;
};

/** Poll a pending online payment by its provider reference. */
export function getPaymentStatus(reference: string) {
  return apiClient.get<PaymentStatus>(`/payments/${reference}/status`);
}

/** URL for a settled due's PDF receipt (served with `Content-Type: application/pdf`). */
export function dueReceiptPath(dueId: string) {
  return `/dues/${dueId}/receipt`;
}
