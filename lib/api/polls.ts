import { apiClient } from "./client";
import type { Poll, Transaction } from "./types";

/** Public — a poll by its share slug (`/vote/{slug}`). */
export function getPoll(slug: string) {
  return apiClient.get<Poll>(`/polls/${slug}`, { auth: false });
}

/** Rep — polls for a space. */
export function listPolls(spaceId: string) {
  return apiClient.get<Poll[]>(`/spaces/${spaceId}/polls`);
}

export type PollDraft = {
  title: string;
  description?: string;
  deadline: string;
  paid: boolean;
  amountPerVote?: number;
  membersOnly?: boolean;
  categories: Array<{ title: string; nominees: Array<{ name: string }> }>;
};

export function createPoll(spaceId: string, payload: PollDraft) {
  return apiClient.post<Poll>(`/spaces/${spaceId}/polls`, payload);
}

export type VoteSelection = { categoryId: string; nomineeId: string; quantity: number };

export type CastVotePayload =
  | { selections: VoteSelection[]; method: "free" }
  | { selections: VoteSelection[]; method: "wallet" }
  | { selections: VoteSelection[]; method: "card"; cardId: string }
  | { selections: VoteSelection[]; method: "online" };

export type CastVoteResult = {
  receiptId?: string;
  totalCharged?: number;
  transaction?: Transaction;
  /** Present for `online` — redirect to hosted checkout. */
  checkoutUrl?: string;
  reference?: string;
};

/** Cast one or more votes. Paid polls attach an Idempotency-Key. */
export function castVote(slug: string, payload: CastVotePayload) {
  const idempotencyKey = payload.method === "free" ? undefined : crypto.randomUUID();
  return apiClient.post<CastVoteResult>(`/polls/${slug}/votes`, payload, { idempotencyKey });
}
