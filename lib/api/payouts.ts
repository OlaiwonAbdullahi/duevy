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

/** Live Nigerian bank list (name + CBN code) from 9jaPay. */
export function listBanks() {
  return apiClient.get<Bank[]>(`/banks`);
}

/**
 * Ledger balance, the space's own 9jaPay account, where the funds sit, today's
 * withdrawal limit, the lead rep's KYC state, withdrawal security and fee bands.
 */
export function getPayoutSummary(spaceId: string) {
  return apiClient.get<PayoutSummary>(`/spaces/${spaceId}/payout/summary`);
}

export type LedgerQuery = { page?: number; perPage?: number };

/** One page of the space's ledger — collections, direct deposits, withdrawals, fees, refunds — newest first. */
export function listSpaceLedgerPage(spaceId: string, query: LedgerQuery = {}): Promise<Page<LedgerEntry[]>> {
  return apiClient.getPage<LedgerEntry[]>(`/spaces/${spaceId}/ledger${toQuery(query)}`);
}

/** The latest ledger entries (first page), newest first. */
export async function listSpaceLedger(spaceId: string, perPage = 20) {
  return (await listSpaceLedgerPage(spaceId, { perPage })).data;
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
  /** Holder name from the bank's name enquiry. */
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

/** One page of the space's withdrawals, newest first. */
export function listPayoutsPage(spaceId: string, query: { page?: number; perPage?: number } = {}): Promise<Page<Payout[]>> {
  return apiClient.getPage<Payout[]>(`/spaces/${spaceId}/payouts${toQuery(query)}`);
}

/** Most recent 100 withdrawals (the API's page-size ceiling). */
export async function listPayouts(spaceId: string) {
  return (await listPayoutsPage(spaceId, { perPage: 100 })).data;
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
// Rep KYC. The admin policy (`requirements` on any KYC state) decides which
// checks apply: the student ID always, the face capture (liveness) by default,
// the NIN + date of birth (checked against NIMC through Didit) only when on.
// ---------------------------------------------------------------------------

export type KycSubmission = {
  /** JPEG, PNG, WebP or PDF, max 5 MB. Always required. */
  studentIdCard: File;
  /** Face capture: a JPEG/PNG/WebP photo or an MP4/MOV/WebM video, max 15 MB. While `requirements.liveness`. */
  liveness?: File;
  /** 11 digits, while `requirements.nin`. Checked, never stored. */
  nin?: string;
  /** YYYY-MM-DD, while `requirements.nin`. */
  dob?: string;
};

/** Max size of the student ID card (`413 FILE_TOO_LARGE`). */
export const MAX_KYC_DOCUMENT_BYTES = 5 * 1024 * 1024;
/** Max size of a face capture (`413 FILE_TOO_LARGE`). */
export const MAX_LIVENESS_BYTES = 15 * 1024 * 1024;

export const STUDENT_ID_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"] as const;
export const LIVENESS_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

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

/**
 * `multipart/form-data`. Returns `202` with the result already known: a NIN
 * match, a partial match awaiting admin review (`nin.reviewStatus: "pending"`),
 * or an error — `422 KYC_REJECTED` (counts as a failed attempt),
 * `422 KYC_INPUT_UNREADABLE` / `503 KYC_PROVIDER_UNAVAILABLE` (not counted),
 * `429 KYC_RETRY_LOCKED`, `413 FILE_TOO_LARGE`.
 */
export function submitKyc(spaceId: string | undefined, input: KycSubmission) {
  const form = new FormData();
  form.append("studentIdCard", input.studentIdCard);
  if (input.liveness) form.append("liveness", input.liveness);
  if (input.nin) form.append("nin", input.nin);
  if (input.dob) form.append("dob", input.dob);
  return apiClient.post<KycState>(kycBase(spaceId), form);
}

/** Replace the student ID card after an admin rejected it (`409 STUDENT_ID_PENDING` / `STUDENT_ID_APPROVED`). */
export function resubmitStudentId(spaceId: string | undefined, file: File) {
  const form = new FormData();
  form.append("studentIdCard", file);
  return apiClient.post<KycState>(`${kycBase(spaceId)}/student-id`, form);
}

/**
 * A new face capture: the first, a retake after rejection, or a real one for
 * a rep verified before liveness existed (`409 LIVENESS_PENDING` / `LIVENESS_APPROVED`).
 */
export function submitLiveness(spaceId: string | undefined, file: File) {
  const form = new FormData();
  form.append("liveness", file);
  return apiClient.post<KycState>(`${kycBase(spaceId)}/liveness`, form);
}
