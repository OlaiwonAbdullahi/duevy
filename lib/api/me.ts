import { apiClient } from "./client";
import type { StudentOverview, User } from "./types";

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
 * Update the caller's own profile. `matricNo`/`level`/`role`/`walletBalance` are
 * read-only (server rejects with 422 FIELD_READ_ONLY). Changing `email` flips
 * `emailVerified` to false and re-sends verification. Returns the full user.
 */
export function updateProfile(payload: UpdateProfilePayload) {
  return apiClient.patch<User>("/me", payload);
}
