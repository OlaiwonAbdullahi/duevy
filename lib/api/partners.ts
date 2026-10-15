import { apiClient } from "./client";
import type { PartnerPreview, SpacePartner } from "./types";

/**
 * Error codes the partner endpoints (and `POST /auth/register` with a
 * `partnerCode`) can return, mapped to copy we show next to the code field.
 */
export const PARTNER_ERRORS: Record<string, string> = {
  INVALID_PARTNER_CODE: "That partner code isn't valid.",
  PARTNER_CODE_EXPIRED: "That partner code has expired.",
  PARTNER_CODE_EXHAUSTED: "That partner code has reached its limit.",
  PARTNER_ALREADY_APPLIED: "Your department already has a partner applied.",
};

export function isPartnerErrorCode(code: string | undefined): boolean {
  return !!code && code in PARTNER_ERRORS;
}

/** Codes are stored uppercase; strip anything the server would reject. */
export function normalizePartnerCode(raw: string) {
  return raw.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20);
}

/** "50% off withdrawal fees · for 180 days" / "· permanently". */
export function describePartnerPerk(percent: number, durationDays: number | null) {
  const span = durationDays ? `for ${durationDays} days` : "permanently";
  return `${percent}% off withdrawal fees · ${span}`;
}

/** Public, rate-limited — previews what a code unlocks. Throws a partner error code when it can't be used. */
export function lookupPartnerCode(code: string) {
  return apiClient.get<PartnerPreview>(`/partners/lookup?code=${encodeURIComponent(code)}`, {
    auth: false,
  });
}

/** Any rep of the space. Null when no partner is applied (revoked ones aren't returned). */
export function getSpacePartner(spaceId: string) {
  return apiClient.get<SpacePartner | null>(`/spaces/${spaceId}/partner`);
}

/** Lead rep only. 409 `PARTNER_ALREADY_APPLIED` if the space already has one. */
export function applySpacePartnerCode(spaceId: string, code: string) {
  return apiClient.post<SpacePartner>(`/spaces/${spaceId}/partner`, { code });
}
