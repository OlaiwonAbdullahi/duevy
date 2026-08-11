"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Invoice01Icon,
  MoneySend01Icon,
  ReceiptDollarIcon,
  AddInvoiceIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BRAND_INPUT } from "../../dashboard/_components/form-styles";
import { StatCard } from "../../dashboard/_components/StatCard";
import { EmptyState } from "../../dashboard/_components/EmptyState";
import PageHeader from "../_components/PageHeader";
import TableCard from "../_components/TableCard";
import StatusBadge, { type StatusTone } from "../_components/StatusBadge";
import { DataTable } from "../_components/DataTable";
import { Toolbar, SearchInput, FilterSelect } from "../_components/Toolbar";
import { AdminModal, ModalField } from "../_components/AdminModal";
import { nairaFromKobo } from "../_components/format";
import { ApiError } from "@/lib/api/errors";
import {
  listAdminTransactions,
  refundTransaction,
  manualCreditDue,
  type AdminTransaction,
  type AdminTxnStatus,
  type AdminTxnType,
} from "@/lib/api/admin";

const STATUS_TONES: Record<AdminTxnStatus, StatusTone> = {
  completed: "ok",
  pending: "warn",
  failed: "bad",
  refunded: "neutral",
};

const TYPE_LABELS: Record<AdminTxnType, string> = {
  deposit: "Deposit",
  dues_payment: "Dues payment",
  payout: "Payout",
  refund: "Refund",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [creditOpen, setCreditOpen] = useState(false);
  const [creditForm, setCreditForm] = useState({ dueId: "", userId: "", reference: "", reason: "" });
  const [crediting, setCrediting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  async function load() {
    setLoading(true);
    try {
      const { data } = await listAdminTransactions({
        q: debouncedSearch || undefined,
        type: typeFilter === "all" ? undefined : (typeFilter as AdminTxnType),
        status: statusFilter === "all" ? undefined : statusFilter,
        perPage: 100,
      });
      setTransactions(data);
    } catch {
      toast.error("Couldn't load transactions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter, typeFilter]);

  const selected = useMemo(
    () => transactions.find((tx) => tx.id === selectedId) ?? null,
    [transactions, selectedId],
  );

  const totalVolume = transactions.reduce((s, tx) => s + tx.amount, 0);
  const duesVolume = transactions
    .filter((tx) => tx.type === "dues_payment" && tx.status === "completed")
    .reduce((s, tx) => s + tx.amount, 0);
  const pendingPayouts = transactions.filter(
    (tx) => tx.type === "payout" && tx.status === "pending",
  ).length;

  async function handleRefund(tx: AdminTransaction) {
    const reason = window.prompt(`Reason for refunding ${tx.reference}?`)?.trim();
    if (!reason) return;
    setBusy(true);
    try {
      const updated = await refundTransaction(tx.id, { reason });
      setTransactions((prev) => prev.map((t) => (t.id === tx.id ? updated : t)));
      toast.success(`${tx.reference} refunded.`);
    } catch (err) {
      if (err instanceof ApiError && err.code === "REFUND_NOT_SUPPORTED") {
        toast.error("Refunds aren't supported yet", {
          description: "Process this manually with the payer for now.",
        });
      } else {
        toast.error(err instanceof ApiError ? err.message : "Couldn't refund this transaction.");
      }
    } finally {
      setBusy(false);
    }
  }

  const canRefund = (tx: AdminTransaction) =>
    (tx.type === "dues_payment" || tx.type === "deposit") && tx.status === "completed";

  async function handleManualCredit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCrediting(true);
    try {
      await manualCreditDue(creditForm.dueId.trim(), {
        userId: creditForm.userId.trim(),
        reference: creditForm.reference.trim() || undefined,
        reason: creditForm.reason.trim(),
      });
      toast.success("Due marked as paid.");
      setCreditOpen(false);
      setCreditForm({ dueId: "", userId: "", reference: "", reason: "" });
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't credit this due.");
    } finally {
      setCrediting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Transactions"
        description="The money trail — deposits, dues, payouts and refunds."
        right={
          <Button variant="brand-outline" size="pill" onClick={() => setCreditOpen(true)}>
            Credit a due manually
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={ReceiptDollarIcon}
          label="Total volume"
          value={nairaFromKobo(totalVolume)}
          tone="brand"
        />
        <StatCard icon={Invoice01Icon} label="Dues collected" value={nairaFromKobo(duesVolume)} />
        <StatCard
          icon={MoneySend01Icon}
          label="Pending payouts"
          value={String(pendingPayouts)}
          hint="Awaiting release"
        />
      </div>

      <Toolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by reference, user or space…"
        />
        <FilterSelect
          value={typeFilter}
          onChange={setTypeFilter}
          label="Filter by type"
          options={[
            { value: "all", label: "All types" },
            { value: "deposit", label: "Deposits" },
            { value: "dues_payment", label: "Dues payments" },
            { value: "payout", label: "Payouts" },
            { value: "refund", label: "Refunds" },
          ]}
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          label="Filter by status"
          options={[
            { value: "all", label: "All statuses" },
            { value: "completed", label: "Completed" },
            { value: "pending", label: "Pending" },
            { value: "failed", label: "Failed" },
            { value: "refunded", label: "Refunded" },
          ]}
        />
      </Toolbar>

      <TableCard title="Ledger" subtitle="Click a row for the full record">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-paper" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={ReceiptDollarIcon}
            title="No transactions match"
            description="Try a different search or clear the filters."
          />
        ) : (
          <DataTable
            headers={[
              { label: "Reference" },
              { label: "User" },
              { label: "Space" },
              { label: "Type" },
              { label: "Amount" },
              { label: "Status" },
              { label: "Date" },
            ]}
          >
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                onClick={() => setSelectedId(tx.id)}
                className="cursor-pointer transition-colors hover:bg-paper/40"
              >
                <td className="p-4 font-mono text-xs font-semibold text-ink">
                  {tx.reference}
                </td>
                <td className="p-4">
                  <p className="font-semibold text-ink">{tx.userName}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">{tx.userEmail}</p>
                </td>
                <td className="p-4 font-medium">{tx.spaceName ?? "—"}</td>
                <td className="p-4">{TYPE_LABELS[tx.type]}</td>
                <td className="p-4 font-semibold">{nairaFromKobo(tx.amount)}</td>
                <td className="p-4">
                  <StatusBadge tone={STATUS_TONES[tx.status]}>{tx.status}</StatusBadge>
                </td>
                <td className="p-4 whitespace-nowrap text-xs text-ink-soft">
                  {formatDate(tx.createdAt)}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </TableCard>

      {selected && (
        <AdminModal
          icon={ReceiptDollarIcon}
          title={TYPE_LABELS[selected.type]}
          description={selected.reference}
          onClose={() => setSelectedId(null)}
          footer={
            canRefund(selected) ? (
              <Button
                variant="danger-outline"
                size="pill"
                disabled={busy}
                onClick={() => handleRefund(selected)}
              >
                Refund
              </Button>
            ) : undefined
          }
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <ModalField label="Amount">{nairaFromKobo(selected.amount)}</ModalField>
            <ModalField label="Status">
              <StatusBadge tone={STATUS_TONES[selected.status]}>
                {selected.status}
              </StatusBadge>
            </ModalField>
            <ModalField label="User">
              {selected.userName}
              <p className="mt-0.5 text-xs font-normal text-ink-soft">
                {selected.userEmail}
              </p>
            </ModalField>
            <ModalField label="Space">{selected.spaceName ?? "—"}</ModalField>
            <ModalField label="Date" className="sm:col-span-2">
              {formatDate(selected.createdAt)}
            </ModalField>
          </div>
        </AdminModal>
      )}

      {creditOpen && (
        <AdminModal
          icon={AddInvoiceIcon}
          title="Credit a due manually"
          description="Marks a due as paid for a user — use this to fix a payment that happened but never recorded (e.g. a missed webhook)."
          onClose={() => setCreditOpen(false)}
        >
          <form className="space-y-4" onSubmit={handleManualCredit}>
            <div>
              <label htmlFor="credit-due" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Due ID
              </label>
              <Input
                id="credit-due"
                required
                value={creditForm.dueId}
                onChange={(e) => setCreditForm((f) => ({ ...f, dueId: e.target.value }))}
                placeholder="cku1a2b3c..."
                className={BRAND_INPUT}
              />
            </div>
            <div>
              <label htmlFor="credit-user" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                User ID
              </label>
              <Input
                id="credit-user"
                required
                value={creditForm.userId}
                onChange={(e) => setCreditForm((f) => ({ ...f, userId: e.target.value }))}
                placeholder="cku1x2y3z..."
                className={BRAND_INPUT}
              />
            </div>
            <div>
              <label htmlFor="credit-reference" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Reference <span className="font-normal text-ink-soft/70">(optional)</span>
              </label>
              <Input
                id="credit-reference"
                value={creditForm.reference}
                onChange={(e) => setCreditForm((f) => ({ ...f, reference: e.target.value }))}
                placeholder="Auto-generated if left blank"
                className={BRAND_INPUT}
              />
            </div>
            <div>
              <label htmlFor="credit-reason" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                Reason
              </label>
              <textarea
                id="credit-reason"
                required
                value={creditForm.reason}
                onChange={(e) => setCreditForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="e.g. Bank transfer confirmed by student, webhook never landed — see support thread #142"
                rows={3}
                className="w-full resize-none rounded-2xl border border-cloud bg-canvas px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-soft focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-brand/15"
              />
            </div>
            <Button type="submit" variant="brand" size="pill" className="w-full" disabled={crediting}>
              {crediting ? "Crediting…" : "Mark as paid"}
            </Button>
          </form>
        </AdminModal>
      )}
    </div>
  );
}
