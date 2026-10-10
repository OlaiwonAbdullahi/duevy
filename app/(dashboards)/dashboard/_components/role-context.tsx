"use client";

import { createContext, useContext, type ReactNode } from "react";

export type Role = "student" | "rep";

type RoleContextValue = {
  role: Role;
  /** A rep sees every student section plus the rep-only ones. */
  isRep: boolean;
  /** True while a rep application is awaiting admin approval (role is still `student`). */
  isPendingRep: boolean;
};

const RoleContext = createContext<RoleContextValue | null>(null);

/**
 * Holds the viewer's role for the whole dashboard. The role is the signed-in
 * account's real role from the session (`DashboardShell` seeds it from
 * `useAuth`) — there is no client-side switching.
 */
export function RoleProvider({
  children,
  initialRole = "student",
  isPendingRep = false,
}: {
  children: ReactNode;
  initialRole?: Role;
  isPendingRep?: boolean;
}) {
  return (
    <RoleContext.Provider
      value={{ role: initialRole, isRep: initialRole === "rep", isPendingRep }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used inside a <RoleProvider>");
  return ctx;
}
