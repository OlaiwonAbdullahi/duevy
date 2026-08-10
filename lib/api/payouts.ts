import { apiClient, type Page } from "./client";
import type {
  BankAccount,
  DueCategory,
  IdentityMethods,
  OnboardingChecklist,
  OnboardingStatus,
  Payout,
  PayoutApprovalDecision,
  PayoutSummary,
  PayoutWithApproval,
} from "./types";

function toQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export type Bank = { code: string; name: string };

/**
 * Live Nigerian bank list (name + CBN code), scoped to the space's own Bachs
 * connected account — creating one on first use if it doesn't exist yet.
 */
export function listBanks(spaceId: string) {
  return apiClient.get<Bank[]>(`/banks?spaceId=${encodeURIComponent(spaceId)}`);
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
  /** Holder name resolved via Bachs name-enquiry. */
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

/**
 * Request a whole-space withdrawal. Lead-only — co-reps use `requestDuePayout`
 * against a due assigned to them instead. Every payout now requires 70% of the
 * space's reps to approve before it disburses; the requester's own request
 * counts as an implicit "yes" vote. Money-moving — an Idempotency-Key is
 * attached automatically.
 */
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

/** A single payout with its live approval progress (who's voted so far). */
export function getPayout(spaceId: string, payoutId: string) {
  return apiClient.get<PayoutWithApproval>(`/spaces/${spaceId}/payout/${payoutId}`);
}

/** Balance available against a single due (for the due-scoped request flow). */
export function getDuePayoutSummary(spaceId: string, dueId: string) {
  return apiClient.get<PayoutSummary>(`/spaces/${spaceId}/dues/${dueId}/payout/summary`);
}

/**
 * Request a payout scoped to one due's collected funds. Allowed for the lead,
 * or the co-rep this due is assigned to.
 */
export function requestDuePayout(
  spaceId: string,
  dueId: string,
  payload: { amount: number; note?: string },
) {
  return apiClient.post<Payout>(`/spaces/${spaceId}/dues/${dueId}/payout/request`, payload, {
    idempotencyKey: crypto.randomUUID(),
  });
}

/** Cast or change your approve/reject vote on a payout awaiting approval. */
export function castPayoutApproval(
  spaceId: string,
  payoutId: string,
  decision: PayoutApprovalDecision,
) {
  return apiClient.post<{ payout: Payout; approval: PayoutWithApproval["approval"] }>(
    `/spaces/${spaceId}/payout/${payoutId}/approve`,
    { decision },
  );
}

/** Withdraw a payout still awaiting approval. Requester or lead only. */
export function cancelPayout(spaceId: string, payoutId: string, reason?: string) {
  return apiClient.post<Payout>(`/spaces/${spaceId}/payout/${payoutId}/cancel`, { reason });
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

// ---------------------------------------------------------------------------
// Bachs connected-account onboarding — in-app, no redirect to a hosted page.
// ---------------------------------------------------------------------------

/** Status badge off the space's connected-account row — cheap, no full checklist fetch. */
export function getOnboardingStatus(spaceId: string) {
  return apiClient.get<OnboardingStatus>(`/spaces/${spaceId}/payout/onboarding-status`);
}

/** The Tasks/checklist to render as a form. Field shapes here aren't fully confirmed yet — kept loosely typed. */
export function getOnboardingChecklist(spaceId: string) {
  return apiClient.get<OnboardingChecklist>(`/spaces/${spaceId}/payout/onboarding/checklist`);
}

/** Upload an onboarding document (ID, proof of address, ...). Returns an `uploadId` to reference in `submitOnboarding`. */
export function uploadOnboardingDocument(spaceId: string, file: File, scope: string) {
  const form = new FormData();
  form.append("file", file);
  form.append("scope", scope);
  return apiClient.post<{ uploadId: string }>(
    `/spaces/${spaceId}/payout/onboarding/documents`,
    form,
  );
}

/** `draft: true` for a partial save — validation issues come back on the response instead of failing the request. */
export function submitOnboarding(spaceId: string, data: Record<string, unknown>, draft = false) {
  return apiClient.post<OnboardingChecklist>(`/spaces/${spaceId}/payout/onboarding/submit`, {
    draft,
    data,
  });
}

export function getIdentityMethods(spaceId: string) {
  return apiClient.get<IdentityMethods>(`/spaces/${spaceId}/payout/onboarding/identity/methods`);
}

/** `consent` must be `true` — the rep is attesting to a government database check; show real consent copy before calling this. */
export function submitNin(spaceId: string, nin: string, consent: true, selfie?: string) {
  return apiClient.post<{ status: "verified" | "failed" | "pending"; reason?: string }>(
    `/spaces/${spaceId}/payout/onboarding/identity/nin`,
    { nin, consent, selfie },
  );
}

export function getIdentityStatus(spaceId: string) {
  return apiClient.get<{ status: string; failureReason?: string }>(
    `/spaces/${spaceId}/payout/onboarding/identity/status`,
  );
}
