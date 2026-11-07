import { kycRequirements, type KycState } from "@/lib/api/types";

/**
 * The rep's KYC as a list of checks, built from the admin policy
 * (`requirements`). The student ID is always required; the face capture and
 * the NIN check only while the policy turns them on. Whether the rep is
 * verified is `canCollect`, never `kycStatus` (that's the NIN check's own).
 */
export type KycCheckKey = "studentId" | "liveness" | "nin";
export type KycCheckState = "todo" | "pending" | "approved" | "rejected";

export type KycCheck = {
  key: KycCheckKey;
  label: string;
  /** Lowercase, for sentences: "your student ID". */
  noun: string;
  state: KycCheckState;
  /** The admin's (or the register's) reason, when rejected. */
  note: string | null;
  /** When the current file was sent, for the documents. */
  uploadedAt: string | null;
};

function documentState(status: string | null | undefined): KycCheckState {
  return status === "approved" || status === "pending" || status === "rejected" ? status : "todo";
}

/** The NIN check: verified on a match, pending while an admin reviews a partial match. */
export function ninCheckState(kyc: KycState): KycCheckState {
  if (kyc.kycStatus === "verified") return "approved";
  if (kyc.nin?.reviewStatus === "pending" || kyc.kycStatus === "pending") return "pending";
  if (kyc.kycStatus === "rejected") return "rejected";
  return "todo";
}

/** The checks the current policy requires, in the order the rep does them. */
export function kycChecks(kyc: KycState): KycCheck[] {
  const req = kycRequirements(kyc);
  const checks: KycCheck[] = [
    {
      key: "studentId",
      label: "Student ID card",
      noun: "your student ID",
      state: documentState(kyc.studentId.status),
      note: kyc.studentId.reviewNote,
      uploadedAt: kyc.studentId.uploadedAt,
    },
  ];
  if (req.liveness) {
    checks.push({
      key: "liveness",
      label: "Face capture",
      noun: "your face capture",
      state: documentState(kyc.liveness?.status),
      note: kyc.liveness?.reviewNote ?? null,
      uploadedAt: kyc.liveness?.uploadedAt ?? null,
    });
  }
  if (req.nin) {
    checks.push({
      key: "nin",
      label: "NIN check",
      noun: "your NIN",
      state: ninCheckState(kyc),
      note: kyc.nin?.reviewNote ?? kyc.rejectionReason,
      uploadedAt: null,
    });
  }
  return checks;
}

/** The time retries unlock, when the NIN check is currently locked after three failures. */
export function kycLockedUntil(kyc: KycState): string | null {
  return kyc.retryLockedUntil && new Date(kyc.retryLockedUntil) > new Date() ? kyc.retryLockedUntil : null;
}

/**
 * True while the rep still owes us something: a required check not yet
 * submitted, or one that was rejected. Anything pending review doesn't count —
 * that's on us, not them.
 */
export function kycOwesSomething(kyc: KycState): boolean {
  if (kyc.canCollect) return false;
  return kycChecks(kyc).some((c) => c.state === "todo" || c.state === "rejected");
}

/** "your student ID", "your student ID and face capture", "a, b and c". */
export function joinNouns(checks: Pick<KycCheck, "noun">[]): string {
  const nouns = checks.map((c, i) => (i === 0 ? c.noun : c.noun.replace(/^your /, "")));
  if (nouns.length <= 1) return nouns[0] ?? "";
  return `${nouns.slice(0, -1).join(", ")} and ${nouns[nouns.length - 1]}`;
}
