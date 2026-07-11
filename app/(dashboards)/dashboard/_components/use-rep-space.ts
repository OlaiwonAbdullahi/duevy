"use client";

import { useAuth } from "@/lib/auth/auth-context";

/**
 * The department the signed-in rep manages. A rep is provisioned exactly one
 * space at signup, so we take the first membership flagged `rep`. Returns null
 * for students (or before the session loads) — callers gate rep UI on it.
 */
const REP_MEMBERSHIPS = new Set(["rep", "lead", "co"]);

export function useRepSpace() {
  const { user } = useAuth();
  if (!user) return null;
  const spaces = user.spaces ?? []; // may be absent depending on the endpoint
  // Prefer a department flagged with a rep-ish role; otherwise, if the account
  // itself is a rep, fall back to its only space.
  return (
    spaces.find((s) => REP_MEMBERSHIPS.has(s.membership)) ??
    (user.role === "rep" ? (spaces[0] ?? null) : null)
  );
}
