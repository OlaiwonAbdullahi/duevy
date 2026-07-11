import { apiClient } from "./client";
import type { ReferralsResponse } from "./types";

/**
 * Rep-only. Invite link, stat row, and referral list. Students get 403 FORBIDDEN
 * — the referral program is available to reps only.
 */
export function getReferrals() {
  return apiClient.get<ReferralsResponse>("/referrals");
}

/** Send invite emails carrying the caller's referral code (optional, phase 2). */
export function sendInvites(emails: string[]) {
  return apiClient.post<void>("/referrals/invites", { emails });
}
