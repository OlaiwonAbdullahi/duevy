"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert01Icon,
  Clock01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { useKycStatus } from "@/lib/api/queries";
import type { SpaceKycStatus } from "@/lib/api/types";

type Notice = { tone: "action" | "waiting"; title: string; body: string; cta?: string };

/**
 * What's still blocking the space, in the order the rep has to deal with it.
 * A space collects once Bachs verifies the lead's identity (NIN) AND an admin
 * approves their student ID; withdrawals can additionally wait on Bachs.
 */
function noticeFor(s: SpaceKycStatus, isLead: boolean): Notice | null {
  if (s.canWithdraw) return null;

  if (!isLead) {
    return s.canCollect
      ? null
      : {
          tone: "waiting",
          title: "Your department can't collect payments yet",
          body: "Your lead rep needs to finish verification before dues can be published and paid.",
        };
  }

  const identityStarted = s.kycStatus === "pending" && !!s.providerReference;
  const locked = s.retryLockedUntil && new Date(s.retryLockedUntil) > new Date();

  if (s.kycStatus === "rejected") {
    return {
      tone: "action",
      title: "Identity verification failed",
      body: locked
        ? "Too many attempts — you can try again in 24 hours."
        : s.rejectionReason ?? "Check your NIN and date of birth, then try again.",
      cta: locked ? undefined : "Try again",
    };
  }
  if (s.kycStatus !== "verified" && !identityStarted) {
    return {
      tone: "action",
      title: "Verify your identity to start collecting",
      body: "Students can't pay your dues until you verify with your NIN and upload your student ID. It takes about two minutes.",
      cta: "Start verification",
    };
  }
  if (s.studentId.status === "rejected") {
    return {
      tone: "action",
      title: "Your student ID was rejected",
      body: s.studentId.reviewNote ?? "Upload a clearer photo of your student ID card.",
      cta: "Upload again",
    };
  }
  if (s.studentId.status === null) {
    return {
      tone: "action",
      title: "Upload your student ID",
      body: "Your space can collect once an admin approves your student ID card.",
      cta: "Upload ID",
    };
  }
  if (s.requirementsDue.length > 0) {
    return {
      tone: "action",
      title: "Our payment partner needs more information",
      body: "Send the requested document so withdrawals can open.",
      cta: "See what's needed",
    };
  }
  if (!s.canCollect) {
    return {
      tone: "waiting",
      title: "Verification in review",
      body:
        s.kycStatus !== "verified"
          ? "We're confirming your identity. Dues can be published once it's approved."
          : "An admin is reviewing your student ID. Dues can be published once it's approved.",
    };
  }
  return {
    tone: "waiting",
    title: "Withdrawals open soon",
    body: "You can collect dues now. Withdrawals unlock once our payment partner finishes its checks.",
  };
}

export function KycBanner({ spaceId, isLead }: { spaceId: string; isLead: boolean }) {
  const status = useKycStatus(spaceId).data ?? null;

  const notice = status ? noticeFor(status, isLead) : null;
  if (!notice) return null;

  const action = notice.tone === "action";
  return (
    <div
      className={`mt-6 flex flex-col gap-4 rounded-3xl border p-5 sm:flex-row sm:items-center ${
        action ? "border-amber-200 bg-amber-50" : "border-cloud bg-canvas"
      }`}
    >
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
          action ? "bg-amber-100 text-amber-700" : "bg-cloud text-brand"
        }`}
      >
        <HugeiconsIcon icon={action ? Alert01Icon : Clock01Icon} size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{notice.title}</p>
        <p className="mt-0.5 text-xs text-ink-soft">{notice.body}</p>
      </div>
      {notice.cta && (
        <Link
          href="/dashboard/kyc"
          className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-brand px-5 text-[13px] font-semibold text-white transition-colors duration-300 hover:bg-brand-bright cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          {notice.cta}
          <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
        </Link>
      )}
    </div>
  );
}
