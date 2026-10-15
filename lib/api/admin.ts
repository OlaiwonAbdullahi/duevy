import { apiClient, type Page } from "./client";
import type { Feedback, FeedbackCategory, FeedbackStatus } from "./feedback";
import type {
  ApiMeta,
  Dispute,
  DisputeType,
  DisputeStatus,
  KycState,
  KycStatus,
  PartnerRedemptionSource,
  Poll,
  StudentIdStatus,
  SpaceKind,
  UserRole,
} from "./types";

function toQuery(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

// ---------------------------------------------------------------------------
// 14.1 Overview
// ---------------------------------------------------------------------------

export type AttentionCard = {
  id: string;
  tone: "warning" | "danger" | "info" | "brand" | string;
  badge: string;
  title: string;
  detail: string;
  href: string;
  linkLabel: string;
};

export type AdminOverview = {
  totalUsers: number;
  activeReps: number;
  duesCollected: number;
  duesTarget: number;
  floatHeld: number;
  overdue: { amount: number; count: number };
  /** Duevy's own revenue in kobo: checkout service fees + withdrawal fees kept. */
  revenue: { total: number; checkoutFees: number; withdrawalFees: number; last30Days: number };
  /** Paid student checkouts; `volume` is what students paid (kobo). */
  transactions: { count: number; volume: number; last30Days: number; payouts: number };
  attention: AttentionCard[];
};

export function getAdminOverview() {
  return apiClient.get<AdminOverview>("/admin/overview");
}

// ---------------------------------------------------------------------------
// 14.2 Users
// ---------------------------------------------------------------------------

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  kycStatus: KycStatus;
  isSuspended: boolean;
  isDeactivated?: boolean;
  matricNo?: string | null;
  level?: string | null;
  createdAt?: string;
};

export type AdminUsersQuery = {
  role?: UserRole;
  kycStatus?: KycStatus;
  suspended?: boolean;
  q?: string;
  page?: number;
  perPage?: number;
};

export function listAdminUsers(query: AdminUsersQuery = {}): Promise<Page<AdminUser[]>> {
  return apiClient.getPage<AdminUser[]>(`/admin/users${toQuery(query)}`);
}

export function getAdminUser(userId: string) {
  return apiClient.get<AdminUser>(`/admin/users/${userId}`);
}

export function suspendUser(userId: string, reason: string) {
  return apiClient.post<void>(`/admin/users/${userId}/suspend`, { reason });
}

export function unsuspendUser(userId: string) {
  return apiClient.post<void>(`/admin/users/${userId}/unsuspend`);
}

export function deactivateUser(userId: string, reason: string) {
  return apiClient.post<void>(`/admin/users/${userId}/deactivate`, { reason });
}

export function reviewKyc(
  userId: string,
  // Identity is Bachs's call — an admin can only revoke it, never mark verified.
  payload: { decision: "rejected"; note?: string },
) {
  return apiClient.post<{ kycStatus: KycStatus }>(`/admin/users/${userId}/kyc/review`, payload);
}

// Rep student ID review — Bachs verifies identity (NIN); an admin confirms the
// rep is a student. A space can only collect once its lead's card is approved.

export type StudentIdReviewRow = {
  userId: string;
  name: string;
  email: string;
  matricNo: string | null;
  institution: string | null;
  kycStatus: KycStatus;
  studentId: {
    status: StudentIdStatus;
    mimeType: string | null;
    uploadedAt: string | null;
    reviewedAt: string | null;
    reviewNote: string | null;
    /** Signed link; expires after `viewUrlExpiresInSeconds`. */
    viewUrl: string | null;
    viewUrlExpiresInSeconds: number;
  };
};

export function listStudentIdsForReview(
  query: { status?: StudentIdStatus; page?: number; perPage?: number } = {},
): Promise<Page<StudentIdReviewRow[]>> {
  return apiClient.getPage<StudentIdReviewRow[]>(`/admin/kyc/student-ids${toQuery(query)}`);
}

/** A note is required to reject; the rep is notified either way. */
export function reviewStudentId(
  userId: string,
  payload: { decision: "approved" | "rejected"; note?: string },
) {
  return apiClient.post<KycState>(`/admin/users/${userId}/student-id/review`, payload);
}

// ---------------------------------------------------------------------------
// 14.3 Reps
// ---------------------------------------------------------------------------

export type AdminRep = {
  id: string;
  name: string;
  email?: string;
  emailVerified?: boolean;
  phone?: string | null;
  /** From KYC: "male" | "female". */
  gender?: string | null;
  matricNo?: string | null;
  level?: string | null;
  institution?: string;
  joinedAt?: string;
  status: "active" | "suspended" | "pending";
  verification?: "verified" | "pending" | "unverified";
  heldAmount: number;
  uncollectedAmount: number;
  collectionRate: number;
  payoutsFrozen?: boolean;
  departmentIds?: string[];
  spaces?: { id: string; name: string; short: string; role: "lead" | "co" | string }[];
  /** KYC as it stands now. NIN/BVN/DOB are never stored, so never returned. */
  kyc?: {
    status: ApplicationKyc["identity"]["status"];
    studentIdStatus: ApplicationKyc["studentId"]["status"];
    payoutsActive: boolean;
    submittedAt: string | null;
    payoutAccount: { bankName: string | null; accountMasked: string; accountName: string | null } | null;
  };
  /** What the rep filled in at sign-up. */
  application?: {
    status: RepApplicationStatus;
    requestedSpace: { name: string; short: string; kind: string; school: string; faculty: string | null };
    coRepInvites: string[];
    referralCode: string | null;
    submittedAt: string;
    reviewedAt: string | null;
  } | null;
};

export type RepApplicationStatus = "pending" | "approved" | "rejected";

/** `GET /admin/health` — payment pipeline and review-queue health. */
export type AdminHealth = {
  deadWebhooks: number;
  retryingWebhooks: number;
  stuckPayouts: number;
  checkoutsNeedingReview: number;
  unresolvedCheckouts: number;
  unsettledWithdrawalFees: number;
  pendingStudentIds: number;
  healthy: boolean;
  recentWebhookFailures: {
    eventId: string;
    type: string;
    status: string;
    attempts: number;
    error: string | null;
    receivedAt: string;
  }[];
};

export function getAdminHealth() {
  return apiClient.get<AdminHealth>("/admin/health");
}

export type ApplicationKyc = {
  identity: {
    status: "unverified" | "pending" | "verified" | "rejected";
    rejectionReason: string | null;
    requirementsDue: string[];
    submittedAt: string | null;
    resolvedAt: string | null;
  };
  studentId: {
    status: "pending" | "approved" | "rejected" | null;
    mimeType: string | null;
    uploadedAt: string | null;
    reviewedAt: string | null;
    reviewNote: string | null;
    /** Signed, short-lived link to the private image. */
    viewUrl: string | null;
    viewUrlExpiresInSeconds: number;
  };
};

/** Final approval needs the NIN verified and a student ID on file (approval approves it). */
export function applicationKycReady(kyc: ApplicationKyc | null) {
  return (
    !!kyc &&
    kyc.identity.status === "verified" &&
    (kyc.studentId.status === "pending" || kyc.studentId.status === "approved")
  );
}

export type RepApplication = {
  /** The applicant's user id — also the `{repId}` path param for the review endpoints. */
  userId: string;
  /** Null when the applicant's user record no longer exists (e.g. deleted after applying). */
  applicant: {
    id: string;
    name: string;
    email: string;
    emailVerified?: boolean;
    matricNo?: string | null;
    level?: string | null;
    /** From KYC. */
    phone?: string | null;
    /** From KYC: "male" | "female". */
    gender?: string | null;
  } | null;
  /** NIN verification (Bachs) and the student ID card — reviewed before final approval. */
  kyc: ApplicationKyc | null;
  requestedSpace: {
    name: string;
    short: string;
    kind: SpaceKind;
    school: string;
    faculty?: string | null;
    theme?: string;
  };
  coRepInvites: string[];
  referralCode: string | null;
  status: RepApplicationStatus;
  submittedAt: string;
  reviewedAt: string | null;
  reviewNote: string | null;
};

export function listAdminReps(
  query: { q?: string; page?: number; perPage?: number } = {},
): Promise<Page<AdminRep[]>> {
  return apiClient.getPage<AdminRep[]>(`/admin/reps${toQuery(query)}`);
}

export function listRepApplications(
  query: { status?: RepApplicationStatus; page?: number; perPage?: number } = {},
): Promise<Page<RepApplication[]>> {
  return apiClient.getPage<RepApplication[]>(`/admin/reps/applications${toQuery(query)}`);
}

export function getRepApplication(repId: string) {
  return apiClient.get<RepApplication>(`/admin/reps/${repId}/application`);
}

/** Returns the applicant's newly-active rep record — merge it straight into the reps directory. */
export function verifyRep(repId: string, note?: string) {
  return apiClient.post<AdminRep>(`/admin/reps/${repId}/verify`, { note });
}

export function rejectRep(repId: string, reason: string) {
  return apiClient.post<void>(`/admin/reps/${repId}/reject`, { reason });
}

export function suspendRep(repId: string, reason: string) {
  return apiClient.post<void>(`/admin/reps/${repId}/suspend`, { reason });
}

export function reinstateRep(repId: string) {
  return apiClient.post<void>(`/admin/reps/${repId}/reinstate`);
}

export function freezeRepPayouts(repId: string, reason: string) {
  return apiClient.post<void>(`/admin/reps/${repId}/freeze-payouts`, { reason });
}

export function unfreezeRepPayouts(repId: string) {
  return apiClient.post<void>(`/admin/reps/${repId}/unfreeze-payouts`);
}

// ---------------------------------------------------------------------------
// 14.4 Spaces
// ---------------------------------------------------------------------------

export type AdminSpace = {
  id: string;
  name: string;
  short?: string;
  kind: SpaceKind;
  school: string;
  faculty?: string | null;
  memberCount?: number;
  duesTarget: number;
  collectedAmount: number;
  assignedRepIds: string[];
  payoutsFrozen: boolean;
  /** Whether the lead rep has set the 4-digit withdrawal security code. */
  withdrawalPinSet?: boolean;
  withdrawalPinSetAt?: string | null;
  /** Locked for 30 minutes after 5 wrong codes. */
  withdrawalPinLocked?: boolean;
  /** ISO time withdrawals reopen after the rep reset a forgotten code. */
  withdrawalPinHoldUntil?: string | null;
};

export function listAdminSpaces(
  query: { type?: SpaceKind; school?: string; q?: string; page?: number; perPage?: number } = {},
): Promise<Page<AdminSpace[]>> {
  return apiClient.getPage<AdminSpace[]>(`/admin/spaces${toQuery(query)}`);
}

export type AdminSpaceInput = {
  name: string;
  short: string;
  kind: SpaceKind;
  school: string;
  faculty?: string;
};

export function createAdminSpace(payload: AdminSpaceInput) {
  return apiClient.post<AdminSpace>("/admin/spaces", payload);
}

export function updateAdminSpace(spaceId: string, payload: Partial<AdminSpaceInput>) {
  return apiClient.patch<AdminSpace>(`/admin/spaces/${spaceId}`, payload);
}

export function assignRep(spaceId: string, payload: { userId: string; role: "lead" | "co" }) {
  return apiClient.post<void>(`/admin/spaces/${spaceId}/assign-rep`, payload);
}

/**
 * Clear the space's withdrawal security code (needs the `payouts`
 * permission), e.g. after an account compromise. Admins never set or see
 * codes — the lead rep sets a new one themselves before withdrawing again.
 */
export function clearWithdrawalPin(spaceId: string) {
  return apiClient.delete<{ withdrawalPinSet: false }>(`/admin/spaces/${spaceId}/withdrawal-pin`);
}

export function archiveAdminSpace(spaceId: string, reason: string) {
  return apiClient.post<void>(`/admin/spaces/${spaceId}/archive`, { reason });
}

// ---------------------------------------------------------------------------
// Partners (permission `payouts`)
// ---------------------------------------------------------------------------

export type AdminPartner = {
  id: string;
  name: string;
  short: string;
  code: string;
  logoUrl: string | null;
  withdrawalFeeDiscountPercent: number;
  /** Discount lifetime after redemption; null = permanent. */
  durationDays: number | null;
  /** null = unlimited. */
  maxRedemptions: number | null;
  /** The code can't be redeemed after this; null = never expires. */
  expiresAt: string | null;
  isActive: boolean;
  /** Non-revoked redemptions. */
  redemptionCount: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminPartnerInput = {
  name: string;
  short: string;
  code: string;
  logoUrl?: string | null;
  withdrawalFeeDiscountPercent: number;
  durationDays?: number | null;
  maxRedemptions?: number | null;
  expiresAt?: string | null;
  isActive?: boolean;
};

export type AdminPartnerRedemption = {
  id: string;
  space: { id: string; name: string; short: string | null };
  redeemedBy: { id: string; name: string; email: string };
  source: PartnerRedemptionSource;
  discountPercent: number;
  endsAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

export function listAdminPartners(
  query: {
    q?: string;
    status?: "all" | "active" | "inactive";
    page?: number;
    perPage?: number;
  } = {},
): Promise<Page<AdminPartner[]>> {
  return apiClient.getPage<AdminPartner[]>(`/admin/partners${toQuery(query)}`);
}

/** 409 `PARTNER_CODE_TAKEN` when the code is already used. */
export function createAdminPartner(payload: AdminPartnerInput) {
  return apiClient.post<AdminPartner>("/admin/partners", payload);
}

export function updateAdminPartner(partnerId: string, payload: Partial<AdminPartnerInput>) {
  return apiClient.patch<AdminPartner>(`/admin/partners/${partnerId}`, payload);
}

/** JPEG/PNG/WebP, ≤2MB. Returns a plain URL to put in `logoUrl`. */
export function uploadPartnerLogo(file: File) {
  const form = new FormData();
  form.append("file", file);
  return apiClient.post<{ logoUrl: string }>("/admin/partners/logo", form);
}

export function listPartnerRedemptions(partnerId: string) {
  return apiClient.get<AdminPartnerRedemption[]>(`/admin/partners/${partnerId}/redemptions`);
}

/** The space goes back to full withdrawal fees from its next withdrawal. */
export function revokePartnerRedemption(redemptionId: string) {
  return apiClient.post<AdminPartnerRedemption>(
    `/admin/partner-redemptions/${redemptionId}/revoke`,
  );
}

// ---------------------------------------------------------------------------
// 14.5 Transactions oversight
// ---------------------------------------------------------------------------

export type AdminTxnType = "deposit" | "dues_payment" | "payout" | "refund";
export type AdminTxnStatus = "completed" | "pending" | "failed" | "refunded";

export type AdminTransaction = {
  id: string;
  type: AdminTxnType;
  amount: number;
  status: AdminTxnStatus;
  reference: string;
  userName: string;
  userEmail: string;
  spaceName: string | null;
  createdAt: string;
};

export type AdminTransactionsQuery = {
  type?: AdminTxnType;
  status?: string;
  spaceId?: string;
  userId?: string;
  from?: string;
  to?: string;
  q?: string;
  page?: number;
  perPage?: number;
};

export function listAdminTransactions(
  query: AdminTransactionsQuery = {},
): Promise<Page<AdminTransaction[]>> {
  return apiClient.getPage<AdminTransaction[]>(`/admin/transactions${toQuery(query)}`);
}

export function refundTransaction(txnId: string, payload: { amount?: number; reason: string }) {
  return apiClient.post<AdminTransaction>(`/admin/transactions/${txnId}/refund`, payload);
}

/**
 * Manually mark a due as paid for a user — fixes a payment that genuinely
 * happened (e.g. a webhook that never landed) but never got recorded.
 */
export function manualCreditDue(
  dueId: string,
  payload: { userId: string; reference?: string; reason: string },
) {
  return apiClient.post<{ id: string; reference: string }>(`/admin/dues/${dueId}/credit`, payload);
}

// ---------------------------------------------------------------------------
// 14.6 Disputes
// ---------------------------------------------------------------------------

/** Same resource students/reps file (§13) — admin just sees the whole queue. */
export function listAdminDisputes(
  query: { status?: DisputeStatus; type?: DisputeType; q?: string; page?: number; perPage?: number } = {},
): Promise<Page<Dispute[]>> {
  return apiClient.getPage<Dispute[]>(`/admin/disputes${toQuery(query)}`);
}

export function claimDispute(disputeId: string) {
  return apiClient.post<Dispute>(`/admin/disputes/${disputeId}/claim`);
}

export function resolveDispute(
  disputeId: string,
  payload: { resolution: "upheld" | "rejected"; note: string; refundTxnId?: string },
) {
  return apiClient.post<Dispute>(`/admin/disputes/${disputeId}/resolve`, payload);
}

// ---------------------------------------------------------------------------
// Product feedback inbox (sent from POST /feedback)
// ---------------------------------------------------------------------------

export function listAdminFeedback(
  query: { status?: FeedbackStatus; category?: FeedbackCategory; q?: string; page?: number; perPage?: number } = {},
): Promise<Page<Feedback[]>> {
  return apiClient.getPage<Feedback[]>(`/admin/feedback${toQuery(query)}`);
}

export function resolveFeedback(id: string, note?: string) {
  return apiClient.post<Feedback>(`/admin/feedback/${id}/resolve`, note ? { note } : {});
}

export function reopenFeedback(id: string) {
  return apiClient.post<Feedback>(`/admin/feedback/${id}/reopen`);
}

// ---------------------------------------------------------------------------
// 14.7 Polls oversight
// ---------------------------------------------------------------------------

/** Full `Poll` (§11) plus the owning space's name — platform-wide oversight view. */
export type AdminPoll = Poll & { space: string };

export function listAdminPolls(
  query: { status?: string; q?: string; page?: number; perPage?: number } = {},
): Promise<Page<AdminPoll[]>> {
  return apiClient.getPage<AdminPoll[]>(`/admin/polls${toQuery(query)}`);
}

export function closeAdminPoll(pollId: string, reason: string) {
  return apiClient.post<void>(`/admin/polls/${pollId}/close`, { reason });
}

// ---------------------------------------------------------------------------
// 14.8 Referral integrity
// ---------------------------------------------------------------------------

export type ReferralSummary = {
  userId: string;
  userName: string;
  email: string;
  invited: number;
  joined: number;
  earned: number;
  riskTier: "low" | "medium" | "high";
};

export type ReferralFlagStatus = "pending" | "paid" | "voided" | "clawed_back";

export type ReferralFlag = {
  id: string;
  referrer: string;
  referred: string;
  label: string;
  description: string;
  amount: number;
  status: ReferralFlagStatus;
  date: string;
};

export function listReferralSummaries(
  query: { page?: number; perPage?: number } = {},
): Promise<Page<ReferralSummary[]>> {
  return apiClient.getPage<ReferralSummary[]>(`/admin/referrals/summaries${toQuery(query)}`);
}

export function listReferralFlags(
  query: { status?: ReferralFlagStatus; page?: number; perPage?: number } = {},
): Promise<Page<ReferralFlag[]>> {
  return apiClient.getPage<ReferralFlag[]>(`/admin/referrals/flags${toQuery(query)}`);
}

export function resolveReferralFlag(
  flagId: string,
  payload: { action: "approve" | "void" | "claw_back"; note?: string },
) {
  return apiClient.post<void>(`/admin/referrals/flags/${flagId}/resolve`, payload);
}

// ---------------------------------------------------------------------------
// 14.9 Audit logs & roles
// ---------------------------------------------------------------------------

export type AdminAuditLog = {
  id: string;
  action: string;
  description: string;
  severity: "info" | "warning" | "critical" | string;
  actor: { id: string; name: string };
  createdAt: string;
};

export function listAuditLogs(
  query: {
    severity?: string;
    actorId?: string;
    from?: string;
    to?: string;
    page?: number;
    perPage?: number;
  } = {},
): Promise<Page<AdminAuditLog[]>> {
  return apiClient.getPage<AdminAuditLog[]>(`/admin/audit-logs${toQuery(query)}`);
}

export type AdminSubRole = "super_admin" | "compliance_officer" | "support_lead";

export type AdminPermissions = {
  userManagement: boolean;
  payouts: boolean;
  disputes: boolean;
  overrides: boolean;
};

export type AdminRoleInfo = AdminPermissions & {
  role: AdminSubRole;
  userCount: number;
};

export function getAdminRoles() {
  return apiClient.get<AdminRoleInfo[]>("/admin/roles");
}

export function updateAdminRole(role: AdminSubRole, permissions: AdminPermissions) {
  return apiClient.put<AdminRoleInfo>(`/admin/roles/${role}`, permissions);
}

// ---------------------------------------------------------------------------
// Payment settings
// ---------------------------------------------------------------------------

/** `hosted`: redirect students to Bachs's checkout page. `custom`: show a one-time bank account on Duevy. */
export type CheckoutMode = "hosted" | "custom";

export type PaymentSettings = {
  checkoutMode: CheckoutMode;
  updatedAt: string | null;
  updatedById: string | null;
};

export function getPaymentSettings() {
  return apiClient.get<PaymentSettings>("/admin/settings/payments");
}

/** Super admin only. Applies to checkouts opened afterwards. */
export function updatePaymentSettings(checkoutMode: CheckoutMode) {
  return apiClient.put<PaymentSettings>("/admin/settings/payments", { checkoutMode });
}

// ---------------------------------------------------------------------------
// 14.10 Reports
// ---------------------------------------------------------------------------

export type ReportScope =
  | "financial_summary"
  | "space_collection"
  | "rep_performance"
  | "full_ledger";

export type Report = {
  id: string;
  scope: ReportScope;
  format: "csv" | "pdf";
  from: string;
  to: string;
  status: "ready" | "expired" | string;
  createdAt: string;
};

export type CreateReportInput = {
  scope: ReportScope;
  format: "csv" | "pdf";
  from: string;
  to: string;
  spaceId?: string;
};

export function createReport(payload: CreateReportInput) {
  return apiClient.post<Report>("/admin/reports", payload);
}

export function listReports(
  query: { page?: number; perPage?: number } = {},
): Promise<Page<Report[]>> {
  return apiClient.getPage<Report[]>(`/admin/reports${toQuery(query)}`);
}

/** Path to stream a generated report file (CSV/PDF); links expire after 7 days. */
export function reportDownloadPath(reportId: string) {
  return `/admin/reports/${reportId}/download`;
}

// Bachs is the sole, non-switchable payment provider — the admin gateway-
// switch endpoints that used to live here are gone.

export type { ApiMeta };
