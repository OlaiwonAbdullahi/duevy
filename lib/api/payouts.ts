import { apiClient, type Page } from "./client";
import type {
  Beneficiary,
  DueCategory,
  DueType,
  KycState,
  LedgerEntry,
  Payout,
  PayoutQuote,
  PayoutSummary,
  Signatory,
  SpaceKycStatus,
  WithdrawalAuthMode,
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

/** Ledger balance, the lead rep's KYC state, beneficiary count and the withdrawal fee schedule. */
export function getPayoutSummary(spaceId: string) {
  return apiClient.get<PayoutSummary>(`/spaces/${spaceId}/payout/summary`);
}

/** The space's ledger — collections, withdrawals, fees, refunds — newest first. */
export function listSpaceLedger(spaceId: string) {
  return apiClient.get<LedgerEntry[]>(`/spaces/${spaceId}/ledger`);
}

export type BeneficiaryInput = {
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
};

/**
 * Resolve (but don't save) the account holder's name via name-enquiry so the rep
 * can confirm before adding it. Throws `422 ACCOUNT_UNVERIFIABLE` if it fails.
 */
export function lookupBeneficiary(spaceId: string, payload: BeneficiaryInput) {
  return apiClient.post<ResolvedAccount>(
    `/spaces/${spaceId}/payout/beneficiaries/lookup`,
    payload,
  );
}

/** The accounts this space can withdraw to, newest first. */
export function listBeneficiaries(spaceId: string) {
  return apiClient.get<Beneficiary[]>(`/spaces/${spaceId}/payout/beneficiaries`);
}

/**
 * Lead rep only; needs a passed identity check (`409 KYC_NOT_VERIFIED`). Any
 * account can be added — it doesn't have to be in the rep's name. Adding an
 * account that's already there returns the existing beneficiary.
 */
export function addBeneficiary(spaceId: string, payload: BeneficiaryInput & { label?: string }) {
  return apiClient.post<Beneficiary>(`/spaces/${spaceId}/payout/beneficiaries`, payload);
}

/** Lead rep only. Withdrawals already sent to it are unaffected. */
export function removeBeneficiary(spaceId: string, beneficiaryId: string) {
  return apiClient.delete<{ removed: true }>(
    `/spaces/${spaceId}/payout/beneficiaries/${beneficiaryId}`,
  );
}

/** Where a withdrawal goes: a saved beneficiary, or a one-off account that isn't saved. */
export type PayoutTarget = { beneficiaryId: string } | BeneficiaryInput;

/**
 * `amount` is the gross in kobo; the fee is deducted from it. The lead may
 * withdraw from the whole space or one due; a co-rep only from a due assigned
 * to them (`dueId`, else `403 DUE_REQUIRED` / `DUE_NOT_ASSIGNED`).
 *
 * `pin` mode: `pin` is the space's 4-digit security code
 * (`403 INVALID_WITHDRAWAL_PIN`, `423 WITHDRAWAL_PIN_LOCKED` after 5 misses,
 * `403 WITHDRAWAL_PIN_NOT_SET`). `multisig` mode: no code; the payout comes
 * back `awaiting_approval` with `approval`. `423 WITHDRAWAL_PIN_HOLD` for 24h
 * after any security change. Money-moving — an Idempotency-Key is attached
 * automatically.
 */
export function requestPayout(
  spaceId: string,
  payload: { amount: number; note?: string; pin?: string; dueId?: string } & PayoutTarget,
  idempotencyKey: string = crypto.randomUUID(),
) {
  return apiClient.post<Payout>(`/spaces/${spaceId}/payout/request`, payload, {
    idempotencyKey,
  });
}

/**
 * Lead rep only. Sets the space's 4-digit withdrawal code (first time), or
 * changes it (`currentPin` required once one exists). Always needs the
 * account password (`403 INVALID_PASSWORD`, `409 PASSWORD_REQUIRED` for
 * Google-only accounts, `422 WEAK_PIN`).
 */
export function setWithdrawalPin(spaceId: string, payload: { pin: string; password: string; currentPin?: string }) {
  return apiClient.put<WithdrawalPinResult>(`/spaces/${spaceId}/payout/pin`, payload);
}

/**
 * Lead rep forgot the code: set a new one with the account password alone.
 * Withdrawals are then held for 24 hours and every rep is notified.
 */
export function resetWithdrawalPin(spaceId: string, payload: { pin: string; password: string }) {
  return apiClient.post<WithdrawalPinResult>(`/spaces/${spaceId}/payout/pin/reset`, payload);
}

export type WithdrawalPinResult = {
  withdrawalPinSet: true;
  change: "set" | "changed" | "reset";
  /** ISO time withdrawals reopen after a reset; null otherwise. */
  withdrawalPinHoldUntil: string | null;
};

/** Most recent 100 withdrawals (the API's page-size ceiling). */
export async function listPayouts(spaceId: string) {
  const page = await apiClient.getPage<Payout[]>(`/spaces/${spaceId}/payouts?perPage=100`);
  return page.data;
}

export function getPayout(spaceId: string, payoutId: string) {
  return apiClient.get<Payout>(`/spaces/${spaceId}/payout/${payoutId}`);
}

export type WithdrawableDue = {
  id: string;
  title: string;
  type: DueType;
  status: string;
  assignedRepId: string | null;
  /** Kobo left of this due's collections. */
  available: number;
};

/** Dues the caller can withdraw from: all of them for the lead, assigned ones for a co-rep. */
export function listWithdrawableDues(spaceId: string) {
  return apiClient.get<WithdrawableDue[]>(`/spaces/${spaceId}/payout/dues`);
}

// ---------------------------------------------------------------------------
// Signing a multisig withdrawal: 2 of the 3 signatories approve it with a
// 6-digit code Duevy emails them.
// ---------------------------------------------------------------------------

/** Email me a code for this withdrawal (10 minutes; `429 OTP_RECENTLY_SENT` within a minute). */
export function sendApprovalOtp(spaceId: string, payoutId: string) {
  return apiClient.post<{ sent: true; expiresAt: string }>(`/spaces/${spaceId}/payout/${payoutId}/otp`);
}

/** `403 INVALID_OTP`, `423 OTP_LOCKED`, `400 OTP_EXPIRED`, `409 ALREADY_SIGNED`. The second approval sends it. */
export function approvePayout(spaceId: string, payoutId: string, otp: string) {
  return apiClient.post<Payout>(`/spaces/${spaceId}/payout/${payoutId}/approve`, { otp });
}

/** A signatory rejects it, or its requester withdraws it. The balance is restored. */
export function rejectPayout(spaceId: string, payoutId: string, reason?: string) {
  return apiClient.post<Payout>(`/spaces/${spaceId}/payout/${payoutId}/reject`, reason ? { reason } : {});
}

/**
 * Lead only. The two co-reps who sign with the lead. While approvals are on a
 * change holds withdrawals for 24 hours (`withdrawalPinHoldUntil`).
 */
export function setSignatories(spaceId: string, payload: { userIds: string[]; password: string }) {
  return apiClient.put<{ signatories: Signatory[]; signatoriesComplete: boolean; withdrawalPinHoldUntil: string | null }>(
    `/spaces/${spaceId}/payout/signatories`,
    payload,
  );
}

/**
 * Lead only. Turning `multisig` on needs 3 signatories (`409 SIGNATORIES_INCOMPLETE`);
 * switching back to `pin` holds withdrawals for 24 hours.
 */
export function setWithdrawalSecurity(spaceId: string, payload: { mode: WithdrawalAuthMode; password: string }) {
  return apiClient.put<{ withdrawalAuthMode: WithdrawalAuthMode; changed: boolean; withdrawalPinHoldUntil: string | null }>(
    `/spaces/${spaceId}/payout/security`,
    payload,
  );
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

/**
 * KYC lives on the user. With a `spaceId` these hit the space's mount (whose
 * status is the space lead's state, plus `mine`); without one — a rep
 * applicant whose space doesn't exist yet — they hit `/me/kyc*` for the caller.
 */
function kycBase(spaceId?: string) {
  return spaceId ? `/spaces/${spaceId}/payout/kyc` : "/me/kyc";
}

export async function getKycStatus(spaceId?: string): Promise<SpaceKycStatus> {
  if (spaceId) return apiClient.get<SpaceKycStatus>(`/spaces/${spaceId}/payout/kyc-status`);
  // The caller's own state is also the "space" state for an applicant.
  const mine = await apiClient.get<KycState>("/me/kyc-status");
  return { ...mine, leadRepId: null, mine };
}

/** `multipart/form-data`. Returns `202` with the new state; the Bachs verdict arrives by webhook. */
export function submitKyc(spaceId: string | undefined, input: KycSubmission) {
  const form = new FormData();
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === "") continue;
    form.append(key, value);
  }
  return apiClient.post<KycState>(kycBase(spaceId), form);
}

/** Replace the student ID card after an admin rejected it. */
export function resubmitStudentId(spaceId: string | undefined, file: File) {
  const form = new FormData();
  form.append("studentIdCard", file);
  return apiClient.post<KycState>(`${kycBase(spaceId)}/student-id`, form);
}

/** Send Bachs a government ID document, when `requirementsDue` asks for one. */
export function submitGovernmentId(spaceId: string | undefined, file: File) {
  const form = new FormData();
  form.append("governmentId", file);
  return apiClient.post<KycState>(`${kycBase(spaceId)}/government-id`, form);
}

/** Name-enquiry for the rep's own payout account, without sending it to Bachs. */
export function lookupPayoutDestination(spaceId: string | undefined, payload: BeneficiaryInput) {
  return apiClient.post<ResolvedAccount>(`${kycBase(spaceId)}/payout-destination/lookup`, payload);
}

/**
 * The rep's own bank account, sent to Bachs as their payout destination.
 * Needs the NIN + student ID submission first (`409 KYC_NOT_STARTED`).
 */
export function submitPayoutDestination(spaceId: string | undefined, payload: BeneficiaryInput) {
  return apiClient.post<KycState>(`${kycBase(spaceId)}/payout-destination`, payload);
}
