/**
 * The hosted checkout redirect for a paid vote always lands on `/vote/callback`,
 * not back on `/vote/[slug]` — so the slug has to survive the round-trip some
 * other way. Stashed here right before the redirect, read back once on return.
 */
const KEY = "duevy-vote-checkout";

export type PendingVoteCheckout = { slug: string; reference: string };

export function savePendingVoteCheckout(pending: PendingVoteCheckout) {
  sessionStorage.setItem(KEY, JSON.stringify(pending));
}

export function readPendingVoteCheckout(): PendingVoteCheckout | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.slug === "string" && typeof parsed?.reference === "string") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function clearPendingVoteCheckout() {
  sessionStorage.removeItem(KEY);
}
