import { apiClient, type Page } from "./client";
import type { Due, DueStatus, DueType, Transaction } from "./types";

export type DuesQuery = {
  spaceId?: string;
  status?: DueStatus;
  type?: DueType;
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

export type CheckoutStatus = "pending" | "paid" | "expired" | "underpaid";

/** The one-time account the student transfers into. `null` once the checkout is no longer open. */
export type CheckoutBankTransfer = {
  accountNumber: string;
  bankName: string;
  accountName: string;
  /** Exact amount to send (kobo) — equals the checkout total. */
  amountKobo: number;
  expiresAt: string;
};

export type CheckoutItem = {
  dueId: string;
  title: string;
  /** Face amount (kobo). */
  amount: number;
  /** This line's share of the basket fee (kobo). */
  fee: number;
};

/**
 * One bank-transfer checkout covering every due in the basket. All amounts in
 * kobo. `face` goes to the space in full; `fee` (2% of face + ₦20, charged once
 * per basket) is paid by the student on top; `total` is what they transfer.
 */
export type Checkout = {
  reference: string;
  status: CheckoutStatus;
  spaceId?: string;
  amount: number;
  breakdown: { face: number; fee: number; total: number };
  items: CheckoutItem[];
  bankTransfer: CheckoutBankTransfer | null;
  /** Always `null` — bank transfer is the only method. Kept for older clients. */
  checkoutUrl: null;
  expiresAt: string;
  paidAt: string | null;
  receivedKobo: number | null;
  overpaidKobo: number;
  createdAt?: string;
  /** `true` when an open checkout for the same basket was returned instead of a new one. */
  reused?: boolean;
};

/**
 * Open one bank-transfer checkout for a basket of dues (all from one space).
 * Money-moving — an Idempotency-Key is attached automatically.
 *
 * Errors: `422 MIXED_SPACES`, `403 NOT_A_MEMBER`, `409 DUE_ALREADY_PAID`,
 * `409 SPACE_NOT_VERIFIED`, `409 CHECKOUT_OVERLAP`, `409 CHECKOUT_OPENING`.
 */
export function payDues(dueIds: string[]) {
  return apiClient.post<Checkout>(
    "/dues/pay",
    { dueIds },
    { idempotencyKey: crypto.randomUUID() },
  );
}

/** Open a checkout for a single due — a basket of one. */
export function payDue(dueId: string) {
  return apiClient.post<Checkout>(
    `/dues/${dueId}/pay`,
    {},
    { idempotencyKey: crypto.randomUUID() },
  );
}

export type PaymentStatus = Checkout & {
  /** Set once paid — download via `receiptPdfPath`. */
  receiptNumber?: string | null;
  /** The student's history row, present once paid. */
  transaction?: Transaction;
};

/**
 * Read a checkout by its reference. Polling only reads — the status is moved
 * by the provider's webhook (and its reconciliation job), never by this call.
 * Legacy (pre-checkout) references come back with only `reference`/`status`.
 */
export function getPaymentStatus(reference: string) {
  return apiClient.get<PaymentStatus>(`/payments/${reference}/status`);
}

/** URL for a checkout receipt's PDF (`GET /receipts/:number?format=pdf`). */
export function receiptPdfPath(receiptNumber: string) {
  return `/receipts/${encodeURIComponent(receiptNumber)}?format=pdf`;
}

/** URL for a settled due's PDF receipt (served with `Content-Type: application/pdf`). */
export function dueReceiptPath(dueId: string) {
  return `/dues/${dueId}/receipt`;
}
