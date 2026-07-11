import { apiClient } from "./client";
import type { Card, Transaction, Wallet } from "./types";

/** Current wallet balance + pending (top-ups awaiting webhook confirmation). */
export function getWallet() {
  return apiClient.get<Wallet>("/wallet");
}

export type TopUpPayload =
  | { amount: number; method: "card"; cardId: string }
  | { amount: number; method: "online" };

export type TopUpResult = {
  transaction?: Transaction;
  /** Present for `online` — redirect to Monnify hosted checkout. */
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
  /** Tokenized card reference from the PSP inline SDK — raw PANs never touch the API. */
  providerToken: string;
  isDefault?: boolean;
};

export function saveCard(payload: SaveCardPayload) {
  return apiClient.post<Card>("/wallet/cards", payload);
}

/** Promote a card to default. */
export function setDefaultCard(cardId: string) {
  return apiClient.patch<Card>(`/wallet/cards/${cardId}`, { isDefault: true });
}

export function deleteCard(cardId: string) {
  return apiClient.delete<void>(`/wallet/cards/${cardId}`);
}
