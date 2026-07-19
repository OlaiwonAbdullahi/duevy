import { apiClient, type Page } from "./client";
import type {
  ApiMeta,
  Dispute,
  DisputeType,
  DisputeStatus,
  KycStatus,
  Poll,
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
  walletBalance?: number;
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
  payload: { decision: "verified" | "rejected"; note?: string },
) {
  return apiClient.post<{ kycStatus: KycStatus }>(`/admin/users/${userId}/kyc/review`, payload);
}

// ---------------------------------------------------------------------------
// 14.3 Reps
// ---------------------------------------------------------------------------

export type AdminRep = {
  id: string;
  name: string;
  email?: string;
  status: "active" | "suspended" | "pending";
  verification?: "verified" | "pending" | "unverified";
  heldAmount: number;
  uncollectedAmount: number;
  collectionRate: number;
  payoutsFrozen?: boolean;
  departmentIds?: string[];
};

export type RepApplicationStatus = "pending" | "approved" | "rejected";

export type RepApplication = {
  /** The applicant's user id — also the `{repId}` path param for the review endpoints. */
  userId: string;
  /** Null when the applicant's user record no longer exists (e.g. deleted after applying). */
  applicant: {
    id: string;
    name: string;
    email: string;
    matricNo?: string | null;
    level?: string | null;
  } | null;
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

export function archiveAdminSpace(spaceId: string, reason: string) {
  return apiClient.post<void>(`/admin/spaces/${spaceId}/archive`, { reason });
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

// ---------------------------------------------------------------------------
// 14.11 Payment gateway
// ---------------------------------------------------------------------------

export type PaymentGateway = "paystack" | "monnify";

export type PaymentGatewaySettings = {
  active: PaymentGateway;
  gateways: Record<PaymentGateway, { configured: boolean }>;
};

/** Active payment gateway plus which gateways have credentials configured. Any admin. */
export function getPaymentGatewaySettings() {
  return apiClient.get<PaymentGatewaySettings>("/admin/settings/payment-gateway");
}

/**
 * Switch the platform's active payment gateway. Super admin only — same gate as
 * `/admin/roles/:role`, since this redirects all platform money. 409s with
 * `GATEWAY_NOT_CONFIGURED` if the target gateway's env credentials aren't set.
 */
export function updatePaymentGateway(gateway: PaymentGateway) {
  return apiClient.put<{ active: PaymentGateway }>("/admin/settings/payment-gateway", { gateway });
}

export type { ApiMeta };
