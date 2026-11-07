"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FaceIdIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { EmptyState } from "../../../dashboard/_components/EmptyState";
import TableCard from "../../_components/TableCard";
import StatusBadge from "../../_components/StatusBadge";
import { DataTable } from "../../_components/DataTable";
import { ModalField } from "../../_components/AdminModal";
import {
  ExpiredLinksNotice,
  KycMedia,
  formatDateTime,
  useLinksExpired,
} from "../../_components/review";
import {
  listLivenessForReview,
  reviewLiveness,
  type LivenessReviewRow,
} from "@/lib/api/admin";
import { useReviewDecision, useReviewQueue } from "./useReviewQueue";
import {
  QueuePagination,
  QueueReviewModal,
  QueueSkeleton,
  QueueToolbar,
  ReviewStatusBadge,
} from "./QueueParts";

/** A rep verified before face capture existed: approved, but nothing on file. */
function isLegacyApproval(row: LivenessReviewRow) {
  return row.liveness.status === "approved" && !row.liveness.viewUrl && !row.liveness.mimeType;
}

function captureKindLabel(row: LivenessReviewRow) {
  if (isLegacyApproval(row)) return "None on file";
  if (row.liveness.kind === "video") return "Video";
  if (row.liveness.kind === "photo") return "Photo";
  return "—";
}

/**
 * Face captures (a photo or short video the rep took in the app), shown next
 * to their student ID card so the reviewer can see it's a live person and
 * the same face. Required while the policy says so.
 */
export function LivenessQueue({ required }: { required: boolean | null }) {
  const { query, status, setStatus, page, setPage } = useReviewQueue<LivenessReviewRow>(
    "liveness",
    listLivenessForReview,
  );
  const [selected, setSelected] = useState<LivenessReviewRow | null>(null);
  const rows = query.data?.data ?? [];
  const current = selected ? rows.find((r) => r.userId === selected.userId) ?? selected : null;
  const expired = useLinksExpired(query.dataUpdatedAt, rows[0]?.liveness.viewUrlExpiresInSeconds);
  const refresh = () => void query.refetch();

  const { decide, pending, pendingDecision } = useReviewDecision("liveness", reviewLiveness, {
    onDone: (decision) => {
      toast.success(
        decision === "approved"
          ? `${current?.name ?? "The rep"}'s face capture approved.`
          : `Asked ${current?.name ?? "the rep"} for a new face capture.`,
      );
      setSelected(null);
    },
  });

  return (
    <>
      <QueueToolbar status={status} onStatusChange={setStatus} pendingLabel="Waiting for review" />
      <TableCard
        title="Face captures"
        subtitle={
          required === false
            ? "Not required right now (see Settings), but reps can still submit one."
            : "Compare the capture with the student ID photo: a live person, and the same face."
        }
      >
        {query.isPending ? (
          <QueueSkeleton />
        ) : query.isError ? (
          <EmptyState
            icon={FaceIdIcon}
            title="Couldn't load face captures"
            description="Check your connection, then refresh."
            action={
              <Button variant="brand-outline" size="pill" onClick={refresh}>
                Try again
              </Button>
            }
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={FaceIdIcon}
            title={status === "pending" ? "No face captures to review" : `No ${status} face captures`}
            description={status === "pending" ? "New captures will show up here." : "Try another filter."}
          />
        ) : (
          <>
            <DataTable
              headers={[
                { label: "Rep" },
                { label: "Matric no." },
                { label: "Capture" },
                { label: "Student ID" },
                { label: "Uploaded" },
                { label: "Status" },
                { label: "", align: "right" },
              ]}
            >
              {rows.map((row) => (
                <tr
                  key={row.userId}
                  onClick={() => setSelected(row)}
                  className="cursor-pointer transition-colors hover:bg-paper/40"
                >
                  <td className="p-4">
                    <p className="font-semibold text-ink">{row.name}</p>
                    <p className="mt-0.5 text-xs text-ink-soft">{row.email}</p>
                  </td>
                  <td className="p-4 font-medium">{row.matricNo ?? "—"}</td>
                  <td className="p-4 text-ink-soft">{captureKindLabel(row)}</td>
                  <td className="p-4">
                    <ReviewStatusBadge status={row.studentId.status} />
                  </td>
                  <td className="whitespace-nowrap p-4 text-xs text-ink-soft">
                    {formatDateTime(row.liveness.uploadedAt)}
                  </td>
                  <td className="p-4">
                    {isLegacyApproval(row) ? (
                      <StatusBadge tone="ok">approved (legacy)</StatusBadge>
                    ) : (
                      <ReviewStatusBadge status={row.liveness.status} />
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      variant="brand-outline"
                      size="pill"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(row);
                      }}
                    >
                      {row.liveness.status === "pending" ? "Review" : "View"}
                    </Button>
                  </td>
                </tr>
              ))}
            </DataTable>
            <QueuePagination meta={query.data?.meta} page={page} setPage={setPage} fetching={query.isFetching} />
          </>
        )}
      </TableCard>

      {current && (
        <QueueReviewModal
          key={current.userId}
          icon={FaceIdIcon}
          title={current.name}
          description={[current.email, current.matricNo, current.institution].filter(Boolean).join(" · ")}
          decidable={current.liveness.status === "pending"}
          pendingDecision={pendingDecision}
          busy={pending}
          approveLabel="Approve capture"
          rejectLabel="Ask for a retake"
          reasonLabel="Why isn't it acceptable? They'll see this."
          reasonPlaceholder="e.g. Your face isn't clearly visible — retake it facing the camera in good light."
          onDecide={(payload) => decide(current.userId, payload)}
          onClose={() => setSelected(null)}
        >
          {isLegacyApproval(current) ? (
            <p className="rounded-2xl bg-paper p-4 text-sm text-ink-soft">
              {current.liveness.reviewNote ??
                "This rep was verified before face capture existed, so there's no capture on file."}{" "}
              Nothing to review; if they submit a capture later it will appear here as pending.
            </p>
          ) : (
            <>
              {expired && <ExpiredLinksNotice onRefresh={refresh} refreshing={query.isFetching} />}
              <div className="grid gap-3 sm:grid-cols-2">
                <figure className="min-w-0 space-y-1.5">
                  <figcaption className="text-[11px] font-semibold text-ink-soft">
                    Face capture{current.liveness.kind ? ` (${current.liveness.kind})` : ""}
                  </figcaption>
                  <KycMedia
                    url={current.liveness.viewUrl}
                    mimeType={current.liveness.mimeType}
                    kind={current.liveness.kind}
                    label={`Face capture for ${current.name}`}
                    expired={expired}
                    onRefresh={refresh}
                    refreshing={query.isFetching}
                  />
                </figure>
                <figure className="min-w-0 space-y-1.5">
                  <figcaption className="flex items-center gap-2 text-[11px] font-semibold text-ink-soft">
                    Student ID card <ReviewStatusBadge status={current.studentId.status} />
                  </figcaption>
                  <KycMedia
                    url={current.studentId.viewUrl}
                    mimeType={current.studentId.mimeType}
                    label={`Student ID card for ${current.name}`}
                    expired={expired}
                    onRefresh={refresh}
                    refreshing={query.isFetching}
                  />
                </figure>
              </div>
            </>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            <ModalField label="Uploaded">{formatDateTime(current.liveness.uploadedAt)}</ModalField>
            <ModalField label="Reviewed">{formatDateTime(current.liveness.reviewedAt)}</ModalField>
            <ModalField label="Status">
              <ReviewStatusBadge status={current.liveness.status} />
            </ModalField>
            {current.liveness.reviewNote && !isLegacyApproval(current) && (
              <ModalField label="Review note" className="sm:col-span-3">
                {current.liveness.reviewNote}
              </ModalField>
            )}
          </div>
        </QueueReviewModal>
      )}
    </>
  );
}
