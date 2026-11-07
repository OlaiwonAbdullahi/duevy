"use client";

import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert01Icon,
  Clock01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { useKycStatus } from "@/lib/api/queries";
import type { KycState, SpaceKycStatus } from "@/lib/api/types";
import { joinNouns, kycChecks, kycLockedUntil, type KycCheckKey } from "@/lib/kyc";

type Notice = { tone: "action" | "waiting"; title: string; body: string; cta?: string };

/** What the rep has to do about their own checks, most urgent first; null once nothing is theirs to do. */
function ownNotice(kyc: KycState): Notice | null {
  if (kyc.canCollect) return null;
  const checks = kycChecks(kyc);
  const locked = kycLockedUntil(kyc);

  const rejected = checks.find((c) => c.state === "rejected" && !(c.key === "nin" && locked));
  if (rejected) {
    const copy: Record<KycCheckKey, { title: string; body: string; cta: string }> = {
      studentId: {
        title: "Your student ID wasn't accepted",
        body: "Upload a clearer photo or scan of your student ID card.",
        cta: "Upload again",
      },
      liveness: {
        title: "Your face capture wasn't accepted",
        body: "Take a new photo of your face in good light.",
        cta: "Retake",
      },
      nin: {
        title: "Your NIN couldn't be verified",
        body: "Check your NIN and date of birth, then try again.",
        cta: "Try again",
      },
    };
    const c = copy[rejected.key];
    return { tone: "action", title: c.title, body: rejected.note ?? c.body, cta: c.cta };
  }

  const todo = checks.filter((c) => c.state === "todo" && !(c.key === "nin" && locked));
  if (todo.length > 0) {
    const nothingSent = checks.every((c) => c.state === "todo");
    return {
      tone: "action",
      title: nothingSent ? "Verify to start collecting" : "Finish verification to start collecting",
      body: nothingSent
        ? `Students can't pay your dues until you verify. You'll need ${joinNouns(todo)}. It takes about two minutes.`
        : `Still to do: ${joinNouns(todo)}.`,
      cta: nothingSent ? "Start verification" : "Continue",
    };
  }

  if (locked) {
    return {
      tone: "waiting",
      title: "NIN checks are paused",
      body: "Too many failed attempts. You can try again in 24 hours.",
    };
  }

  const pending = checks.filter((c) => c.state === "pending");
  return {
    tone: "waiting",
    title: "Verification in review",
    body: `A Duevy admin is reviewing ${joinNouns(pending)}. Dues can be published once it's approved.`,
  };
}

/**
 * What's still blocking the space. A space collects once its lead rep passes
 * every check the KYC policy requires (`canCollect`); each rep also verifies
 * themselves before they can act for it.
 */
function noticeFor(s: SpaceKycStatus, isLead: boolean): Notice | null {
  if (isLead) return ownNotice(s.mine);
  const own = ownNotice(s.mine);
  if (own?.tone === "action") return own;
  if (!s.canCollect) {
    return {
      tone: "waiting",
      title: "Your department can't collect payments yet",
      body: "Your lead rep needs to finish verification before dues can be published and paid.",
    };
  }
  return own;
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
