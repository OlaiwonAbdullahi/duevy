import { apiClient } from "./client";
import { API_BASE_URL } from "./config";
import type { Checkout } from "./dues";
import type { DueType, EmblemHue, GuestAnswer, GuestField, SpaceKind } from "./types";

/**
 * Guest pay: dues a rep opened to guests can be paid from a public link with a
 * name and email, no account. No session — a guest checkout's status and
 * receipt are unlocked by the `token` returned when it's created.
 */

/** What a guest sees before paying. Amounts in kobo. */
export type GuestDue = {
  id: string;
  title: string;
  note: string | null;
  type: DueType;
  dueDate: string;
  amount: number;
  fee: number;
  total: number;
  /** False until the rep finishes verification — the space can't collect yet. */
  canCollect: boolean;
  /** The rep's extra questions, on top of name, email and matric number (always asked). */
  fields: GuestField[] | null;
  space: { id: string; name: string; short: string; kind: SpaceKind; hue: EmblemHue };
};

export type GuestCheckout = Checkout & {
  /** Unlocks this checkout's status page and receipt. Keep it with the reference. */
  token: string;
};

/** Where the payer's Duevy account stands. */
export type GuestAccountState = {
  /** The payer already has a full account (paid signed in, or activated since). */
  exists: boolean;
  /** They asked for one — at checkout, or from the success page. */
  requested: boolean;
  /** When the activation link was emailed; null until the payment is confirmed and it's sent. */
  inviteSentAt: string | null;
};

/**
 * `spaceName`, `payer`, `answers` and `account` are newer than the endpoint:
 * an API without them gives null / empty here (see `getGuestCheckout`), and
 * the receipt leaves those parts out rather than failing.
 */
export type GuestCheckoutStatus = Checkout & {
  receiptNumber: string | null;
  spaceName: string | null;
  payer: { name: string; email: string; matricNo: string | null } | null;
  answers: GuestAnswer[];
  account: GuestAccountState | null;
};

export type GuestPayer = {
  name: string;
  email: string;
  /** Always asked; may be left out only when signed in with one on the profile. */
  matricNo?: string;
  /** Answers to the due's `fields`, keyed by field id. */
  answers?: Record<string, string>;
  /** "Create a free Duevy account for me" — the account is made only once the payment is confirmed. */
  createAccount?: boolean;
};

/** `404` when the link isn't open (members-only, closed, or unknown). */
export function getGuestDue(dueId: string) {
  return apiClient.get<GuestDue>(`/public/dues/${encodeURIComponent(dueId)}`);
}

/**
 * Open (or reuse) a guest checkout. When signed in, the session's account pays
 * (the typed name and email are ignored), so the payment lands in its history.
 * Errors: `400 VALIDATION_ERROR` (an answer is missing or invalid; `details[].field`
 * is `answers.<fieldId>`, or `matricNo`), `409 EMAIL_HAS_ACCOUNT` (sign in instead), `409 DUE_ALREADY_PAID`,
 * `409 SPACE_NOT_VERIFIED`, `404` when the link closed meanwhile.
 */
export function startGuestCheckout(dueId: string, payer: GuestPayer) {
  return apiClient.post<GuestCheckout>(`/public/dues/${encodeURIComponent(dueId)}/checkout`, payer);
}

export async function getGuestCheckout(reference: string, token: string): Promise<GuestCheckoutStatus> {
  const c = await apiClient.get<Partial<GuestCheckoutStatus> & Checkout>(
    `/public/checkouts/${encodeURIComponent(reference)}?t=${encodeURIComponent(token)}`,
  );
  return {
    ...c,
    receiptNumber: c.receiptNumber ?? null,
    spaceName: c.spaceName ?? null,
    payer: c.payer ?? null,
    answers: c.answers ?? [],
    account: c.account ?? null,
  };
}

/**
 * Ask for a Duevy account after the fact, or for the activation link again.
 * Sent once the payment is confirmed. `409 ACCOUNT_EXISTS` when the email already has one.
 */
export function requestGuestAccount(reference: string, token: string) {
  return apiClient.post<{ outcome: string; account: GuestAccountState }>(
    `/public/checkouts/${encodeURIComponent(reference)}/account?t=${encodeURIComponent(token)}`,
  );
}

/** A paid guest checkout's PDF receipt (public, token-gated), relative to the API. */
export function guestReceiptPath(reference: string, token: string) {
  return `/public/checkouts/${encodeURIComponent(reference)}/receipt?t=${encodeURIComponent(token)}`;
}

/** Direct link to a paid guest checkout's PDF receipt. */
export function guestReceiptUrl(reference: string, token: string) {
  return `${API_BASE_URL}${guestReceiptPath(reference, token)}`;
}

/** The shareable link a rep sends out for a guest-enabled due. */
export function guestPayPath(dueId: string) {
  return `/pay/${encodeURIComponent(dueId)}`;
}
