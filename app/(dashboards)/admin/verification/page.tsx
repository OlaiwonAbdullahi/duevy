"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import PageHeader from "../_components/PageHeader";
import RefreshButton from "../_components/RefreshButton";
import { Tabs } from "../_components/Tabs";
import { kycPolicyQueryKey, useKycPolicy } from "../_components/kycPolicy";
import { StudentIdQueue } from "./_components/StudentIdQueue";
import { LivenessQueue } from "./_components/LivenessQueue";
import { NinQueue } from "./_components/NinQueue";

type QueueTab = "student-ids" | "liveness" | "nin";
const TABS: QueueTab[] = ["student-ids", "liveness", "nin"];

function VerificationQueues() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const raw = params.get("tab");
  const tab: QueueTab = TABS.includes(raw as QueueTab) ? (raw as QueueTab) : "student-ids";
  const setTab = (next: QueueTab) => router.replace(`${pathname}?tab=${next}`, { scroll: false });

  const queryClient = useQueryClient();
  const fetching = useIsFetching({ queryKey: ["admin", "kyc-queue"] }) > 0;
  const policy = useKycPolicy();
  const p = policy.data;

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "kyc-queue"] });
    void queryClient.invalidateQueries({ queryKey: kycPolicyQueryKey });
  };

  const requiredLabel = (on: boolean | undefined) => (on === undefined ? "" : on ? " · required" : " · off");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Rep verification"
        description="Review what reps submit before their spaces can collect: student ID cards, face captures and NIN checks that only partly matched."
        right={<RefreshButton onClick={refresh} loading={fetching} />}
      />

      {p && (
        <p className="text-xs text-ink-soft">
          Current policy: student ID required · face capture {p.livenessRequired ? "required" : "off"} · NIN check{" "}
          {p.ninRequired ? "required" : "off"}.{" "}
          {p.leadRepsNotMeetingPolicy > 0 && (
            <>
              {p.leadRepsNotMeetingPolicy} space{p.leadRepsNotMeetingPolicy === 1 ? "" : "s"} can&apos;t collect yet
              because the lead rep hasn&apos;t passed every required check.{" "}
            </>
          )}
          <Link href="/admin/settings?tab=verification" className="font-semibold text-brand hover:underline">
            Change policy
          </Link>
        </p>
      )}

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "student-ids", label: "Student IDs" },
          { value: "liveness", label: `Face captures${requiredLabel(p?.livenessRequired)}` },
          { value: "nin", label: `NIN matches${requiredLabel(p?.ninRequired)}` },
        ]}
      />

      {tab === "student-ids" && <StudentIdQueue />}
      {tab === "liveness" && <LivenessQueue required={p ? p.livenessRequired : null} />}
      {tab === "nin" && <NinQueue required={p ? p.ninRequired : null} />}
    </div>
  );
}

export default function AdminVerificationPage() {
  return (
    <Suspense fallback={null}>
      <VerificationQueues />
    </Suspense>
  );
}
