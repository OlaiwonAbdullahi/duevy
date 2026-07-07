"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { UserGroup03Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { EmptyState } from "../../dashboard/_components/EmptyState";
import PageHeader from "../_components/PageHeader";
import TableCard from "../_components/TableCard";
import StatusBadge, { type StatusTone } from "../_components/StatusBadge";
import { DataTable } from "../_components/DataTable";
import { Toolbar, SearchInput, FilterSelect } from "../_components/Toolbar";
import { RowActions } from "../_components/RowActions";
import { AdminModal, ModalField } from "../_components/AdminModal";
import { naira, formatPercent01 } from "../_components/format";
import { mockDepartments, mockReps, type Rep } from "../_components/MockData";

const STATUS_TONES: Record<Rep["status"], StatusTone> = {
  active: "ok",
  pending: "warn",
  suspended: "bad",
};

const VERIFICATION_TONES: Record<Rep["verification"], StatusTone> = {
  verified: "ok",
  pending: "warn",
  unverified: "neutral",
};

function rateTone(rate: number): StatusTone {
  if (rate >= 0.85) return "ok";
  if (rate >= 0.5) return "warn";
  return "bad";
}

function departmentNames(rep: Rep) {
  return rep.departmentIds
    .map((id) => mockDepartments.find((d) => d.id === id)?.name)
    .filter(Boolean) as string[];
}

export default function AdminRepsPage() {
  const [reps, setReps] = useState<Rep[]>(mockReps);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reps.filter(
      (r) =>
        (q === "" ||
          r.name.toLowerCase().includes(q) ||
          departmentNames(r).some((n) => n.toLowerCase().includes(q))) &&
        (statusFilter === "all" || r.status === statusFilter),
    );
  }, [reps, search, statusFilter]);

  const selected = reps.find((r) => r.id === selectedId) ?? null;

  const setStatus = (id: string, status: Rep["status"]) => {
    setReps((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    const rep = reps.find((r) => r.id === id);
    if (rep) toast(`${rep.name} is now ${status}.`);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Reps"
        description="Every rep's spaces, held float and collection performance."
      />

      <Toolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by rep or space…"
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          label="Filter by status"
          options={[
            { value: "all", label: "All statuses" },
            { value: "active", label: "Active" },
            { value: "pending", label: "Pending" },
            { value: "suspended", label: "Suspended" },
          ]}
        />
      </Toolbar>

      <TableCard title="Reps" subtitle="Click a row for the full profile">
        {filtered.length === 0 ? (
          <EmptyState
            icon={UserGroup03Icon}
            title="No reps match"
            description="Try a different search or clear the filters."
          />
        ) : (
          <DataTable
            headers={[
              { label: "Rep" },
              { label: "Spaces" },
              { label: "Status" },
              { label: "Verification" },
              { label: "Float held" },
              { label: "Collection rate" },
              { label: "", align: "right" },
            ]}
          >
            {filtered.map((r) => (
              <tr
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                className="cursor-pointer transition-colors hover:bg-paper/40"
              >
                <td className="p-4 font-semibold text-ink">{r.name}</td>
                <td className="p-4 font-medium">{departmentNames(r).join(", ")}</td>
                <td className="p-4">
                  <StatusBadge tone={STATUS_TONES[r.status]}>{r.status}</StatusBadge>
                </td>
                <td className="p-4">
                  <StatusBadge tone={VERIFICATION_TONES[r.verification]}>
                    {r.verification}
                  </StatusBadge>
                </td>
                <td className="p-4 font-semibold">{naira(r.heldAmount)}</td>
                <td className="p-4">
                  <StatusBadge tone={rateTone(r.collectionRate)}>
                    {formatPercent01(r.collectionRate)}
                  </StatusBadge>
                </td>
                <td className="p-4 text-right">
                  <RowActions
                    actions={
                      r.status === "suspended"
                        ? [{ label: "Reinstate", onSelect: () => setStatus(r.id, "active") }]
                        : [
                            {
                              label: "Suspend",
                              tone: "danger",
                              onSelect: () => setStatus(r.id, "suspended"),
                            },
                          ]
                    }
                  />
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </TableCard>

      {selected && (
        <AdminModal
          wide
          icon={UserGroup03Icon}
          title={selected.name}
          description={departmentNames(selected).join(" · ")}
          onClose={() => setSelectedId(null)}
          footer={
            selected.status === "suspended" ? (
              <Button
                variant="brand"
                size="pill"
                onClick={() => setStatus(selected.id, "active")}
              >
                Reinstate rep
              </Button>
            ) : (
              <Button
                variant="danger-outline"
                size="pill"
                onClick={() => setStatus(selected.id, "suspended")}
              >
                Suspend rep
              </Button>
            )
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <ModalField label="Status">
              <StatusBadge tone={STATUS_TONES[selected.status]}>
                {selected.status}
              </StatusBadge>
            </ModalField>
            <ModalField label="Verification">
              <StatusBadge tone={VERIFICATION_TONES[selected.verification]}>
                {selected.verification}
              </StatusBadge>
            </ModalField>
            <ModalField label="Float held">{naira(selected.heldAmount)}</ModalField>
            <ModalField label="Uncollected dues">
              {naira(selected.uncollectedAmount)}
            </ModalField>
            <ModalField label="Collection rate" className="sm:col-span-2">
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 rounded-full bg-cloud">
                  <div
                    className="h-2 rounded-full bg-brand"
                    style={{ width: `${Math.round(selected.collectionRate * 100)}%` }}
                  />
                </div>
                <span>{formatPercent01(selected.collectionRate)}</span>
              </div>
            </ModalField>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
