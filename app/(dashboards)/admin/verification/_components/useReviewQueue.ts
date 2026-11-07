"use client";

import { useRef, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Page } from "@/lib/api/client";
import type { ReviewDecision } from "@/lib/api/admin";
import type { DocumentReviewStatus } from "@/lib/api/types";
import { ApiError } from "@/lib/api/errors";

export type QueueKind = "student-ids" | "liveness" | "nin";
export const QUEUE_PER_PAGE = 20;

export const queueKey = (kind: QueueKind) => ["admin", "kyc-queue", kind] as const;

/**
 * One server-paginated review queue, filtered by status. Rows carry signed
 * links, so the list is never kept long and `dataUpdatedAt` is when they were
 * signed (for the expiry check).
 */
export function useReviewQueue<Row>(
  kind: QueueKind,
  fetcher: (q: { status: DocumentReviewStatus; page: number; perPage: number }) => Promise<Page<Row[]>>,
) {
  const [status, setStatusState] = useState<DocumentReviewStatus>("pending");
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: [...queueKey(kind), status, page],
    queryFn: () => fetcher({ status, page, perPage: QUEUE_PER_PAGE }),
    placeholderData: keepPreviousData,
    staleTime: 0,
    // Don't refetch behind the reviewer's back mid-decision; they refresh links on demand.
    refetchOnWindowFocus: false,
  });
  const setStatus = (next: DocumentReviewStatus) => {
    setStatusState(next);
    setPage(1);
  };
  return { query, status, setStatus, page, setPage };
}

/**
 * Approve / reject one row. Guards against double submits (a second click
 * while the first is in flight is ignored) and, on success, invalidates the
 * queue and the rep application views that show the same check.
 */
export function useReviewDecision(
  kind: QueueKind,
  review: (userId: string, payload: ReviewDecision) => Promise<unknown>,
  { onDone }: { onDone?: (decision: ReviewDecision["decision"]) => void } = {},
) {
  const queryClient = useQueryClient();
  const inFlight = useRef(false);
  const mutation = useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: ReviewDecision }) => review(userId, payload),
    onSuccess: (_data, { payload }) => {
      onDone?.(payload.decision);
    },
    onError: (err) => {
      if (err instanceof ApiError && err.code === "NOT_PENDING") {
        toast.error("Someone already decided this one. The queue has been refreshed.");
      } else if (err instanceof ApiError && err.status === 403) {
        toast.error("You don't have permission to review rep verification (needs User management).");
      } else {
        toast.error(err instanceof ApiError ? err.message : "Couldn't save the review.");
      }
    },
    onSettled: () => {
      inFlight.current = false;
      void queryClient.invalidateQueries({ queryKey: queueKey(kind) });
      void queryClient.invalidateQueries({ queryKey: ["admin", "rep-applications"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "rep-application"] });
    },
  });

  const decide = async (userId: string, payload: ReviewDecision) => {
    if (inFlight.current) return false;
    inFlight.current = true;
    try {
      await mutation.mutateAsync({ userId, payload });
      return true;
    } catch {
      return false;
    }
  };

  return {
    decide,
    pending: mutation.isPending,
    pendingDecision: mutation.isPending ? mutation.variables?.payload.decision ?? null : null,
  };
}
