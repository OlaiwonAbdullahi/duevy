import type { KycState, User } from "@/lib/api/types";
import { kycOwesSomething } from "@/lib/kyc";

export const ONBOARDING_PATH = "/onboarding";

const SKIP_KEY = "duevy:onboarding-skipped";

/** Rep applicants onboard (KYC) before they can use the dashboard. */
export function isRepApplicant(user: User | null | undefined) {
  return user?.repApplicationStatus === "pending";
}

/**
 * True while the applicant still owes us something: a check the KYC policy
 * requires that isn't submitted yet, or one that was rejected. Anything merely
 * pending review counts as done — that's on us, not them.
 */
export function kycOutstanding(kyc: KycState) {
  return kycOwesSomething(kyc);
}

/**
 * "Skip for now" on onboarding: lets this applicant into the dashboard until
 * they next sign in (login() and logout() clear it), so onboarding shows again
 * on every login. Per browser; storage failures just mean no skip.
 */
export function skipOnboarding(userId: string) {
  try {
    localStorage.setItem(SKIP_KEY, userId);
  } catch {}
}

export function onboardingSkipped(userId: string | undefined) {
  if (!userId || typeof window === "undefined") return false;
  try {
    return localStorage.getItem(SKIP_KEY) === userId;
  } catch {
    return false;
  }
}

export function clearOnboardingSkip() {
  try {
    localStorage.removeItem(SKIP_KEY);
  } catch {}
}
