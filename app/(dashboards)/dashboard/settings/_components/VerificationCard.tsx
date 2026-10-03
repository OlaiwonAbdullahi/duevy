"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IdIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { SettingsCard } from "./SettingsCard";
import { useRole } from "../../_components/role-context";
import { useRepSpace } from "../../_components/use-rep-space";
import { getKycStatus } from "@/lib/api/payouts";
import type { SpaceKycStatus } from "@/lib/api/types";

/** Rep-only: where the department's verification (KYC) stands, linking to /dashboard/kyc. */
export function VerificationCard() {
  const { isRep } = useRole();
  const repSpace = useRepSpace();
  const [status, setStatus] = useState<SpaceKycStatus | null>(null);

  useEffect(() => {
    if (!repSpace) return;
    let cancelled = false;
    getKycStatus(repSpace.id)
      .then((s) => {
        if (!cancelled) setStatus(s);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [repSpace]);

  if (!isRep || !repSpace) return null;

  const summary = !status
    ? "Checking your verification status…"
    : status.canWithdraw
      ? "Verified — your department can collect dues and withdraw."
      : status.canCollect
        ? "Your department can collect dues. Withdrawals open once the last checks finish."
        : "Not complete — students can't pay your dues until you're verified.";

  return (
    <SettingsCard
      icon={IdIcon}
      title="Verification"
      description="Your identity (NIN) and student ID, required to collect dues and withdraw."
      action={
        <Button variant="brand-outline" size="pill" asChild>
          <Link href="/dashboard/kyc">{status?.canWithdraw ? "View" : "Verify"}</Link>
        </Button>
      }
    >
      <p className="text-[13px] text-ink-soft">{summary}</p>
    </SettingsCard>
  );
}
