import { apiClient } from "./client";
import type { Poll, PollCategory, PollNominee, Transaction } from "./types";

/**
 * Public — a poll by its share slug (`/vote/{slug}`). Auth is optional (an
 * anonymous visitor can view a non-members-only poll), but attach the token
 * when one is available — an authenticated caller gets back the members-only
 * gate and their per-category `remaining` vote count, an anonymous one won't.
 */
export function getPoll(slug: string) {
  return apiClient.get<Poll>(`/polls/${slug}`);
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
  /** Hero banner for the public voting page. Proposed — not yet backed by the API. */
  coverImageUrl?: string;
  categories: Array<{
    title: string;
    imageUrl?: string;
    nominees: Array<{
      name: string;
      imageUrl?: string;
      /** Proposed — not yet backed by the API. */
      bio?: string;
      /** Proposed — not yet backed by the API. */
      code?: string;
    }>;
  }>;
  /** Defaults `false` (draft). Set `true` to publish immediately on creation. */
  publish?: boolean;
};

export function createPoll(spaceId: string, payload: PollDraft) {
  return apiClient.post<Poll>(`/spaces/${spaceId}/polls`, payload);
}

/**
 * Upload a category/nominee photo (JPEG/PNG/WebP, ≤2MB). Returns a plain URL —
 * stash it in local form state (new poll) or attach it with
 * `updatePollCategoryImage`/`updatePollNominee` (existing poll).
 */
export function uploadPollImage(spaceId: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  return apiClient.post<{ imageUrl: string }>(`/spaces/${spaceId}/polls/image`, form);
}

/**
 * Attach/replace/remove (`imageUrl: null`) a category's photo on an existing
 * poll. Cosmetic — works at any poll status, no `POLL_STRUCTURE_LOCKED`.
 */
export function updatePollCategoryImage(
  spaceId: string,
  pollId: string,
  categoryId: string,
  imageUrl: string | null,
) {
  return apiClient.patch<PollCategory>(
    `/spaces/${spaceId}/polls/${pollId}/categories/${categoryId}`,
    { imageUrl },
  );
}

/**
 * Update a nominee on an existing poll — photo, and (proposed) bio/code.
 * Cosmetic, like the category photo PATCH: works at any poll status. Today
 * the API only documents `imageUrl` here; `bio`/`code` need the endpoint
 * widened to accept them (see the poll-fields writeup).
 */
export type PollNomineePatch = { imageUrl?: string | null; bio?: string | null; code?: string | null };

export function updatePollNominee(
  spaceId: string,
  pollId: string,
  nomineeId: string,
  payload: PollNomineePatch,
) {
  return apiClient.patch<PollNominee>(
    `/spaces/${spaceId}/polls/${pollId}/nominees/${nomineeId}`,
    payload,
  );
}

/**
 * While `draft`, everything except `categories` is editable. Once `active`,
 * `membersOnly`/`paid`/`amountPerVote` are locked and `deadline` may only be
 * extended — the server rejects otherwise with `409 POLL_STRUCTURE_LOCKED`.
 * `409 POLL_CLOSED` once closed. There is no endpoint to edit categories/nominees
 * after creation.
 */
export type PollPatch = Partial<
  Pick<
    PollDraft,
    "title" | "description" | "deadline" | "membersOnly" | "paid" | "amountPerVote"
  >
> & {
  /** `null` removes the cover. Proposed — not yet backed by the API. */
  coverImageUrl?: string | null;
};

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

/** Free polls omit `method` entirely — only paid votes name a payment method. */
export type CastVotePayload =
  | { selections: VoteSelection[] }
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

/** Cast one or more votes. Paid votes require an Idempotency-Key. */
export function castVote(slug: string, payload: CastVotePayload) {
  const idempotencyKey = "method" in payload ? crypto.randomUUID() : undefined;
  return apiClient.post<CastVoteResult>(`/polls/${slug}/votes`, payload, { idempotencyKey });
}
