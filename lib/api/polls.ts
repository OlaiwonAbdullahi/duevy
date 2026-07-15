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
  /** Defaults `false` (draft). Set `true` to publish immediately on creation. */
  publish?: boolean;
};

export function createPoll(spaceId: string, payload: PollDraft) {
  return apiClient.post<Poll>(`/spaces/${spaceId}/polls`, payload);
}

/**
 * While `draft`, everything except `categories` is editable. Once `active`,
 * `membersOnly`/`paid`/`amountPerVote` are locked and `deadline` may only be
 * extended — the server rejects otherwise with `409 POLL_STRUCTURE_LOCKED`.
 * `409 POLL_CLOSED` once closed. There is no endpoint to edit categories/nominees
 * after creation.
 */
export type PollPatch = Partial<
  Pick<PollDraft, "title" | "description" | "deadline" | "membersOnly" | "paid" | "amountPerVote">
>;

export function updatePoll(spaceId: string, pollId: string, payload: PollPatch) {
  return apiClient.patch<Poll>(`/spaces/${spaceId}/polls/${pollId}`, payload);
}

/** draft → active. Makes the poll's public link live and votable. */
export function publishPoll(spaceId: string, pollId: string) {
  return apiClient.post<Poll>(`/spaces/${spaceId}/polls/${pollId}/publish`);
}

/** active → closed. Stops new votes and reveals tallies. Idempotent. */
export function closePoll(spaceId: string, pollId: string) {
  return apiClient.post<Poll>(`/spaces/${spaceId}/polls/${pollId}/close`);
}

export type PollResults = {
  poll: Pick<Poll, "id" | "title" | "status">;
  totalVotes: number;
  revenue: number;
  categories: Poll["categories"];
};

/** Results/analytics screen for a poll. */
export function getPollResults(spaceId: string, pollId: string) {
  return apiClient.get<PollResults>(`/spaces/${spaceId}/polls/${pollId}/results`);
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
