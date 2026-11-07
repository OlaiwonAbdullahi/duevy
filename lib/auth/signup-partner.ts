import { normalizePartnerCode } from "@/lib/api/partners";
import { FEATURES } from "@/lib/features";

const KEY = "duevy:signup-partner";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Persists a `?partner=` code from a partner's signup link, so it's still
 * prefilled if the rep wanders off and comes back to finish signup later.
 * A no-op while partner codes are switched off (`FEATURES.partners`).
 */
export function saveSignupPartner(raw: string) {
  if (!FEATURES.partners) return;
  const code = normalizePartnerCode(raw);
  if (!code) return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ code, savedAt: Date.now() }));
  } catch {
    // Private browsing / storage disabled — the URL param still prefills this visit.
  }
}

/** Always null while partner codes are switched off, so nothing stale is sent. */
export function readSignupPartner(): string | null {
  if (!FEATURES.partners) return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const { code, savedAt } = JSON.parse(raw) as { code?: string; savedAt?: number };
    if (typeof savedAt !== "number" || Date.now() - savedAt > MAX_AGE_MS) return null;
    return code ? normalizePartnerCode(code) || null : null;
  } catch {
    return null;
  }
}

export function clearSignupPartner() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to do — a stale entry expires on its own via MAX_AGE_MS.
  }
}
