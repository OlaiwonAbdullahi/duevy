import { apiClient } from "./client";
import type { Card, SaveCardResult } from "./types";

// The wallet balance/top-up system was removed (payment architecture
// migration — float custody risk). Every payment now goes through a saved
// card or the in-app bank-transfer invoice flow (see lib/api/dues.ts,
// lib/api/polls.ts). This module only keeps saved-card management and the
// active-gateway label, both of which still live at their historical
// `/wallet/...` paths on the backend.

export function listCards() {
  return apiClient.get<Card[]>("/wallet/cards");
}

export type SaveCardPayload = {
  /** Defaults `false`. Ignored for the very first card ever saved — always forced default. */
  isDefault?: boolean;
};

/**
 * Start the "add card" flow. Raw PANs never touch this API — redirect the user to
 * `checkoutUrl`, where the active gateway runs a ₦50 verification charge and tokenizes the
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

/** Display label ("Paystack"/"Monnify") of the platform's active payment gateway. */
export function getActivePaymentGateway() {
  return apiClient.get<{ active: string }>("/wallet/payment-gateway");
}
