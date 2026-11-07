"use client";

import { keepPreviousData, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { FEATURES } from "@/lib/features";
import {
  getKycStatus,
  getPayoutQuote,
  getPayoutSummary,
  listBanks,
  listBeneficiaries,
  listPayoutsPage,
  listSpaceLedger,
  listSpaceLedgerPage,
  listWithdrawableDues,
} from "./payouts";
import { getPaymentStatus } from "./dues";
import { listTransactions, type TransactionsQuery } from "./transactions";
import { getSpace } from "./spaces";
import { getRepOverview, listReps } from "./rep";
import { getStudentOverview } from "./me";
import { getSpacePartner } from "./partners";
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
  spacePartner: (spaceId: string) => ["space", spaceId, "partner"] as const,
  /** Same key the payout/manage pages already read the summary under. */
  payoutSummary: (spaceId: string) => ["space", spaceId, "payout-summary"] as const,
  ledgerPage: (spaceId: string, page: number, perPage: number) =>
    ["space", spaceId, "ledger", "page", page, perPage] as const,
  payouts: (spaceId: string, page = 1, perPage = 20) => ["space", spaceId, "payouts", page, perPage] as const,
  payoutDetail: (spaceId: string, payoutId: string) => ["space", spaceId, "payout", payoutId] as const,
  beneficiaries: (spaceId: string) => ["space", spaceId, "beneficiaries"] as const,
  withdrawableDues: (spaceId: string) => ["space", spaceId, "withdrawable-dues"] as const,
  payoutQuote: (spaceId: string, amount: number) => ["space", spaceId, "payout-quote", amount] as const,
  studentOverview: ["me", "overview"] as const,
  /** Prefix of every transactions-list query; invalidate this after a payment settles. */
  transactionsRoot: ["me", "transactions"] as const,
  transactions: (query: TransactionsQuery) => ["me", "transactions", query] as const,
  payment: (reference: string) => ["payment", reference] as const,
  banks: ["banks"] as const,
};

/**
 * Everything derived from a space's ledger. Call after any money-moving
 * mutation (withdrawal requested/approved/rejected, beneficiary change) so the
 * balance, history and per-due availability all come back from the server.
 */
export function invalidateSpaceMoney(queryClient: QueryClient, spaceId: string) {
  for (const key of [
    queryKeys.payoutSummary(spaceId),
    queryKeys.spaceLedger(spaceId),
    ["space", spaceId, "payouts"],
    queryKeys.withdrawableDues(spaceId),
    queryKeys.repOverview(spaceId),
  ]) {
    void queryClient.invalidateQueries({ queryKey: key });
  }
}

/** Balance, account, limits and security for the payout dashboard. */
export function usePayoutSummary(
  spaceId: string | undefined,
  { refetchInterval }: { refetchInterval?: number | false } = {},
) {
  return useQuery({
    queryKey: queryKeys.payoutSummary(spaceId ?? ""),
    queryFn: () => getPayoutSummary(spaceId!),
    enabled: !!spaceId,
    refetchInterval,
  });
}

/** One page of withdrawals. Keeps the previous page on screen while the next loads. */
export function usePayoutsPage(
  spaceId: string | undefined,
  page = 1,
  perPage = 20,
  { refetchInterval }: { refetchInterval?: number | false } = {},
) {
  return useQuery({
    queryKey: queryKeys.payouts(spaceId ?? "", page, perPage),
    queryFn: () => listPayoutsPage(spaceId!, { page, perPage }),
    enabled: !!spaceId,
    placeholderData: keepPreviousData,
    refetchInterval,
  });
}

/** One page of the space ledger (server-paginated). */
export function useLedgerPage(spaceId: string | undefined, page = 1, perPage = 20) {
  return useQuery({
    queryKey: queryKeys.ledgerPage(spaceId ?? "", page, perPage),
    queryFn: () => listSpaceLedgerPage(spaceId!, { page, perPage }),
    enabled: !!spaceId,
    placeholderData: keepPreviousData,
  });
}

export function useBeneficiaries(spaceId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.beneficiaries(spaceId ?? ""),
    queryFn: () => listBeneficiaries(spaceId!),
    enabled: !!spaceId,
  });
}

/** Dues the caller can withdraw from, with what's left of each. */
export function useWithdrawableDues(spaceId: string | undefined, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: queryKeys.withdrawableDues(spaceId ?? ""),
    queryFn: () => listWithdrawableDues(spaceId!),
    enabled: !!spaceId && enabled,
  });
}

/**
 * The server's fee/net for a withdrawal amount. Pass an already-debounced
 * amount so typing doesn't fire a request per keystroke.
 */
export function usePayoutQuote(spaceId: string | undefined, amountKobo: number) {
  return useQuery({
    queryKey: queryKeys.payoutQuote(spaceId ?? "", amountKobo),
    queryFn: () => getPayoutQuote(spaceId!, amountKobo),
    enabled: !!spaceId && Number.isSafeInteger(amountKobo) && amountKobo > 0,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

/** The caller's transactions, filtered and paginated by the server. */
export function useTransactions(query: TransactionsQuery) {
  return useQuery({
    queryKey: queryKeys.transactions(query),
    queryFn: () => listTransactions(query),
    placeholderData: keepPreviousData,
  });
}

/**
 * A checkout's status. Only the webhook (and its reconciliation job) moves it,
 * so the page polls while it's `pending` and stops once it's final; polling
 * pauses while the tab is hidden.
 */
export function usePaymentStatus(reference: string | undefined, { pollMs = 5_000 }: { pollMs?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.payment(reference ?? ""),
    queryFn: () => getPaymentStatus(reference!),
    enabled: !!reference,
    staleTime: 0,
    refetchInterval: (q) => (q.state.data?.status === "pending" ? pollMs : false),
    refetchIntervalInBackground: false,
  });
}

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

/** The latest ledger entries (first page) — for overview activity feeds. */
export function useSpaceLedger(spaceId: string | undefined, perPage = 20) {
  return useQuery({
    queryKey: [...queryKeys.spaceLedger(spaceId ?? ""), perPage],
    queryFn: () => listSpaceLedger(spaceId!, perPage),
    enabled: !!spaceId,
  });
}

/**
 * The space's applied partner (null when none). Partners were removed from the
 * API with the 9jaPay release, so this only runs when the feature flag is on.
 */
export function useSpacePartner(spaceId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.spacePartner(spaceId ?? ""),
    // `?? null`: react-query rejects `undefined`, should the API ever send an empty body.
    queryFn: async () => (await getSpacePartner(spaceId!)) ?? null,
    enabled: !!spaceId && FEATURES.partners,
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
