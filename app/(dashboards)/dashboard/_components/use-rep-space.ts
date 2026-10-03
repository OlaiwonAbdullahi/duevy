"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { listReps } from "@/lib/api/rep";
import type { SpaceMembershipSummary } from "@/lib/api/types";

const REP_MEMBERSHIPS = new Set(["rep", "lead", "co"]);

/**
 * A raw membership row. `/auth/me` sends a flat `spaces` array
 * (`{ id, membership, ... }`); older payloads sent `spaceMemberships`
 * (`{ spaceId, role, space: {...} }`). We normalize either.
 */
type RawMembership = {
  id?: string;
  spaceId?: string;
  membership?: string;
  role?: string;
  name?: string;
  short?: string;
  kind?: string;
  hue?: string;
  joinCode?: string | null;
  space?: {
    id?: string;
    name?: string;
    short?: string;
    kind?: string;
    hue?: string;
    joinCode?: string | null;
  } | null;
};

function normalize(m: RawMembership): SpaceMembershipSummary | null {
  const id = m.spaceId ?? m.space?.id ?? m.id;
  if (!id) return null;
  return {
    id,
    name: m.space?.name ?? m.name ?? "",
    short: m.space?.short ?? m.short,
    kind: (m.space?.kind ?? m.kind) as SpaceMembershipSummary["kind"],
    hue: (m.space?.hue ?? m.hue) as SpaceMembershipSummary["hue"],
    joinCode: m.joinCode ?? m.space?.joinCode ?? null,
    membership: (m.membership ??
      m.role ??
      "member") as SpaceMembershipSummary["membership"],
  };
}

/**
 * `/auth/me` only says `membership: "rep"` — it doesn't say whether the caller
 * is the space's lead or a co-rep. Resolve that from `GET /spaces/:id/reps`,
 * once per space+user (several components on a page use this hook).
 */
const repRoleCache = new Map<string, Promise<"lead" | "co" | null>>();

function fetchRepRole(spaceId: string, userId: string) {
  const key = `${spaceId}:${userId}`;
  let pending = repRoleCache.get(key);
  if (!pending) {
    pending = listReps(spaceId)
      .then((reps) => reps.find((r) => r.id === userId)?.role ?? null)
      .catch(() => {
        repRoleCache.delete(key); // retry on next mount
        return null;
      });
    repRoleCache.set(key, pending);
  }
  return pending;
}

/**
 * The department the signed-in rep manages, from the session user's
 * memberships. `membership` is refined to `lead` / `co` once the reps list
 * loads (it reads `rep` until then). Returns null for students (or before the
 * session loads).
 */
export function useRepSpace(): SpaceMembershipSummary | null {
  const { user } = useAuth();

  // Memoize on `user` so the returned object is referentially stable across
  // re-renders — otherwise every render makes a new object and any effect that
  // depends on it (e.g. RepOverview) refetches in a loop.
  const base = useMemo(() => {
    if (!user) return null;

    const raw: RawMembership[] =
      (user.spaces as unknown as RawMembership[] | undefined) ??
      (user as unknown as { spaceMemberships?: RawMembership[] }).spaceMemberships ??
      [];

    const memberships = raw
      .map(normalize)
      .filter((m): m is SpaceMembershipSummary => m !== null);

    // A rep's own space is listed twice (as `member` and as `rep`) — take the rep entry.
    return memberships.find((s) => REP_MEMBERSHIPS.has(s.membership)) ?? null;
  }, [user]);

  const [role, setRole] = useState<{ key: string; role: "lead" | "co" | null } | null>(null);
  const key = base && user ? `${base.id}:${user.id}` : null;

  useEffect(() => {
    if (!base || !user || base.membership === "lead" || base.membership === "co") return;
    let cancelled = false;
    fetchRepRole(base.id, user.id).then((r) => {
      if (!cancelled) setRole({ key: `${base.id}:${user.id}`, role: r });
    });
    return () => {
      cancelled = true;
    };
  }, [base, user]);

  return useMemo(() => {
    if (!base) return null;
    const resolved = role && role.key === key ? role.role : null;
    return resolved ? { ...base, membership: resolved } : base;
  }, [base, role, key]);
}
