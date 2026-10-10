import type { KycState, User } from "@/lib/api/types";

export const ONBOARDING_PATH = "/onboarding";

/** Rep applicants onboard (KYC) before they can use the dashboard. */
export function isRepApplicant(user: User | null | undefined) {
  return user?.repApplicationStatus === "pending";
}

/**
 * True while the applicant still owes us something: NIN not with Bachs yet (or
 * refused), the student ID card missing (or refused), or no payout account
 * (or Bachs refused it and asked again). Anything merely pending review counts
 * as done — that's on us, not them.
 */
export function kycOutstanding(kyc: KycState) {
  return (
    kyc.kycStatus === "rejected" ||
    (kyc.kycStatus !== "verified" && !kyc.providerReference) ||
    kyc.studentId.status === null ||
    kyc.studentId.status === "rejected" ||
    !kyc.payoutDestination ||
    kyc.requirementsDue.some((key) => key.startsWith("payout_destination"))
  );
}
