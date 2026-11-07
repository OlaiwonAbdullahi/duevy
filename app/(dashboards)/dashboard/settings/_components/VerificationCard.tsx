"use client";

import Link from "next/link";
import { IdIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { SettingsCard } from "./SettingsCard";
import { useRole } from "../../_components/role-context";
import { useRepSpace } from "../../_components/use-rep-space";
import { useKycStatus } from "@/lib/api/queries";
import { joinNouns, kycChecks, kycOwesSomething } from "@/lib/kyc";

/** Rep-only: where the department's verification (KYC) stands, linking to /dashboard/kyc. */
export function VerificationCard() {
  const { isRep } = useRole();
  const repSpace = useRepSpace();
  const status = useKycStatus(repSpace?.id, { enabled: !!repSpace }).data ?? null;

  if (!isRep || !repSpace) return null;

  const mine = status?.mine ?? null;
  const pending = mine ? kycChecks(mine).filter((c) => c.state === "pending") : [];
  const required = mine ? kycChecks(mine) : [];

  const summary = !status || !mine
    ? "Checking your verification status…"
    : mine.canCollect
      ? status.canCollect
        ? "Verified — your department can collect dues and withdraw."
        : "You're verified. Your department can collect once its lead rep is verified too."
      : kycOwesSomething(mine)
        ? "Not complete — students can't pay your dues until you're verified."
        : `In review — a Duevy admin is checking ${joinNouns(pending)}.`;

  const description = required.length
    ? `${joinNouns(required).replace(/^your /, "Your ")}, required to collect dues and withdraw.`
    : "Your student ID and face capture, required to collect dues and withdraw.";

  return (
    <SettingsCard
      icon={IdIcon}
      title="Verification"
      description={description}
      action={
        <Button variant="brand-outline" size="pill" asChild>
          <Link href="/dashboard/kyc">{mine?.canCollect ? "View" : "Verify"}</Link>
        </Button>
      }
    >
      <p className="text-[13px] text-ink-soft">{summary}</p>
    </SettingsCard>
  );
}
