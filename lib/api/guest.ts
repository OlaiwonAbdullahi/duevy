import { apiClient } from "./client";
import { API_BASE_URL } from "./config";
import type { Checkout } from "./dues";
import type { DueType, EmblemHue, SpaceKind } from "./types";

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
  space: { id: string; name: string; short: string; kind: SpaceKind; hue: EmblemHue };
};

export type GuestCheckout = Checkout & {
  /** Unlocks this checkout's status page and receipt. Keep it with the reference. */
  token: string;
};

export type GuestCheckoutStatus = Checkout & { receiptNumber: string | null };

export type GuestPayer = { name: string; email: string; matricNo?: string };

/** `404` when the link isn't open (members-only, closed, or unknown). */
export function getGuestDue(dueId: string) {
  return apiClient.get<GuestDue>(`/public/dues/${encodeURIComponent(dueId)}`);
}

/**
 * Open (or reuse) a guest checkout.
 * Errors: `409 EMAIL_HAS_ACCOUNT` (sign in instead), `409 DUE_ALREADY_PAID`,
 * `409 SPACE_NOT_VERIFIED`, `404` when the link closed meanwhile.
 */
export function startGuestCheckout(dueId: string, payer: GuestPayer) {
  return apiClient.post<GuestCheckout>(`/public/dues/${encodeURIComponent(dueId)}/checkout`, payer);
}

export function getGuestCheckout(reference: string, token: string) {
  return apiClient.get<GuestCheckoutStatus>(
    `/public/checkouts/${encodeURIComponent(reference)}?t=${encodeURIComponent(token)}`,
  );
}

/** Direct link to a paid guest checkout's PDF receipt (public, token-gated). */
export function guestReceiptUrl(reference: string, token: string) {
  return `${API_BASE_URL}/public/checkouts/${encodeURIComponent(reference)}/receipt?t=${encodeURIComponent(token)}`;
}

/** The shareable link a rep sends out for a guest-enabled due. */
export function guestPayPath(dueId: string) {
  return `/pay/${encodeURIComponent(dueId)}`;
}
