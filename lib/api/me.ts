import { apiClient } from "./client";
import type { NotificationPreferences, Session, StudentOverview, User } from "./types";

/** Aggregate for the student dashboard home — balance, outstanding, top open dues. */
export function getStudentOverview() {
  return apiClient.get<StudentOverview>("/me/overview");
}

export type UpdateProfilePayload = {
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
};

/**
 * Update the caller's own profile. `matricNo`/`level`/`role` are
 * read-only (server rejects with 422 FIELD_READ_ONLY). Changing `email` flips
 * `emailVerified` to false and re-sends verification. Returns the full user.
 */
export function updateProfile(payload: UpdateProfilePayload) {
  return apiClient.patch<User>("/me", payload);
}

/**
 * Upload a new avatar image (JPEG/PNG/WebP, max 2 MB). Persists server-side and
 * updates `avatarUrl` immediately — no follow-up `updateProfile` call needed.
 */
export function uploadAvatar(file: File) {
  const form = new FormData();
  form.append("file", file);
  return apiClient.post<{ avatarUrl: string }>("/me/avatar", form);
}

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

/** Revokes every other active session (refresh token) except the caller's current one. */
export function changePassword(payload: ChangePasswordPayload) {
  return apiClient.put<{ success: boolean }>("/me/password", payload);
}

/** Load once when the notification-settings screen mounts. */
export function getNotificationPreferences() {
  return apiClient.get<NotificationPreferences>("/me/notification-preferences");
}

/** Send the full object on any toggle change — partial updates aren't supported. */
export function updateNotificationPreferences(payload: NotificationPreferences) {
  return apiClient.put<NotificationPreferences>("/me/notification-preferences", payload);
}

/** For a "manage devices" screen. `current` flags the session tied to this request's cookie. */
export function listSessions() {
  return apiClient.get<Session[]>("/me/sessions");
}

/** "Log out this device." Returns `204`. `404` if not found or already revoked. */
export function revokeSession(sessionId: string) {
  return apiClient.delete<void>(`/me/sessions/${sessionId}`);
}

export type DeleteAccountPayload = {
  password: string;
  reason?: string;
};

/**
 * Danger-zone action, always behind a re-auth (password) prompt. Soft-deletes the
 * account and revokes all sessions. `409 ACTIVE_REP_OBLIGATIONS` if the caller
 * needs to hand off rep duties first.
 */
export function deleteAccount(payload: DeleteAccountPayload) {
  return apiClient.delete<void>("/me", { body: payload });
}
