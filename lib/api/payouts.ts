import { apiClient } from "./client";
import type { BankAccount, Payout, PayoutSummary } from "./types";

export type Bank = { code: string; name: string };

/** Live Nigerian bank list (name + CBN code) from the provider. Auth required. */
export function listBanks() {
  return apiClient.get<Bank[]>("/banks");
}

/** Available / pending / lifetime — all net of the 3% processing charge. */
export function getPayoutSummary(spaceId: string) {
  return apiClient.get<PayoutSummary>(`/spaces/${spaceId}/payout/summary`);
}

export function getPayoutAccount(spaceId: string) {
  return apiClient.get<BankAccount>(`/spaces/${spaceId}/payout/account`);
}

export type BankAccountInput = {
  bankCode: string;
  accountNumber: string;
};

export type ResolvedAccount = {
  /** Holder name resolved via Monnify name-enquiry. */
  accountName: string;
};

/**
 * Resolve (but don't save) the account holder's name via name-enquiry so the rep
 * can confirm before committing. Throws `422 ACCOUNT_UNVERIFIABLE` if it fails.
 */
export function lookupPayoutAccount(
  spaceId: string,
  payload: BankAccountInput,
) {
  console.log("lookupPayoutAccount", spaceId, payload);
  return apiClient.post<ResolvedAccount>(
    `/spaces/${spaceId}/payout/account/lookup`,
    payload,
  );
}

/** Replace the destination account (triggers a 24h payout hold + security email). */
export function setPayoutAccount(spaceId: string, payload: BankAccountInput) {
  return apiClient.put<BankAccount>(
    `/spaces/${spaceId}/payout/account`,
    payload,
  );
}

/** Request a withdrawal. Money-moving — an Idempotency-Key is attached automatically. */
export function requestPayout(
  spaceId: string,
  payload: { amount: number; note?: string },
) {
  return apiClient.post<Payout>(`/spaces/${spaceId}/payout/request`, payload, {
    idempotencyKey: crypto.randomUUID(),
  });
}

export function listPayouts(spaceId: string) {
  return apiClient.get<Payout[]>(`/spaces/${spaceId}/payouts`);
}
