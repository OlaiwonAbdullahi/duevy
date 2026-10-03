import { apiClient, type Page } from "./client";
import type {
  BankAccount,
  DueCategory,
  DueType,
  KycState,
  Payout,
  PayoutQuote,
  PayoutSummary,
  SpaceKycStatus,
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

/** Live Nigerian bank list (name + CBN code) from Bachs. */
export function listBanks() {
  return apiClient.get<Bank[]>(`/banks`);
}

/** Ledger balance, the lead rep's KYC state, account readiness and the withdrawal fee schedule. */
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
  bankCode: string;
  bankName: string;
  /** Masked. */
  accountNumber: string;
  /** Holder name resolved via Bachs name-enquiry. */
  accountName: string;
  /** Withdrawals only go to an account in the rep's own name. */
  matchesYourName: boolean;
};

/**
 * Resolve (but don't save) the account holder's name via name-enquiry so the rep
 * can confirm before committing. Throws `422 ACCOUNT_UNVERIFIABLE` if it fails.
 */
export function lookupPayoutAccount(
  spaceId: string,
  payload: BankAccountInput,
) {
  return apiClient.post<ResolvedAccount>(
    `/spaces/${spaceId}/payout/account/lookup`,
    payload,
  );
}

/**
 * Lead rep only. Needs a passed identity check (`409 KYC_NOT_VERIFIED`) and an
 * account in the rep's own name (`422 ACCOUNT_NAME_MISMATCH`). Changing the
 * account holds withdrawals for 24 hours and emails every rep.
 */
export function setPayoutAccount(spaceId: string, payload: BankAccountInput) {
  return apiClient.put<BankAccount>(
    `/spaces/${spaceId}/payout/account`,
    payload,
  );
}

/**
 * Lead rep only. `amount` is the gross in kobo; the fee is deducted from it.
 * Money-moving — an Idempotency-Key is attached automatically.
 */
export function requestPayout(
  spaceId: string,
  payload: { amount: number; note?: string },
  idempotencyKey: string = crypto.randomUUID(),
) {
  return apiClient.post<Payout>(`/spaces/${spaceId}/payout/request`, payload, {
    idempotencyKey,
  });
}

/** Most recent 100 withdrawals (the API's page-size ceiling). */
export async function listPayouts(spaceId: string) {
  const page = await apiClient.getPage<Payout[]>(`/spaces/${spaceId}/payouts?perPage=100`);
  return page.data;
}

export function getPayout(spaceId: string, payoutId: string) {
  return apiClient.get<Payout>(`/spaces/${spaceId}/payout/${payoutId}`);
}

/** The fee and net for a withdrawal of `amount` kobo, shown before confirming. */
export function getPayoutQuote(spaceId: string, amount: number) {
  return apiClient.get<PayoutQuote>(`/spaces/${spaceId}/payout/quote?amount=${amount}`);
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
  type: DueType | null;
  /** Deprecated alias of `type`; not sent by current API versions. */
  category?: DueCategory;
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
// Rep KYC — Bachs verifies identity (NIN + date of birth), a Duevy admin
// verifies the student ID card. A space collects only once both pass.
// ---------------------------------------------------------------------------

export type KycSubmission = {
  /** 11 digits. Sent to Bachs; never stored. */
  nin: string;
  /** YYYY-MM-DD. */
  dob: string;
  gender: "male" | "female";
  /** JPEG, PNG, WebP or PDF, max 5 MB. */
  studentIdCard: File;
  /** Only useful when Bachs asks for an ID document. */
  governmentId?: File;
  /** Only if Bachs asks for one. */
  bvn?: string;
  firstName?: string;
  lastName?: string;
  /** `+234` followed by 10 digits. */
  phone?: string;
};

/** Max size of each KYC document, enforced by the API (`413 FILE_TOO_LARGE`). */
export const MAX_KYC_DOCUMENT_BYTES = 5 * 1024 * 1024;

export function getKycStatus(spaceId: string) {
  return apiClient.get<SpaceKycStatus>(`/spaces/${spaceId}/payout/kyc-status`);
}

/** `multipart/form-data`. Returns `202` with the new state; the Bachs verdict arrives by webhook. */
export function submitKyc(spaceId: string, input: KycSubmission) {
  const form = new FormData();
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === "") continue;
    form.append(key, value);
  }
  return apiClient.post<KycState>(`/spaces/${spaceId}/payout/kyc`, form);
}

/** Replace the student ID card after an admin rejected it. */
export function resubmitStudentId(spaceId: string, file: File) {
  const form = new FormData();
  form.append("studentIdCard", file);
  return apiClient.post<KycState>(`/spaces/${spaceId}/payout/kyc/student-id`, form);
}

/** Send Bachs a government ID document, when `requirementsDue` asks for one. */
export function submitGovernmentId(spaceId: string, file: File) {
  const form = new FormData();
  form.append("governmentId", file);
  return apiClient.post<KycState>(`/spaces/${spaceId}/payout/kyc/government-id`, form);
}
