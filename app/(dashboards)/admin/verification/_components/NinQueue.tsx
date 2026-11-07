"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon, UserSearch01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { EmptyState } from "../../../dashboard/_components/EmptyState";
import TableCard from "../../_components/TableCard";
import StatusBadge, { type StatusTone } from "../../_components/StatusBadge";
import { DataTable } from "../../_components/DataTable";
import { ModalField } from "../../_components/AdminModal";
import { formatDateTime, formatMatchScore } from "../../_components/review";
import { listNinReviews, reviewNin, type NinReviewRow } from "@/lib/api/admin";
import { useReviewDecision, useReviewQueue } from "./useReviewQueue";
import {
  QueuePagination,
  QueueReviewModal,
  QueueSkeleton,
  QueueToolbar,
  ReviewStatusBadge,
} from "./QueueParts";

function scoreTone(score: number | null): StatusTone {
  if (score === null) return "neutral";
  const pct = score <= 1 ? score * 100 : score;
  if (pct >= 85) return "ok";
  if (pct >= 60) return "warn";
  return "bad";
}

function CopyReference({ value }: { value: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Reference copied — search for it in the Didit console.");
    } catch {
      toast.error("Couldn't copy. Select the reference and copy it manually.");
    }
  };
  return (
    <span className="inline-flex max-w-full items-center gap-1.5">
      <code className="truncate rounded-md bg-paper px-1.5 py-0.5 font-mono text-[12px] text-ink select-all">
        {value}
      </code>
      <Button
        variant="brand-ghost"
        size="icon-xs"
        aria-label="Copy Didit reference"
        onClick={(e) => {
          e.stopPropagation();
          void copy();
        }}
      >
        <HugeiconsIcon icon={Copy01Icon} size={14} />
      </Button>
    </span>
  );
}

/**
 * NIN checks that only partly matched (the name or date of birth was close
 * but not exact). The NIN itself is never stored, so never shown — look the
 * check up in the Didit console by its reference.
 */
export function NinQueue({ required }: { required: boolean | null }) {
  const { query, status, setStatus, page, setPage } = useReviewQueue<NinReviewRow>("nin", listNinReviews);
  const [selected, setSelected] = useState<NinReviewRow | null>(null);
  const rows = query.data?.data ?? [];
  const current = selected ? rows.find((r) => r.userId === selected.userId) ?? selected : null;

  const { decide, pending, pendingDecision } = useReviewDecision("nin", reviewNin, {
    onDone: (decision) => {
      toast.success(
        decision === "approved"
          ? `${current?.name ?? "The rep"}'s identity verified.`
          : `${current?.name ?? "The rep"}'s NIN check rejected. They can try again.`,
      );
      setSelected(null);
    },
  });

  return (
    <>
      <QueueToolbar status={status} onStatusChange={setStatus} pendingLabel="Waiting for a decision" />
      <TableCard
        title="NIN partial matches"
        subtitle={
          required === false
            ? "The NIN check is off right now (see Settings); earlier partial matches still need a decision."
            : "NIMC found the NIN, but the name or date of birth only partly matched the rep's account."
        }
      >
        {query.isPending ? (
          <QueueSkeleton />
        ) : query.isError ? (
          <EmptyState
            icon={UserSearch01Icon}
            title="Couldn't load NIN reviews"
            description="Check your connection, then refresh."
            action={
              <Button variant="brand-outline" size="pill" onClick={() => void query.refetch()}>
                Try again
              </Button>
            }
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={UserSearch01Icon}
            title={status === "pending" ? "No partial matches to decide" : `No ${status} NIN reviews`}
            description={status === "pending" ? "Partial matches will show up here." : "Try another filter."}
          />
        ) : (
          <>
            <DataTable
              headers={[
                { label: "Rep" },
                { label: "Matric no." },
                { label: "Name match" },
                { label: "Submitted" },
                { label: "Didit reference" },
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
                  <td className="p-4">
                    <StatusBadge tone={scoreTone(row.nameMatchScore)}>
                      {formatMatchScore(row.nameMatchScore)}
                    </StatusBadge>
                  </td>
                  <td className="whitespace-nowrap p-4 text-xs text-ink-soft">
                    {formatDateTime(row.submittedAt)}
                  </td>
                  <td className="max-w-[200px] p-4">
                    {row.providerReference ? <CopyReference value={row.providerReference} /> : "—"}
                  </td>
                  <td className="p-4">
                    <ReviewStatusBadge status={row.reviewStatus} />
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
                      {row.reviewStatus === "pending" ? "Decide" : "View"}
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
          icon={UserSearch01Icon}
          title={current.name}
          description={current.email}
          decidable={current.reviewStatus === "pending"}
          pendingDecision={pendingDecision}
          busy={pending}
          approveLabel="Approve — verify identity"
          rejectLabel="Reject match"
          reasonLabel="Why are you rejecting it? The rep will see this, and it counts as a failed attempt."
          reasonPlaceholder="e.g. The name on your NIN record doesn't match your Duevy account name."
          onDecide={(payload) => decide(current.userId, payload)}
          onClose={() => setSelected(null)}
        >
          <p className="rounded-2xl bg-paper p-4 text-xs text-ink-soft">
            Open the check in the Didit console with the reference below and compare the NIMC record with the
            rep&apos;s account name. Approving verifies the rep&apos;s identity; rejecting counts as one of their
            three attempts. The NIN itself is never stored, so it isn&apos;t shown here.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <ModalField label="Account name">{current.name}</ModalField>
            <ModalField label="Matric number">{current.matricNo ?? "—"}</ModalField>
            <ModalField label="Institution">{current.institution ?? "—"}</ModalField>
            <ModalField label="Name match score">
              <StatusBadge tone={scoreTone(current.nameMatchScore)}>
                {formatMatchScore(current.nameMatchScore)}
              </StatusBadge>
            </ModalField>
            <ModalField label="Submitted">{formatDateTime(current.submittedAt)}</ModalField>
            <ModalField label="Student ID">
              <ReviewStatusBadge status={current.studentIdStatus} />
            </ModalField>
            <ModalField label="Didit reference" className="sm:col-span-2">
              {current.providerReference ? <CopyReference value={current.providerReference} /> : "—"}
            </ModalField>
            {current.reviewStatus !== "pending" && (
              <>
                <ModalField label="Reviewed">{formatDateTime(current.reviewedAt)}</ModalField>
                <ModalField label="Decision">
                  <ReviewStatusBadge status={current.reviewStatus} />
                </ModalField>
              </>
            )}
            {current.reviewNote && (
              <ModalField label="Review note" className="sm:col-span-2">
                {current.reviewNote}
              </ModalField>
            )}
          </div>
        </QueueReviewModal>
      )}
    </>
  );
}
