"use client";

import { useMemo, useState } from "react";
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
import { naira } from "../_components/format";

type DisputeStatus = "open" | "under_review" | "resolved";
type DisputeType = "payment_not_reflecting" | "non_remittance" | "refund_request";

interface Evidence {
  title: string;
  description: string;
  reference?: string;
  amount?: number;
}

interface Dispute {
  id: string;
  type: DisputeType;
  openedBy: string;
  email: string;
  department: string;
  status: DisputeStatus;
  slaDays: number;
  ageDays: number;
  studentEvidence: Evidence;
  repEvidence: Evidence;
}

const initialDisputes: Dispute[] = [
  {
    id: "DSP-1042",
    type: "payment_not_reflecting",
    openedBy: "Ada Nwosu",
    email: "ada@duevy.com",
    department: "Computer Science 2025",
    status: "open",
    slaDays: 5,
    ageDays: 4,
    studentEvidence: {
      title: "Payment confirmation",
      description: "Transferred via bank rail; debit alert received.",
      reference: "MNFY-TX-882910",
      amount: 12000,
    },
    repEvidence: {
      title: "Ledger sync history",
      description: "No matching transaction found for this student.",
      reference: "REPLOG-992",
    },
  },
  {
    id: "DSP-1041",
    type: "non_remittance",
    openedBy: "Kofi Mensah",
    email: "kofi@duevy.com",
    department: "Business Studies 2025",
    status: "under_review",
    slaDays: 7,
    ageDays: 2,
    studentEvidence: {
      title: "Class ledger",
      description: "32 students paid cash to the rep, but the space balance hasn't moved.",
      amount: 160000,
    },
    repEvidence: {
      title: "Rep wallet",
      description: "Wallet holds ₦98,000; outflows temporarily capped.",
      amount: 98000,
    },
  },
  {
    id: "DSP-1039",
    type: "refund_request",
    openedBy: "Zainab Sani",
    email: "zainab@duevy.com",
    department: "Mass Comm 2024",
    status: "resolved",
    slaDays: 14,
    ageDays: 16,
    studentEvidence: {
      title: "Double charge",
      description: "Card retry after a timeout caused a duplicate debit.",
      reference: "VISA-WNK-1102",
      amount: 5000,
    },
    repEvidence: {
      title: "Gateway confirmed",
      description: "Two identical collection events 45 seconds apart.",
      amount: 5000,
    },
  },
];

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

function EvidenceCard({ side, evidence }: { side: string; evidence: Evidence }) {
  return (
    <div className="space-y-2 rounded-2xl border border-cloud bg-canvas p-4">
      <StatusBadge tone="neutral">{side}</StatusBadge>
      <p className="text-[13px] font-semibold text-ink">{evidence.title}</p>
      <p className="text-xs leading-5 text-ink-soft">{evidence.description}</p>
      {evidence.reference && (
        <p className="rounded-lg border border-cloud bg-paper/40 p-1.5 font-mono text-[11px] text-ink-soft">
          Ref: {evidence.reference}
        </p>
      )}
      {evidence.amount !== undefined && (
        <p className="text-[13px] font-semibold text-ink">{naira(evidence.amount)}</p>
      )}
    </div>
  );
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>(initialDisputes);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return disputes.filter(
      (d) =>
        (q === "" ||
          d.id.toLowerCase().includes(q) ||
          d.openedBy.toLowerCase().includes(q) ||
          d.department.toLowerCase().includes(q)) &&
        (statusFilter === "all" || d.status === statusFilter),
    );
  }, [disputes, search, statusFilter]);

  const selected = disputes.find((d) => d.id === selectedId) ?? null;

  const resolve = (id: string, outcome: "refund" | "release" | "freeze") => {
    setDisputes((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: "resolved" as const } : d)),
    );
    const labels = {
      refund: "refund issued to the student",
      release: "payout released",
      freeze: "rep wallet frozen",
    };
    toast(`${id} resolved — ${labels[outcome]}.`);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Disputes"
        description="Reported payment issues with both parties' evidence, ready to settle."
      />

      <Toolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by ticket, claimant or space…"
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

      <TableCard title="Tickets" subtitle="Click a row to review the evidence">
        {filtered.length === 0 ? (
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
              { label: "Space" },
              { label: "Issue" },
              { label: "Age" },
              { label: "Status" },
            ]}
          >
            {filtered.map((d) => {
              const breached = d.ageDays >= d.slaDays && d.status !== "resolved";
              return (
                <tr
                  key={d.id}
                  onClick={() => setSelectedId(d.id)}
                  className="cursor-pointer transition-colors hover:bg-paper/40"
                >
                  <td className="p-4 font-mono text-xs font-semibold text-ink">{d.id}</td>
                  <td className="p-4">
                    <p className="font-semibold text-ink">{d.openedBy}</p>
                    <p className="mt-0.5 text-xs text-ink-soft">{d.email}</p>
                  </td>
                  <td className="p-4 font-medium">{d.department}</td>
                  <td className="p-4">{TYPE_LABELS[d.type]}</td>
                  <td className="p-4">
                    <StatusBadge tone={breached ? "bad" : "neutral"}>
                      {d.ageDays}d of {d.slaDays}d SLA
                    </StatusBadge>
                  </td>
                  <td className="p-4">
                    <StatusBadge tone={STATUS_TONES[d.status]}>
                      {STATUS_LABELS[d.status]}
                    </StatusBadge>
                  </td>
                </tr>
              );
            })}
          </DataTable>
        )}
      </TableCard>

      {selected && (
        <AdminModal
          wide
          icon={Megaphone01Icon}
          title={`Ticket ${selected.id}`}
          description={`${TYPE_LABELS[selected.type]} · ${selected.department}`}
          onClose={() => setSelectedId(null)}
          footer={
            selected.status !== "resolved" && (
              <>
                <Button
                  variant="danger-outline"
                  size="pill"
                  onClick={() => resolve(selected.id, "freeze")}
                >
                  Freeze rep wallet
                </Button>
                <Button
                  variant="brand-outline"
                  size="pill"
                  onClick={() => resolve(selected.id, "release")}
                >
                  Release payout
                </Button>
                <Button
                  variant="brand"
                  size="pill"
                  onClick={() => resolve(selected.id, "refund")}
                >
                  Refund student
                </Button>
              </>
            )
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <ModalField label="Claimant">
              {selected.openedBy}
              <p className="mt-0.5 text-xs font-normal text-ink-soft">{selected.email}</p>
            </ModalField>
            <ModalField label="SLA">
              {selected.ageDays} of {selected.slaDays} days
              {selected.ageDays >= selected.slaDays && selected.status !== "resolved" && (
                <span className="ml-2">
                  <StatusBadge tone="bad">Breached</StatusBadge>
                </span>
              )}
            </ModalField>
          </div>

          <p className="mt-5 mb-2 text-[11px] font-semibold text-ink-soft">
            Evidence from both parties
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <EvidenceCard side="Student" evidence={selected.studentEvidence} />
            <EvidenceCard side="Rep" evidence={selected.repEvidence} />
          </div>
        </AdminModal>
      )}
    </div>
  );
}
