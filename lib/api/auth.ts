import { apiClient } from "./client";
import type { SpaceKind } from "@/app/(auth)/components/SpaceDetailsStep";
import type { SpaceThemeId } from "@/app/(dashboards)/dashboard/_components/space-theme";
import type { User } from "./types";

export type AuthSession = { user: User; accessToken: string };

type BaseRegisterPayload = {
  name: string;
  email: string;
  matricNo: string;
  password: string;
  acceptedTerms: boolean;
};

export type RegisterStudentPayload = BaseRegisterPayload & {
  role: "student";
};

export type RegisterRepPayload = BaseRegisterPayload & {
  role: "rep";
  space: {
    name: string;
    short: string;
    kind: SpaceKind;
    school: string;
    faculty?: string;
    theme: SpaceThemeId;
  };
};

export type RegisterPayload = RegisterStudentPayload | RegisterRepPayload;

/** Public — creates an account. Reps get `user.repApplicationStatus === "pending"`. */
export function register(payload: RegisterPayload) {
  return apiClient.post<AuthSession>("/auth/register", payload, { auth: false });
}

/** Public — throws `ApiError` with code `REP_APPROVAL_PENDING` for unapproved reps. */
export function login(payload: { email: string; password: string }) {
  return apiClient.post<AuthSession>("/auth/login", payload, { auth: false });
}

/** Revokes the current refresh token server-side. */
export function logout() {
  return apiClient.post<void>("/auth/logout");
}

/** Seeds `RoleProvider` — the authenticated user with role and space memberships. */
export function getMe() {
  return apiClient.get<User>("/auth/me");
}

/** Always resolves — the API never reveals whether the email exists. */
export function forgotPassword(email: string) {
  return apiClient.post<void>("/auth/forgot-password", { email }, { auth: false });
}

export function resetPassword(payload: { token: string; password: string }) {
  return apiClient.post<void>("/auth/reset-password", payload, { auth: false });
}

export function verifyEmail(token: string) {
  return apiClient.post<void>("/auth/verify-email", { token }, { auth: false });
}
