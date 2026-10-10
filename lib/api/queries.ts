"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getKycStatus, listBanks, listSpaceLedger } from "./payouts";
import { getSpace } from "./spaces";
import { getRepOverview, listReps } from "./rep";
import { getStudentOverview } from "./me";
import type { KycState, SpaceKycStatus } from "./types";

/**
 * Query keys for data several components share. Hooks below wrap the plain
 * `lib/api/*` functions so a page can render from cache and siblings asking
 * for the same thing share one request.
 */
export const queryKeys = {
  /** `spaceId` undefined = the caller's own state (`/me/kyc-status`). */
  kycStatus: (spaceId?: string) => ["kyc-status", spaceId ?? "me"] as const,
  space: (spaceId: string) => ["space", spaceId] as const,
  spaceReps: (spaceId: string) => ["space", spaceId, "reps"] as const,
  repOverview: (spaceId: string) => ["space", spaceId, "overview"] as const,
  spaceLedger: (spaceId: string) => ["space", spaceId, "ledger"] as const,
  studentOverview: ["me", "overview"] as const,
  banks: ["banks"] as const,
};

export function useKycStatus(spaceId?: string, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.kycStatus(spaceId),
    queryFn: () => getKycStatus(spaceId),
    enabled,
  });
}

/**
 * Write a KYC submission's returned state straight into the cache, so every
 * banner/gate updates without refetching. Only the lead's state is the
 * space's state; a co-rep's submission is theirs alone.
 */
export function useApplyKycState() {
  const queryClient = useQueryClient();
  return (next: KycState, { spaceId, isLead = true }: { spaceId?: string; isLead?: boolean } = {}) => {
    const merge = (s: SpaceKycStatus | undefined) =>
      s ? (isLead ? { ...s, ...next, mine: next } : { ...s, mine: next }) : s;
    queryClient.setQueryData<SpaceKycStatus>(queryKeys.kycStatus(spaceId), merge);
    // The caller's own state changed too, whichever key we came through.
    if (spaceId) {
      queryClient.setQueryData<SpaceKycStatus>(queryKeys.kycStatus(), (s) =>
        s ? { ...s, ...next, mine: next } : s,
      );
    }
  };
}

/** For components that seed local form state: `queryClient.fetchQuery(spaceQuery(id))` shares one request. */
export const spaceQuery = (spaceId: string) => ({
  queryKey: queryKeys.space(spaceId),
  queryFn: () => getSpace(spaceId),
});

export function useSpace(spaceId: string | undefined) {
  return useQuery({ ...spaceQuery(spaceId ?? ""), enabled: !!spaceId });
}

export function useSpaceReps(spaceId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.spaceReps(spaceId ?? ""),
    queryFn: () => listReps(spaceId!),
    enabled: !!spaceId,
  });
}

export const repOverviewQuery = (spaceId: string) => ({
  queryKey: queryKeys.repOverview(spaceId),
  queryFn: () => getRepOverview(spaceId),
});

export function useRepOverview(spaceId: string | undefined) {
  return useQuery({ ...repOverviewQuery(spaceId ?? ""), enabled: !!spaceId });
}

export function useSpaceLedger(spaceId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.spaceLedger(spaceId ?? ""),
    queryFn: () => listSpaceLedger(spaceId!),
    enabled: !!spaceId,
  });
}

export function useStudentOverview() {
  return useQuery({ queryKey: queryKeys.studentOverview, queryFn: getStudentOverview });
}

/** The bank list barely changes, so fetch it once per session. */
export function useBanks() {
  return useQuery({
    queryKey: queryKeys.banks,
    queryFn: listBanks,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
