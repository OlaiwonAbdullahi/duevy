"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Clock01Icon, SignatureIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { UserAvatar } from "../../_components/UserAvatar";
import { fromKobo } from "../../_components/format";
import { formatDateTime } from "../../transactions/_components/data";
import type { Payout, Signatory } from "@/lib/api/types";
import { naira } from "./data";

/**
 * The withdrawal waiting for signatures: who has signed, who hasn't, and what
 * the viewer can do — approve (a signatory who hasn't signed), reject (any
 * signatory) or cancel (the requester).
 */
export function PendingApprovalCard({
  payout,
  signatories,
  requesterName,
  dueTitle,
  meId,
  onApprove,
  onReject,
}: {
  payout: Payout;
  signatories: Signatory[];
  requesterName: string | null;
  dueTitle: string | null;
  meId: string | undefined;
  onApprove: () => void;
  onReject: () => void;
}) {
  const approval = payout.approval;
  const signed = new Set(approval?.approvals.filter((a) => a.decision === "approved").map((a) => a.userId));
  const isSignatory = !!meId && signatories.some((s) => s.id === meId);
  const isRequester = !!meId && payout.requestedById === meId;
  const canApprove = isSignatory && !signed.has(meId!);
  const approved = approval?.approvedCount ?? 0;
  const required = approval?.required ?? 2;

  return (
    <section className="mt-4 rounded-3xl border border-amber-200 bg-amber-50/60 p-4 sm:mt-6 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700">
          <HugeiconsIcon icon={SignatureIcon} size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight text-ink">
            {naira(fromKobo(payout.amount))} withdrawal waiting for approval
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-soft">
            {requesterName ?? "A rep"} asked to send it to {payout.accountName ?? payout.account}
            {dueTitle ? ` from “${dueTitle}”` : ""}. {approved} of {required} approvals.
          </p>
          {payout.approvalExpiresAt && (
            <p className="mt-1 flex items-center gap-1 text-xs text-ink-soft">
              <HugeiconsIcon icon={Clock01Icon} size={13} />
              Cancelled automatically if not approved by {formatDateTime(payout.approvalExpiresAt)}.
            </p>
          )}
        </div>
      </div>

      <ul className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {signatories.map((s) => {
          const done = signed.has(s.id);
          return (
            <li key={s.id} className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-cloud bg-canvas px-3 py-2 sm:flex-1">
              <UserAvatar name={s.name} size={28} />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                {s.id === meId ? "You" : s.name}
              </span>
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  done ? "bg-cloud text-brand" : "bg-paper text-ink-soft"
                }`}
              >
                {done && <HugeiconsIcon icon={Tick02Icon} size={12} />}
                {done ? "Approved" : "Waiting"}
              </span>
            </li>
          );
        })}
      </ul>

      {(canApprove || isSignatory || isRequester) && (
        <div className="mt-4 flex gap-2.5 sm:justify-end">
          {(isSignatory || isRequester) && (
            <button
              type="button"
              onClick={onReject}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-cloud bg-canvas px-5 text-sm font-semibold text-ink transition-colors duration-300 hover:bg-rose-50 hover:text-rose-600 sm:flex-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={15} />
              {isRequester && !isSignatory ? "Cancel request" : "Reject"}
            </button>
          )}
          {canApprove && (
            <button
              type="button"
              onClick={onApprove}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright sm:flex-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <HugeiconsIcon icon={SignatureIcon} size={15} />
              Approve
            </button>
          )}
        </div>
      )}
    </section>
  );
}
