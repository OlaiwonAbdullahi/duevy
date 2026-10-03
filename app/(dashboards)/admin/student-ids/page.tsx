"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { IdIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { EmptyState } from "../../dashboard/_components/EmptyState";
import PageHeader from "../_components/PageHeader";
import TableCard from "../_components/TableCard";
import StatusBadge, { type StatusTone } from "../_components/StatusBadge";
import { DataTable } from "../_components/DataTable";
import { Tabs } from "../_components/Tabs";
import { AdminModal, ModalField } from "../_components/AdminModal";
import {
  listStudentIdsForReview,
  reviewStudentId,
  type StudentIdReviewRow,
} from "@/lib/api/admin";
import { ApiError } from "@/lib/api/errors";
import type { KycStatus, StudentIdStatus } from "@/lib/api/types";

const STATUS_TONES: Record<StudentIdStatus, StatusTone> = {
  pending: "warn",
  approved: "ok",
  rejected: "bad",
};

const KYC_TONES: Record<KycStatus, StatusTone> = {
  verified: "ok",
  pending: "warn",
  rejected: "bad",
  unverified: "neutral",
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Review queue for reps' student ID cards. Bachs verifies a rep's identity
 * (NIN); this confirms they're a student. A space can only collect once its
 * lead rep's card is approved here. View links are signed and short-lived, so
 * the list is re-fetched when a card is opened.
 */
export default function AdminStudentIdsPage() {
  const [status, setStatus] = useState<StudentIdStatus>("pending");
  const [rows, setRows] = useState<StudentIdReviewRow[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StudentIdReviewRow | null>(null);
  const [linkFetchedAt, setLinkFetchedAt] = useState(0);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function load(next = status) {
    setLoading(true);
    try {
      const page = await listStudentIdsForReview({ status: next, perPage: 100 });
      setRows(page.data);
      setTotal(page.meta?.total ?? page.data.length);
      setLinkFetchedAt(Date.now());
      return page.data;
    } catch {
      toast.error("Couldn't load student IDs.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const open = async (row: StudentIdReviewRow) => {
    setNote("");
    // Signed links expire; refresh the list if this one may have.
    const ttlMs = row.studentId.viewUrlExpiresInSeconds * 1000;
    if (Date.now() - linkFetchedAt > ttlMs - 60_000) {
      const fresh = await load();
      setSelected(fresh?.find((r) => r.userId === row.userId) ?? row);
    } else {
      setSelected(row);
    }
  };

  const decide = async (decision: "approved" | "rejected") => {
    if (!selected) return;
    const trimmed = note.trim();
    if (decision === "rejected" && !trimmed) {
      toast.error("Add a reason so the rep knows what to fix.");
      return;
    }
    setBusy(true);
    try {
      await reviewStudentId(selected.userId, { decision, note: trimmed || undefined });
      toast.success(`Student ID ${decision} for ${selected.name}.`, {
        description: "The rep has been notified.",
      });
      setRows((list) => list.filter((r) => r.userId !== selected.userId));
      setTotal((t) => (t === null ? t : Math.max(0, t - 1)));
      setSelected(null);
    } catch (err) {
      toast.error(
        err instanceof ApiError && err.code === "NOT_PENDING"
          ? "This card was already reviewed."
          : err instanceof ApiError
            ? err.message
            : "Couldn't save the review.",
      );
    } finally {
      setBusy(false);
    }
  };

  const doc = selected?.studentId;
  const isPdf = doc?.mimeType === "application/pdf";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Student IDs"
        description="Confirm each rep is a student. Their space can only collect once its lead rep's card is approved."
      />

      <Tabs
        value={status}
        onChange={setStatus}
        items={[
          { value: "pending", label: "Awaiting review" },
          { value: "approved", label: "Approved" },
          { value: "rejected", label: "Rejected" },
        ]}
      />

      <TableCard
        title={status === "pending" ? "Awaiting review" : status === "approved" ? "Approved" : "Rejected"}
        subtitle={
          total === null ? undefined : `${total} card${total === 1 ? "" : "s"} · oldest first · click a row to view`
        }
      >
        {loading && rows.length === 0 ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-paper" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={IdIcon}
            title={status === "pending" ? "Nothing to review" : "No cards here"}
            description={
              status === "pending"
                ? "New student ID cards show up here when reps submit verification."
                : "Reviewed cards will show up here."
            }
          />
        ) : (
          <DataTable
            headers={[
              { label: "Rep" },
              { label: "Matric no." },
              { label: "Identity (NIN)" },
              { label: status === "pending" ? "Uploaded" : "Reviewed" },
              { label: "Card" },
            ]}
          >
            {rows.map((r) => (
              <tr
                key={r.userId}
                onClick={() => void open(r)}
                className="cursor-pointer transition-colors hover:bg-paper/40"
              >
                <td className="p-4">
                  <p className="font-semibold text-ink">{r.name}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {r.email}
                    {r.institution ? ` · ${r.institution}` : ""}
                  </p>
                </td>
                <td className="p-4 tabular-nums text-ink">{r.matricNo ?? "—"}</td>
                <td className="p-4">
                  <StatusBadge tone={KYC_TONES[r.kycStatus]}>{r.kycStatus}</StatusBadge>
                </td>
                <td className="p-4 text-xs text-ink-soft">
                  {formatDate(status === "pending" ? r.studentId.uploadedAt : r.studentId.reviewedAt)}
                </td>
                <td className="p-4">
                  <StatusBadge tone={STATUS_TONES[r.studentId.status]}>{r.studentId.status}</StatusBadge>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </TableCard>

      {selected && doc && (
        <AdminModal
          wide
          icon={IdIcon}
          title={selected.name}
          description={selected.email}
          onClose={() => setSelected(null)}
          footer={
            doc.status === "pending" ? (
              <>
                <Button
                  variant="danger-outline"
                  size="pill"
                  disabled={busy}
                  onClick={() => decide("rejected")}
                >
                  Reject
                </Button>
                <Button variant="brand" size="pill" disabled={busy} onClick={() => decide("approved")}>
                  Approve
                </Button>
              </>
            ) : undefined
          }
        >
          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-cloud bg-paper">
              {!doc.viewUrl ? (
                <p className="p-6 text-center text-sm text-ink-soft">No file on record.</p>
              ) : isPdf ? (
                <iframe src={doc.viewUrl} title="Student ID card" className="h-[420px] w-full" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- signed, short-lived URL; not optimisable
                <img
                  src={doc.viewUrl}
                  alt={`Student ID card for ${selected.name}`}
                  className="max-h-[420px] w-full object-contain"
                />
              )}
            </div>
            {doc.viewUrl && (
              <a
                href={doc.viewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-xs font-semibold text-brand hover:underline"
              >
                Open full size
              </a>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <ModalField label="Matric number">{selected.matricNo ?? "—"}</ModalField>
              <ModalField label="Institution">{selected.institution ?? "—"}</ModalField>
              <ModalField label="Identity (NIN)">
                <StatusBadge tone={KYC_TONES[selected.kycStatus]}>{selected.kycStatus}</StatusBadge>
              </ModalField>
              <ModalField label="Uploaded">{formatDate(doc.uploadedAt)}</ModalField>
              {doc.status !== "pending" && (
                <>
                  <ModalField label="Reviewed">{formatDate(doc.reviewedAt)}</ModalField>
                  <ModalField label="Note">{doc.reviewNote ?? "—"}</ModalField>
                </>
              )}
            </div>

            {doc.status === "pending" && (
              <div>
                <label htmlFor="review-note" className="text-xs font-medium text-ink-soft">
                  Note to the rep (required to reject)
                </label>
                <textarea
                  id="review-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 500))}
                  rows={3}
                  placeholder="e.g. The photo is blurry. Upload a clear photo showing your name and matric number."
                  className="mt-1.5 w-full rounded-xl border border-cloud bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-brand focus:ring-2 focus:ring-brand/15"
                />
              </div>
            )}
          </div>
        </AdminModal>
      )}
    </div>
  );
}
