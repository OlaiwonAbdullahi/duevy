"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type Role = "student" | "rep";

type RoleContextValue = {
  role: Role;
  setRole: (role: Role) => void;
  /** A rep sees every student section plus the rep-only ones. */
  isRep: boolean;
};

const RoleContext = createContext<RoleContextValue | null>(null);

/**
 * Holds the "who is looking at this screen" role for the whole dashboard.
 *
 * Right now the role is just local state seeded to `student` so we can demo how
 * one route (`/dashboard/...`) renders differently per role. Once auth lands,
 * swap the initial value for the signed-in user's role from the session.
 */
export function RoleProvider({
  children,
  initialRole = "student",
}: {
  children: ReactNode;
  initialRole?: Role;
}) {
  const [role, setRole] = useState<Role>(initialRole);

  return (
    <RoleContext.Provider value={{ role, setRole, isRep: role === "rep" }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used inside a <RoleProvider>");
  return ctx;
}
