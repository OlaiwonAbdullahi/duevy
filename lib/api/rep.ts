import { apiClient, type Page } from "./client";
import type {
  AuditEntry,
  CollectionStudent,
  CollectionTotals,
  DueCategory,
  RepDue,
  RepOverview,
  Space,
  SpaceMember,
  SpaceRep,
} from "./types";

function toQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/** Aggregate for the rep dashboard home — collection KPIs, active dues, new members. */
export function getRepOverview(spaceId: string) {
  return apiClient.get<RepOverview>(`/spaces/${spaceId}/overview`);
}

/** All dues the space has raised. */
export function listRepDues(
  spaceId: string,
  query: { status?: string; category?: DueCategory } = {},
) {
  return apiClient.get<RepDue[]>(`/spaces/${spaceId}/dues${toQuery(query)}`);
}

export type DueDraft = {
  title: string;
  note?: string;
  amount: number;
  dueDate: string;
  category: DueCategory;
  allowGuests?: boolean;
  publish?: boolean;
};

export function createDue(spaceId: string, payload: DueDraft) {
  return apiClient.post<RepDue>(`/spaces/${spaceId}/dues`, payload);
}

export function updateDue(spaceId: string, dueId: string, payload: Partial<DueDraft>) {
  return apiClient.patch<RepDue>(`/spaces/${spaceId}/dues/${dueId}`, payload);
}

export function publishDue(spaceId: string, dueId: string) {
  return apiClient.post<RepDue>(`/spaces/${spaceId}/dues/${dueId}/publish`);
}

export function closeDue(spaceId: string, dueId: string) {
  return apiClient.post<RepDue>(`/spaces/${spaceId}/dues/${dueId}/close`);
}

export function deleteDue(spaceId: string, dueId: string) {
  return apiClient.delete<void>(`/spaces/${spaceId}/dues/${dueId}`);
}

export type CollectionsResponse = {
  totals: CollectionTotals;
  students: CollectionStudent[];
};

/** Per-student payment roster for a due. */
export function getCollections(spaceId: string, dueId: string): Promise<Page<CollectionsResponse>> {
  return apiClient.getPage<CollectionsResponse>(`/spaces/${spaceId}/dues/${dueId}/collections`);
}

/** Nudge unpaid members. Omit `userIds` to remind all unpaid. */
export function remindUnpaid(spaceId: string, dueId: string, userIds?: string[]) {
  return apiClient.post<void>(`/spaces/${spaceId}/dues/${dueId}/remind`, { userIds });
}

/** Path to the CSV roster export (append `?status=`). */
export function collectionsExportPath(spaceId: string, dueId: string) {
  return `/spaces/${spaceId}/dues/${dueId}/collections/export`;
}

// ---- Circle & membership (§5) ---------------------------------------------

/** Paginated, searchable member roster (`q` matches name/matric/email). */
export function listMembers(
  spaceId: string,
  query: { q?: string; page?: number; perPage?: number } = {},
): Promise<Page<SpaceMember[]>> {
  return apiClient.getPage<SpaceMember[]>(`/spaces/${spaceId}/members${toQuery(query)}`);
}

export function removeMember(spaceId: string, userId: string) {
  return apiClient.delete<void>(`/spaces/${spaceId}/members/${userId}`);
}

/** Rotate the join code; the old one stops working immediately. */
export function regenerateJoinCode(spaceId: string) {
  return apiClient.post<{ code: string }>(`/spaces/${spaceId}/join-code/regenerate`);
}

// ---- Reps, audit & department profile (§5, §4.6) --------------------------

export function listReps(spaceId: string) {
  return apiClient.get<SpaceRep[]>(`/spaces/${spaceId}/reps`);
}

export function inviteRep(spaceId: string, email: string) {
  return apiClient.post<void>(`/spaces/${spaceId}/reps/invite`, { email });
}

export function removeRep(spaceId: string, userId: string) {
  return apiClient.delete<void>(`/spaces/${spaceId}/reps/${userId}`);
}

export function getAuditLog(
  spaceId: string,
  query: { page?: number; perPage?: number } = {},
): Promise<Page<AuditEntry[]>> {
  return apiClient.getPage<AuditEntry[]>(`/spaces/${spaceId}/audit-log${toQuery(query)}`);
}

export type SpaceProfilePatch = {
  name?: string;
  short?: string;
  about?: string;
  hue?: string;
  theme?: string;
};

/** Update the department profile (rep lead). */
export function updateSpaceProfile(spaceId: string, payload: SpaceProfilePatch) {
  return apiClient.patch<Space>(`/spaces/${spaceId}`, payload);
}

/**
 * Hand off lead rep to an existing co-rep. Security-sensitive — re-verifies the
 * caller's password. `400 INVALID_CREDENTIALS` if wrong, `409` if the target
 * isn't already a co-rep of the space (invite them first).
 */
export function transferLead(spaceId: string, payload: { userId: string; password: string }) {
  return apiClient.post<{ spaceId: string; newLeadId: string }>(
    `/spaces/${spaceId}/transfer-lead`,
    payload,
  );
}

/**
 * Permanently retires the space (hides it from student search/join). Payouts
 * must be fully cleared first — `409 PENDING_PAYOUT` / `409 HELD_BALANCE`.
 */
export function archiveSpace(spaceId: string, payload: { password: string; reason?: string }) {
  return apiClient.post<void>(`/spaces/${spaceId}/archive`, payload);
}
