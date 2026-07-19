import { apiClient, type Page } from "./client";
import type { BankAccount, DueCategory, Payout, PayoutSummary } from "./types";

function toQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

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

export type PayoutBreakdownTotals = {
  /** Kobo. */
  collected: number;
  fees: number;
  net: number;
  paidCount: number;
};

export type PayoutBreakdownDue = {
  dueId: string;
  title: string;
  category: DueCategory;
  paidCount: number;
  collected: number;
  fees: number;
  net: number;
};

export type PayoutBreakdown = {
  totals: PayoutBreakdownTotals;
  /** Sorted by `net`, descending. */
  byDue: PayoutBreakdownDue[];
};

/**
 * Where the payout total comes from, per due — same DuePayment source of truth
 * as `/payout/summary`. Any rep can view it; only the lead can request a payout.
 */
export function getPayoutBreakdown(
  spaceId: string,
  query: { from?: string; to?: string; page?: number; perPage?: number } = {},
): Promise<Page<PayoutBreakdown>> {
  return apiClient.getPage<PayoutBreakdown>(
    `/spaces/${spaceId}/payout/breakdown${toQuery(query)}`,
  );
}
