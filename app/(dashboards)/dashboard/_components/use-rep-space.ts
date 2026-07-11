"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import type { SpaceMembershipSummary } from "@/lib/api/types";

const REP_MEMBERSHIPS = new Set(["rep", "lead", "co"]);

/**
 * A raw membership row from `/auth/me`. The API has used two shapes: a flat
 * `spaces` array (`{ id, membership, joinCode, ... }`) and a `spaceMemberships`
 * array (`{ spaceId, role, joinCode, space: {...} }`). We normalize either.
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
 * The department the signed-in rep manages, resolved from the session user's
 * memberships (no network call). Prefers a `rep`/`lead`/`co` membership; if the
 * account is a rep but nothing is flagged, falls back to its first space.
 * Returns null for students (or before the session loads).
 */
export function useRepSpace(): SpaceMembershipSummary | null {
  const { user } = useAuth();

  // Memoize on `user` so the returned object is referentially stable across
  // re-renders — otherwise every render makes a new object and any effect that
  // depends on it (e.g. RepOverview) refetches in a loop.
  return useMemo(() => {
    if (!user) return null;

    const raw: RawMembership[] =
      (user as unknown as { spaceMemberships?: RawMembership[] }).spaceMemberships ??
      (user.spaces as unknown as RawMembership[] | undefined) ??
      [];

    const memberships = raw
      .map(normalize)
      .filter((m): m is SpaceMembershipSummary => m !== null);

    return (
      memberships.find((s) => REP_MEMBERSHIPS.has(s.membership)) ??
      (user.role === "rep" ? (memberships[0] ?? null) : null)
    );
  }, [user]);
}
