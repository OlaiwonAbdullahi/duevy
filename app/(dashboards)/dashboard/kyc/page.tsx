"use client";

import Link from "next/link";
import { Building03Icon } from "@hugeicons/core-free-icons";
import { KycCard } from "./_components/KycCard";
import { useRepSpace } from "../_components/use-rep-space";
import { useRole } from "../_components/role-context";
import { EmptyState } from "../_components/EmptyState";

/**
 * Rep verification (KYC). Identity is checked by Bachs (NIN + date of birth)
 * and the student ID card by a Duevy admin. Rep applicants do this before
 * their department exists (it's part of the application); approved reps can
 * come back here when something needs attention.
 */
export default function KycPage() {
  const repSpace = useRepSpace();
  const { isPendingRep } = useRole();

  return (
    <div className="mx-auto max-w-2xl">
      <header>
        <span className="mb-2 inline-block rounded-full bg-cloud px-3 py-1 text-[11px] font-semibold text-brand">
          {isPendingRep ? "Rep application" : "Rep tools"}
        </span>
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">Verification</h1>
        <p className="mt-1 text-[13px] text-ink-soft">
          {isPendingRep
            ? "Verify your identity and student ID. Once both pass, an admin reviews your application."
            : "Verify your identity and student ID so your department can collect dues and withdraw."}
        </p>
      </header>

      <div className="mt-6">
        {repSpace ? (
          <KycCard spaceId={repSpace.id} isLead={repSpace.membership !== "co"} />
        ) : isPendingRep ? (
          <KycCard isLead />
        ) : (
          <EmptyState
            icon={Building03Icon}
            title="No department yet"
            description="Verification is part of a rep application."
          />
        )}
      </div>

      {!isPendingRep && (
        <p className="mt-4 text-center text-xs text-ink-soft">
          Once verified, manage withdrawals on the{" "}
          <Link href="/dashboard/payout" className="font-medium text-brand hover:underline">
            Payout
          </Link>{" "}
          page.
        </p>
      )}
    </div>
  );
}
