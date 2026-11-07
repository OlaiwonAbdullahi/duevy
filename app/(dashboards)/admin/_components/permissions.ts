"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/auth-context";
import { getAdminRoles, type AdminPermissions } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/errors";

export type AdminPermission = keyof AdminPermissions;

/** What each permission is called in the UI, for "you need …" explanations. */
export const PERMISSION_LABELS: Record<AdminPermission, string> = {
  userManagement: "User management",
  payouts: "Payouts",
  disputes: "Disputes",
  overrides: "System overrides",
};

/**
 * The signed-in admin's permissions, as far as the UI can tell. `/auth/me`
 * carries the admin's sub-role and `/admin/roles` maps each sub-role to its
 * permissions; a super admin has all of them.
 *
 * `can()` returns `null` while unknown (still loading, `/admin/roles` refused,
 * or no sub-role) — callers then let the action through and handle a 403, as
 * the server is the authority either way.
 */
export function useAdminPermissions() {
  const { user } = useAuth();
  const subRole = user?.role === "admin" ? user.adminSubRole : null;
  const isSuper = subRole === "super_admin";

  const roles = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: getAdminRoles,
    enabled: !!subRole && !isSuper,
    staleTime: 5 * 60_000,
    retry: (count, err) => !(err instanceof ApiError && err.status === 403) && count < 2,
  });

  const row = subRole && !isSuper ? roles.data?.find((r) => r.role === subRole) : undefined;

  const can = (permission: AdminPermission): boolean | null => {
    if (isSuper) return true;
    if (!row) return null;
    return row[permission];
  };

  return { can, loading: !!subRole && !isSuper && roles.isPending };
}

/** True for the server's "you lack this admin permission" response. */
export function isForbidden(err: unknown) {
  return err instanceof ApiError && err.status === 403;
}
