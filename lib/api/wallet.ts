import { apiClient } from "./client";
import type { Card, SaveCardResult, Transaction, Wallet } from "./types";

/** Current wallet balance + pending (top-ups awaiting webhook confirmation). */
export function getWallet() {
  return apiClient.get<Wallet>("/wallet");
}

export type TopUpPayload =
  | { amount: number; method: "card"; cardId: string }
  | { amount: number; method: "online" };

export type TopUpResult = {
  transaction?: Transaction;
  checkoutUrl?: string;
  reference?: string;
};

/** Add funds. Money-moving — an Idempotency-Key is attached automatically. */
export function topUp(payload: TopUpPayload) {
  return apiClient.post<TopUpResult>("/wallet/top-up", payload, {
    idempotencyKey: crypto.randomUUID(),
  });
}

export type WalletActivity = {
  id: string;
  label: string;
  detail: string;
  /** Signed kobo: positive = in, negative = out. */
  amount: number;
  createdAt: string;
};

/** The 10 most recent wallet-touching transactions — lighter than the ledger. */
export function getWalletActivity() {
  return apiClient.get<WalletActivity[]>("/wallet/activity");
}

export function listCards() {
  return apiClient.get<Card[]>("/wallet/cards");
}

export type SaveCardPayload = {
  /** Defaults `false`. Ignored for the very first card ever saved — always forced default. */
  isDefault?: boolean;
};

/**
 * Start the "add card" flow. Raw PANs never touch this API — redirect the user to
 * `checkoutUrl`, where Monnify runs a ₦50 verification charge and tokenizes the
 * card. Poll `GET /payments/{reference}/status` on return, then re-fetch
 * `listCards()` once it's `completed`.
 */
export function saveCard(payload: SaveCardPayload = {}) {
  return apiClient.post<SaveCardResult>("/wallet/cards", payload, {
    idempotencyKey: crypto.randomUUID(),
  });
}

/** Promote a card to default. */
export function setDefaultCard(cardId: string) {
  return apiClient.patch<Card>(`/wallet/cards/${cardId}`, { isDefault: true });
}

export function deleteCard(cardId: string) {
  return apiClient.delete<void>(`/wallet/cards/${cardId}`);
}
