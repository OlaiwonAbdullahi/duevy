"use client";

import { useMemo, useState } from "react";
import {
  MoneySend01Icon,
  ReceiptDollarIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { StatCard } from "../../dashboard/_components/StatCard";
import { EmptyState } from "../../dashboard/_components/EmptyState";
import PageHeader from "../_components/PageHeader";
import TableCard from "../_components/TableCard";
import StatusBadge, { type StatusTone } from "../_components/StatusBadge";
import { DataTable } from "../_components/DataTable";
import { Toolbar, SearchInput, FilterSelect } from "../_components/Toolbar";
import { AdminModal, ModalField } from "../_components/AdminModal";
import { naira } from "../_components/format";

type TxStatus = "completed" | "pending" | "failed" | "refunded";
type TxType = "deposit" | "dues_payment" | "payout" | "refund";

interface Transaction {
  id: string;
  reference: string;
  date: string;
  type: TxType;
  status: TxStatus;
  userName: string;
  userEmail: string;
  spaceName: string;
  amount: number;
}

const transactions: Transaction[] = [
  {
    id: "TX-101",
    reference: "DV-DEP-99201",
    date: "2026-07-04 14:22",
    type: "deposit",
    status: "completed",
    userName: "Chioma Adebayo",
    userEmail: "chioma@duevy.com",
    spaceName: "Accounting Dept",
    amount: 25000,
  },
  {
    id: "TX-102",
    reference: "DV-DUE-88192",
    date: "2026-07-04 11:05",
    type: "dues_payment",
    status: "completed",
    userName: "Tunde Bakare",
    userEmail: "tunde@duevy.com",
    spaceName: "Engineering Faculty",
    amount: 12000,
  },
  {
    id: "TX-103",
    reference: "DV-PAY-77210",
    date: "2026-07-03 18:40",
    type: "payout",
    status: "pending",
    userName: "Musa Ibrahim",
    userEmail: "musa@duevy.com",
    spaceName: "Economics Club",
    amount: 150000,
  },
  {
    id: "TX-104",
    reference: "DV-REF-11029",
    date: "2026-07-03 09:15",
    type: "refund",
    status: "refunded",
    userName: "Amara Okafor",
    userEmail: "amara@duevy.com",
    spaceName: "Law Association",
    amount: 5000,
  },
  {
    id: "TX-105",
    reference: "DV-DUE-55461",
    date: "2026-07-02 16:30",
    type: "dues_payment",
    status: "failed",
    userName: "Emeka Obi",
    userEmail: "emeka@duevy.com",
    spaceName: "Engineering Faculty",
    amount: 12000,
  },
];

const STATUS_TONES: Record<TxStatus, StatusTone> = {
  completed: "ok",
  pending: "warn",
  failed: "bad",
  refunded: "neutral",
};

const TYPE_LABELS: Record<TxType, string> = {
  deposit: "Deposit",
  dues_payment: "Dues payment",
  payout: "Payout",
  refund: "Refund",
};

export default function AdminTransactionsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter(
      (tx) =>
        (q === "" ||
          tx.reference.toLowerCase().includes(q) ||
          tx.userName.toLowerCase().includes(q) ||
          tx.spaceName.toLowerCase().includes(q)) &&
        (statusFilter === "all" || tx.status === statusFilter) &&
        (typeFilter === "all" || tx.type === typeFilter),
    );
  }, [search, statusFilter, typeFilter]);

  const selected = transactions.find((tx) => tx.id === selectedId) ?? null;

  const totalVolume = transactions.reduce((s, tx) => s + tx.amount, 0);
  const duesVolume = transactions
    .filter((tx) => tx.type === "dues_payment" && tx.status === "completed")
    .reduce((s, tx) => s + tx.amount, 0);
  const pendingPayouts = transactions.filter(
    (tx) => tx.type === "payout" && tx.status === "pending",
  ).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Transactions"
        description="The money trail — deposits, dues, payouts and refunds."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={ReceiptDollarIcon}
          label="Total volume"
          value={naira(totalVolume)}
          tone="brand"
        />
        <StatCard icon={Wallet01Icon} label="Dues collected" value={naira(duesVolume)} />
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
        {filtered.length === 0 ? (
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
            {filtered.map((tx) => (
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
                <td className="p-4 font-medium">{tx.spaceName}</td>
                <td className="p-4">{TYPE_LABELS[tx.type]}</td>
                <td className="p-4 font-semibold">{naira(tx.amount)}</td>
                <td className="p-4">
                  <StatusBadge tone={STATUS_TONES[tx.status]}>{tx.status}</StatusBadge>
                </td>
                <td className="p-4 whitespace-nowrap text-xs text-ink-soft">
                  {tx.date}
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
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <ModalField label="Amount">{naira(selected.amount)}</ModalField>
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
            <ModalField label="Space">{selected.spaceName}</ModalField>
            <ModalField label="Date" className="sm:col-span-2">
              {selected.date}
            </ModalField>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
