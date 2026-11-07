"use client";

import { useState } from "react";
import { toast } from "sonner";
import { IdIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { EmptyState } from "../../../dashboard/_components/EmptyState";
import TableCard from "../../_components/TableCard";
import { DataTable } from "../../_components/DataTable";
import { ModalField } from "../../_components/AdminModal";
import {
  ExpiredLinksNotice,
  KycMedia,
  formatDateTime,
  useLinksExpired,
} from "../../_components/review";
import {
  listStudentIdsForReview,
  reviewStudentId,
  type StudentIdReviewRow,
} from "@/lib/api/admin";
import { useReviewDecision, useReviewQueue } from "./useReviewQueue";
import {
  QueuePagination,
  QueueReviewModal,
  QueueSkeleton,
  QueueToolbar,
  ReviewStatusBadge,
} from "./QueueParts";

/** Student ID cards: always required before a space can collect. */
export function StudentIdQueue() {
  const { query, status, setStatus, page, setPage } = useReviewQueue<StudentIdReviewRow>(
    "student-ids",
    listStudentIdsForReview,
  );
  const [selected, setSelected] = useState<StudentIdReviewRow | null>(null);
  const rows = query.data?.data ?? [];
  // Prefer the latest copy, so "load fresh links" updates the open modal.
  const current = selected ? rows.find((r) => r.userId === selected.userId) ?? selected : null;
  const expired = useLinksExpired(query.dataUpdatedAt, rows[0]?.studentId.viewUrlExpiresInSeconds);

  const { decide, pending, pendingDecision } = useReviewDecision("student-ids", reviewStudentId, {
    onDone: (decision) => {
      toast.success(
        decision === "approved"
          ? `${current?.name ?? "The rep"}'s student ID approved.`
          : `Student ID sent back to ${current?.name ?? "the rep"}.`,
      );
      setSelected(null);
    },
  });

  return (
    <>
      <QueueToolbar status={status} onStatusChange={setStatus} pendingLabel="Waiting for review" />
      <TableCard
        title="Student ID cards"
        subtitle="Always required. Check the card shows the rep's name, school and matric number."
      >
        {query.isPending ? (
          <QueueSkeleton />
        ) : query.isError ? (
          <EmptyState
            icon={IdIcon}
            title="Couldn't load student IDs"
            description="Check your connection, then refresh."
            action={
              <Button variant="brand-outline" size="pill" onClick={() => void query.refetch()}>
                Try again
              </Button>
            }
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={IdIcon}
            title={status === "pending" ? "No student IDs to review" : `No ${status} student IDs`}
            description={status === "pending" ? "New uploads will show up here." : "Try another filter."}
          />
        ) : (
          <>
            <DataTable
              headers={[
                { label: "Rep" },
                { label: "Matric no." },
                { label: "Institution" },
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
                  <td className="p-4 text-ink-soft">{row.institution ?? "—"}</td>
                  <td className="whitespace-nowrap p-4 text-xs text-ink-soft">
                    {formatDateTime(row.studentId.uploadedAt)}
                  </td>
                  <td className="p-4">
                    <ReviewStatusBadge status={row.studentId.status} />
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
                      {row.studentId.status === "pending" ? "Review" : "View"}
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
          icon={IdIcon}
          title={current.name}
          description={`${current.email}${current.matricNo ? ` · ${current.matricNo}` : ""}`}
          decidable={current.studentId.status === "pending"}
          pendingDecision={pendingDecision}
          busy={pending}
          approveLabel="Approve ID"
          rejectLabel="Send back"
          reasonLabel="What should they fix? They'll see this."
          reasonPlaceholder="e.g. The photo is blurry — upload a clear photo showing your name and matric number."
          onDecide={(payload) => decide(current.userId, payload)}
          onClose={() => setSelected(null)}
        >
          {expired && (
            <ExpiredLinksNotice onRefresh={() => void query.refetch()} refreshing={query.isFetching} />
          )}
          <KycMedia
            url={current.studentId.viewUrl}
            mimeType={current.studentId.mimeType}
            label={`Student ID card for ${current.name}`}
            expired={expired}
            onRefresh={() => void query.refetch()}
            refreshing={query.isFetching}
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <ModalField label="Institution">{current.institution ?? "—"}</ModalField>
            <ModalField label="Uploaded">{formatDateTime(current.studentId.uploadedAt)}</ModalField>
            <ModalField label="Status">
              <ReviewStatusBadge status={current.studentId.status} />
            </ModalField>
            {current.studentId.reviewNote && (
              <ModalField label="Review note" className="sm:col-span-3">
                {current.studentId.reviewNote}
              </ModalField>
            )}
          </div>
        </QueueReviewModal>
      )}
    </>
  );
}
