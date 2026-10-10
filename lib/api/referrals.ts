import { apiClient } from "./client";
import type { ReferralsResponse } from "./types";

/**
 * Rep-only. Invite link, stat row, and referral list. Students get 403 FORBIDDEN
 * — the referral program is available to reps only.
 */
export function getReferrals() {
  return apiClient.get<ReferralsResponse>("/referrals");
}

/** Send invite emails (1–20) carrying the caller's referral code/link. */
export function sendInvites(emails: string[]) {
  return apiClient.post<{ sent: number }>("/referrals/invites", { emails });
}
