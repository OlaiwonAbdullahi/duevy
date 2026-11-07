"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { DocumentReviewStatus } from "@/lib/api/types";
import type { ApiMeta, ReviewDecision } from "@/lib/api/admin";
import type { HugeIcon } from "../../../dashboard/_components/nav-config";
import { AdminModal } from "../../_components/AdminModal";
import StatusBadge, { type StatusTone } from "../../_components/StatusBadge";
import { FilterSelect, Toolbar } from "../../_components/Toolbar";
import { Pagination } from "../../_components/Pagination";
import { ReasonForm, Spinner } from "../../_components/review";

export const REVIEW_TONES: Record<DocumentReviewStatus, StatusTone> = {
  pending: "warn",
  approved: "ok",
  rejected: "bad",
};

export function ReviewStatusBadge({ status }: { status: DocumentReviewStatus | null }) {
  if (!status) return <StatusBadge>none</StatusBadge>;
  return <StatusBadge tone={REVIEW_TONES[status]}>{status}</StatusBadge>;
}

/** Status filter for a queue (the API defaults to pending). */
export function QueueToolbar({
  status,
  onStatusChange,
  pendingLabel,
}: {
  status: DocumentReviewStatus;
  onStatusChange: (next: DocumentReviewStatus) => void;
  pendingLabel: string;
}) {
  return (
    <Toolbar>
      <FilterSelect
        value={status}
        onChange={(v) => onStatusChange(v as DocumentReviewStatus)}
        label="Filter by review status"
        options={[
          { value: "pending", label: pendingLabel },
          { value: "approved", label: "Approved" },
          { value: "rejected", label: "Rejected" },
        ]}
      />
    </Toolbar>
  );
}

export function QueueSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-xl bg-paper" />
      ))}
    </div>
  );
}

export function QueuePagination({
  meta,
  page,
  setPage,
  fetching,
}: {
  meta: ApiMeta | undefined;
  page: number;
  setPage: (next: number) => void;
  fetching: boolean;
}) {
  return <Pagination meta={meta} page={page} onPageChange={setPage} disabled={fetching} />;
}

/**
 * The review modal shared by the three queues: content, then approve /
 * reject-with-a-required-note while the row is pending. Locked while a
 * decision is saving.
 */
export function QueueReviewModal({
  icon,
  title,
  description,
  decidable,
  pendingDecision,
  busy,
  approveLabel,
  rejectLabel,
  reasonLabel,
  reasonPlaceholder,
  onDecide,
  onClose,
  children,
}: {
  icon: HugeIcon;
  title: string;
  description?: string;
  /** Pending rows can be decided; decided ones are read-only. */
  decidable: boolean;
  pendingDecision: ReviewDecision["decision"] | null;
  busy: boolean;
  approveLabel: string;
  rejectLabel: string;
  reasonLabel: string;
  reasonPlaceholder: string;
  /** Resolves `true` once saved, so the note form can close. */
  onDecide: (payload: ReviewDecision) => Promise<boolean>;
  onClose: () => void;
  children: ReactNode;
}) {
  const [rejecting, setRejecting] = useState(false);
  return (
    <AdminModal
      wide
      icon={icon}
      title={title}
      description={description}
      onClose={() => !busy && onClose()}
      footer={
        decidable && !rejecting ? (
          <>
            <Button variant="danger-outline" size="pill" disabled={busy} onClick={() => setRejecting(true)}>
              {rejectLabel}
            </Button>
            <Button
              variant="brand"
              size="pill"
              disabled={busy}
              aria-busy={pendingDecision === "approved" || undefined}
              onClick={() => void onDecide({ decision: "approved" })}
            >
              {pendingDecision === "approved" && <Spinner />}
              {pendingDecision === "approved" ? "Approving…" : approveLabel}
            </Button>
          </>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {children}
        {decidable && rejecting && (
          <ReasonForm
            label={reasonLabel}
            placeholder={reasonPlaceholder}
            confirmLabel={rejectLabel}
            busyLabel="Saving…"
            busy={busy}
            loading={pendingDecision === "rejected"}
            onCancel={() => setRejecting(false)}
            onConfirm={async (note) => {
              if (await onDecide({ decision: "rejected", note })) setRejecting(false);
            }}
          />
        )}
      </div>
    </AdminModal>
  );
}
