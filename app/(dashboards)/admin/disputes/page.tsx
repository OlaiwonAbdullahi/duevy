"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Megaphone01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { EmptyState } from "../../dashboard/_components/EmptyState";
import PageHeader from "../_components/PageHeader";
import TableCard from "../_components/TableCard";
import StatusBadge, { type StatusTone } from "../_components/StatusBadge";
import { DataTable } from "../_components/DataTable";
import { Toolbar, SearchInput, FilterSelect } from "../_components/Toolbar";
import { AdminModal, ModalField } from "../_components/AdminModal";
import { ApiError } from "@/lib/api/errors";
import type { Dispute, DisputeStatus, DisputeType } from "@/lib/api/types";
import { listAdminDisputes, claimDispute, resolveDispute } from "@/lib/api/admin";

const STATUS_TONES: Record<DisputeStatus, StatusTone> = {
  open: "warn",
  under_review: "neutral",
  resolved: "ok",
};

const STATUS_LABELS: Record<DisputeStatus, string> = {
  open: "Open",
  under_review: "Under review",
  resolved: "Resolved",
};

const TYPE_LABELS: Record<DisputeType, string> = {
  payment_not_reflecting: "Payment not reflecting",
  non_remittance: "Non-remittance by rep",
  refund_request: "Refund request",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  async function load() {
    setLoading(true);
    try {
      const { data } = await listAdminDisputes({
        q: debouncedSearch || undefined,
        status: statusFilter === "all" ? undefined : (statusFilter as DisputeStatus),
        perPage: 100,
      });
      setDisputes(data);
    } catch {
      toast.error("Couldn't load disputes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter]);

  const selected = useMemo(
    () => disputes.find((d) => d.id === selectedId) ?? null,
    [disputes, selectedId],
  );

  const patch = (id: string, next: Dispute) =>
    setDisputes((prev) => prev.map((d) => (d.id === id ? next : d)));

  async function claim(dispute: Dispute) {
    setBusy(true);
    try {
      const updated = await claimDispute(dispute.id);
      patch(dispute.id, updated);
      toast.success(`${dispute.id} is now under review.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't claim this dispute.");
    } finally {
      setBusy(false);
    }
  }

  async function resolve(dispute: Dispute, resolution: "upheld" | "rejected") {
    const note = window
      .prompt(
        resolution === "upheld"
          ? `Note for upholding ${dispute.id}?`
          : `Reason for rejecting ${dispute.id}?`,
      )
      ?.trim();
    if (!note) return;
    setBusy(true);
    try {
      const updated = await resolveDispute(dispute.id, { resolution, note });
      patch(dispute.id, updated);
      toast.success(`${dispute.id} resolved — ${resolution}.`);
      setSelectedId(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't resolve this dispute.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Disputes"
        description="Reported payment issues, ready to claim and settle."
      />

      <Toolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by ticket, claimant or department…"
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          label="Filter by status"
          options={[
            { value: "all", label: "All statuses" },
            { value: "open", label: "Open" },
            { value: "under_review", label: "Under review" },
            { value: "resolved", label: "Resolved" },
          ]}
        />
      </Toolbar>

      <TableCard title="Tickets" subtitle="Click a row to review and settle">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-paper" />
            ))}
          </div>
        ) : disputes.length === 0 ? (
          <EmptyState
            icon={Megaphone01Icon}
            title="No disputes match"
            description="Try a different search or clear the filters."
          />
        ) : (
          <DataTable
            headers={[
              { label: "Ticket" },
              { label: "Claimant" },
              { label: "Department" },
              { label: "Issue" },
              { label: "Age" },
              { label: "Status" },
            ]}
          >
            {disputes.map((d) => (
              <tr
                key={d.id}
                onClick={() => setSelectedId(d.id)}
                className="cursor-pointer transition-colors hover:bg-paper/40"
              >
                <td className="p-4 font-mono text-xs font-semibold text-ink">{d.id}</td>
                <td className="p-4">
                  <p className="font-semibold text-ink">{d.openedBy}</p>
                  {d.email && <p className="mt-0.5 text-xs text-ink-soft">{d.email}</p>}
                </td>
                <td className="p-4 font-medium">{d.department ?? "—"}</td>
                <td className="p-4">{TYPE_LABELS[d.type]}</td>
                <td className="p-4">
                  <StatusBadge tone={d.breached ? "bad" : "neutral"}>
                    {d.ageDays}d of {d.slaDays}d SLA
                  </StatusBadge>
                </td>
                <td className="p-4">
                  <StatusBadge tone={STATUS_TONES[d.status]}>
                    {STATUS_LABELS[d.status]}
                  </StatusBadge>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </TableCard>

      {selected && (
        <AdminModal
          wide
          icon={Megaphone01Icon}
          title={`Ticket ${selected.id}`}
          description={`${TYPE_LABELS[selected.type]}${selected.department ? ` · ${selected.department}` : ""}`}
          onClose={() => setSelectedId(null)}
          footer={
            selected.status === "open" ? (
              <Button variant="brand" size="pill" disabled={busy} onClick={() => claim(selected)}>
                Claim ticket
              </Button>
            ) : selected.status === "under_review" ? (
              <>
                <Button
                  variant="danger-outline"
                  size="pill"
                  disabled={busy}
                  onClick={() => resolve(selected, "rejected")}
                >
                  Reject
                </Button>
                <Button
                  variant="brand"
                  size="pill"
                  disabled={busy}
                  onClick={() => resolve(selected, "upheld")}
                >
                  Uphold
                </Button>
              </>
            ) : undefined
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <ModalField label="Claimant">
              {selected.openedBy}
              {selected.email && (
                <p className="mt-0.5 text-xs font-normal text-ink-soft">{selected.email}</p>
              )}
            </ModalField>
            <ModalField label="SLA">
              {selected.ageDays} of {selected.slaDays} days
              {selected.breached && (
                <span className="ml-2">
                  <StatusBadge tone="bad">Breached</StatusBadge>
                </span>
              )}
            </ModalField>
            <ModalField label="Opened">{formatDate(selected.createdAt)}</ModalField>
            {selected.txnReference && (
              <ModalField label="Transaction reference">
                <span className="font-mono">{selected.txnReference}</span>
              </ModalField>
            )}
          </div>

          <p className="mt-5 mb-2 text-[11px] font-semibold text-ink-soft">Description</p>
          <p className="rounded-2xl border border-cloud bg-canvas p-4 text-[13px] leading-6 text-ink">
            {selected.description}
          </p>

          {selected.resolution && (
            <>
              <p className="mt-5 mb-2 text-[11px] font-semibold text-ink-soft">Resolution</p>
              <p className="rounded-2xl border border-cloud bg-paper/30 p-4 text-[13px] leading-6 text-ink">
                {selected.resolution}
              </p>
            </>
          )}
        </AdminModal>
      )}
    </div>
  );
}
