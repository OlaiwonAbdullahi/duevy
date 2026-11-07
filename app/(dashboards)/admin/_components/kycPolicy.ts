"use client";

import { useQuery } from "@tanstack/react-query";
import { getKycPolicy } from "@/lib/api/admin";

export const kycPolicyQueryKey = ["admin", "kyc-policy"] as const;

/**
 * Which checks reps must pass (`GET /admin/settings/kyc`). Shared by the
 * settings page, the verification queues and rep application review so a
 * change in Settings shows everywhere.
 */
export function useKycPolicy({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({ queryKey: kycPolicyQueryKey, queryFn: getKycPolicy, staleTime: 30_000, enabled });
}
