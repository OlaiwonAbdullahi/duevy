"use client";

import React, { useState, useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeftRightIcon,
  TickCircleIcon,
  CancelCircleIcon,
  Time02Icon,
  Search01Icon,
  DatabaseIcon,
  ValidationIcon,
  AlertCircleIcon,
  CreditCardIcon,
  ArrowDown01Icon,
  MoreHorizontalIcon,
  LegalDocumentIcon,
} from "@hugeicons/core-free-icons";
import PageHeader from "../_components/PageHeader";
import TableCard from "../_components/TableCard";
import { formatMoneyNGN } from "../_components/format";

type TransactionStatus = "completed" | "pending" | "failed" | "refunded";
type TransactionType = "deposit" | "dues_payment" | "payout" | "refund" | "reversal";

interface Transaction {
  id: string;
  reference: string;
  processorRef: string;
  date: string;
  type: TransactionType;
  status: TransactionStatus;
  user: { name: string; email: string };
  spaceName: string;
  amount: number;
}

interface PayoutRequest {
  id: string;
  repName: string;
  spaceName: string;
  amount: number;
  requestDate: string;
  status: "pending" | "approved" | "held" | "rejected";
}

const initialTransactions: Transaction[] = [
  { id: "TX-101", reference: "DV-DEP-99201", processorRef: "MONN_7726155", date: "2026-07-04 14:22", type: "deposit", status: "completed", user: { name: "Chioma Adebayo", email: "chioma@duevy.com" }, spaceName: "Accounting Dept", amount: 25000 },
  { id: "TX-102", reference: "DV-DUE-88192", processorRef: "VISA_9981267", date: "2026-07-04 11:05", type: "dues_payment", status: "completed", user: { name: "Tunde Bakare", email: "tunde@duevy.com" }, spaceName: "Engineering Faculty", amount: 12000 },
  { id: "TX-103", reference: "DV-PAY-77210", processorRef: "MAST_6615520", date: "2026-07-03 18:40", type: "payout", status: "pending", user: { name: "Musa Ibrahim (Rep)", email: "musa@duevy.com" }, spaceName: "Economics Club", amount: 150000 },
  { id: "TX-104", reference: "DV-REF-11029", processorRef: "VERV_4410291", date: "2026-07-03 09:15", type: "refund", status: "refunded", user: { name: "Amara Okafor", email: "amara@duevy.com" }, spaceName: "Law Association", amount: 5000 },
  { id: "TX-105", reference: "DV-DUE-55461", processorRef: "MONN_1102983", date: "2026-07-02 16:30", type: "dues_payment", status: "failed", user: { name: "Emeka Obi", email: "emeka@duevy.com" }, spaceName: "Engineering Faculty", amount: 12000 },
];

const initialPayouts: PayoutRequest[] = [
  { id: "PO-501", repName: "Musa Ibrahim", spaceName: "Economics Club", amount: 150000, requestDate: "2026-07-03 18:40", status: "pending" },
  { id: "PO-502", repName: "Funmi Alao", spaceName: "Medicine Faculty", amount: 85000, requestDate: "2026-07-04 08:12", status: "pending" },
];

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [payoutQueue, setPayoutQueue] = useState<PayoutRequest[]>(initialPayouts);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const [activeDropdownRowId, setActiveDropdownRowId] = useState<string | null>(null);
  const [selectedModalTx, setSelectedModalTx] = useState<Transaction | null>(null);

  const [selectedPayout, setSelectedPayout] = useState<PayoutRequest | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [actionType, setActionType] = useState<"approve" | "hold" | "reject" | null>(null);

  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjUser, setAdjUser] = useState("");
  const [adjDept, setAdjDept] = useState("");
  const [adjAmount, setAdjAmount] = useState("");
  const [adjType, setAdjType] = useState<TransactionType>("deposit");
  const [adjNote, setAdjNote] = useState("");

  const getStatusBadge = (status: TransactionStatus) => {
    const config = {
      completed: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
      pending: "bg-amber-500/10 text-amber-700 border-amber-500/20",
      failed: "bg-rose-500/10 text-rose-700 border-rose-500/20",
      refunded: "bg-slate-500/10 text-slate-700 border-slate-500/20",
    };
    return `inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-[10px] ${config[status]}`;
  };

  const getTypeStyle = (type: TransactionType) => {
    const labels: Record<TransactionType, string> = {
      deposit: "Inflow / Deposit",
      dues_payment: "Dues Collection",
      payout: "Outflow / Payout",
      refund: "Refund Issued",
      reversal: "Reversal / Correction",
    };
    return labels[type];
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesSearch =
        tx.reference.toLowerCase().includes(search.toLowerCase()) ||
        tx.processorRef.toLowerCase().includes(search.toLowerCase()) ||
        tx.user.name.toLowerCase().includes(search.toLowerCase()) ||
        tx.spaceName.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "all" || tx.status === statusFilter;
      const matchesType = typeFilter === "all" || tx.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [transactions, search, statusFilter, typeFilter]);

  const handlePayoutAction = (payout: PayoutRequest, type: "approve" | "hold" | "reject") => {
    setSelectedPayout(payout);
    setActionType(type);
  };

  const submitPayoutAction = () => {
    if (!selectedPayout || !actionType || !actionReason.trim()) return;

    setPayoutQueue((prev) => prev.filter((p) => p.id !== selectedPayout.id));

    if (actionType === "approve") {
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.user.name.includes(selectedPayout.repName) && tx.status === "pending"
            ? { ...tx, status: "completed" }
            : tx
        )
      );
    }

    setSelectedPayout(null);
    setActionType(null);
    setActionReason("");
  };

  const handleManualAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjUser || !adjDept || !adjAmount || !adjNote.trim()) return;

    const newTx: Transaction = {
      id: `TX-ADJ-${Math.floor(100 + Math.random() * 900)}`,
      reference: `DV-ADJ-${Math.floor(10000 + Math.random() * 90000)}`,
      processorRef: "MANUAL_ENTRY",
      date: new Date().toISOString().replace("T", " ").substring(0, 16),
      type: adjType,
      status: "completed",
      user: { name: adjUser, email: `${adjUser.toLowerCase().replace(/\s+/g, "")}@duevy.com` },
      spaceName: adjDept,
      amount: parseFloat(adjAmount),
    };

    setTransactions([newTx, ...transactions]);
    setAdjUser("");
    setAdjDept("");
    setAdjAmount("");
    setAdjNote("");
    setIsAdjustmentModalOpen(false);
    alert("Internal manual adjustment ledger entry generated successfully.");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <PageHeader
        title="Transactions Ledger"
        description="The primary source of financial truth. Monitor inflows, manage representative payouts, track card rails, and process corrections."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-cloud bg-canvas p-5">
          <p className="text-xs font-medium text-ink-soft">Total Volume Tracked</p>
          <p className="mt-2 text-2xl font-bold text-ink">{formatMoneyNGN(1104000)} NGN</p>
        </div>
        <div className="rounded-2xl border border-cloud bg-canvas p-5">
          <p className="text-xs font-medium text-ink-soft">Dues Collection Volume</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{formatMoneyNGN(24000)} NGN</p>
        </div>
        <div className="rounded-2xl border border-cloud bg-canvas p-5">
          <p className="text-xs font-medium text-ink-soft">Pending Payout Requests</p>
          <p className="mt-2 text-2xl font-bold text-amber-600">{payoutQueue.length} Active</p>
        </div>
        <div className="rounded-2xl border border-cloud bg-canvas p-5">
          <p className="text-xs font-medium text-ink-soft">Unresolved Gateway Disputes</p>
          <p className="mt-2 text-2xl font-bold text-rose-600">1 Logged</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between bg-canvas border border-cloud rounded-xl p-4 shadow-sm">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-3 flex items-center text-ink-soft">
            <HugeiconsIcon icon={Search01Icon} size={15} />
          </span>
          <input
            type="text"
            placeholder="Search by reference code, processor ID, or member name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 rounded-md border border-cloud bg-paper/20 pl-9 pr-4 py-2 text-sm text-ink placeholder:text-ink-soft outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative inline-block">
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)} 
              className="h-9 pl-3 pr-8 py-1 text-xs bg-canvas border border-cloud rounded-md text-ink outline-none focus:ring-1 focus:ring-brand focus:border-brand font-medium cursor-pointer appearance-none transition-all shadow-2xs"
            >
              <option value="all">All Classification Types</option>
              <option value="deposit">Deposits</option>
              <option value="dues_payment">Dues Collections</option>
              <option value="payout">Payouts</option>
              <option value="refund">Refunds</option>
              <option value="reversal">Reversals</option>
            </select>
            <span className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-ink-soft">
              <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={2.5} />
            </span>
          </div>
          
          <div className="relative inline-block">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)} 
              className="h-9 pl-3 pr-8 py-1 text-xs bg-canvas border border-cloud rounded-md text-ink outline-none focus:ring-1 focus:ring-brand focus:border-brand font-medium cursor-pointer appearance-none transition-all shadow-2xs"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <span className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-ink-soft">
              <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={2.5} />
            </span>
          </div>

          <button 
            type="button" 
            onClick={() => setIsAdjustmentModalOpen(true)}
            className="h-9 px-3 rounded-md bg-brand text-white text-xs font-bold hover:bg-brand/90 transition-colors shadow-2xs inline-flex items-center gap-1"
          >
            <HugeiconsIcon icon={DatabaseIcon} size={14} /> Adjust Balance
          </button>
        </div>
      </div>

      <TableCard title="Core Ledger History" subtitle="Comprehensive central money repository. Click a row to pull deep validation data files.">
        <div className="w-full overflow-auto rounded-xl border border-cloud bg-canvas shadow-xs">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="border-b border-cloud bg-paper/30 font-semibold text-xs text-ink-soft uppercase tracking-wider">
              <tr>
                <th className="p-4 align-middle">Reference Context</th>
                <th className="p-4 align-middle">Gateway Processor ID</th>
                <th className="p-4 align-middle">Destination Space Hub</th>
                <th className="p-4 align-middle">Entity User</th>
                <th className="p-4 align-middle">Flow Classification</th>
                <th className="p-4 align-middle">Gross Amount</th>
                <th className="p-4 align-middle">Status</th>
                <th className="p-4 align-middle text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cloud bg-canvas text-ink text-xs font-medium">
              {filteredTransactions.map((tx) => (
                <tr 
                  key={tx.id} 
                  onClick={() => setSelectedModalTx(tx)}
                  className="hover:bg-paper/20 transition-colors cursor-pointer"
                >
                  <td className="p-4 align-middle font-bold tracking-tight text-ink">{tx.reference}</td>
                  <td className="p-4 align-middle font-mono text-ink-soft">{tx.processorRef}</td>
                  <td className="p-4 align-middle font-semibold text-ink">{tx.spaceName}</td>
                  <td className="p-4 align-middle">
                    <div className="font-bold text-ink">{tx.user.name}</div>
                    <div className="text-[11px] text-ink-soft mt-0.5">{tx.user.email}</div>
                  </td>
                  <td className="p-4 align-middle font-semibold text-ink-soft">{getTypeStyle(tx.type)}</td>
                  <td className="p-4 align-middle font-bold text-ink">{formatMoneyNGN(tx.amount)}</td>
                  <td className="p-4 align-middle">
                    <span className={getStatusBadge(tx.status)}>{tx.status}</span>
                  </td>

                  <td className="p-4 align-middle text-right relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setActiveDropdownRowId(activeDropdownRowId === tx.id ? null : tx.id)}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-cloud bg-canvas hover:bg-paper text-ink transition-colors outline-none cursor-pointer"
                    >
                      <HugeiconsIcon icon={MoreHorizontalIcon} size={14} />
                    </button>

                    {activeDropdownRowId === tx.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActiveDropdownRowId(null)} />
                        <div className="absolute right-4 mt-1 w-44 rounded-md border border-cloud bg-canvas p-1 text-ink shadow-md z-20 text-left divide-y divide-cloud">
                          <div className="py-1">
                            <button
                              type="button"
                              onClick={() => {
                                alert("Verification check dispatched via third party payload rails.");
                                setActiveDropdownRowId(null);
                              }}
                              className="w-full px-2 py-1.5 text-xs text-left font-medium rounded-sm hover:bg-paper transition-colors text-ink cursor-pointer block"
                            >
                              Verify Sync Logs
                            </button>
                            {tx.status === "pending" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPayout({ id: tx.id, repName: tx.user.name, spaceName: tx.spaceName, amount: tx.amount, requestDate: tx.date, status: "pending" });
                                  setActionType("approve");
                                  setActiveDropdownRowId(null);
                                }}
                                className="w-full px-2 py-1.5 text-xs text-left font-bold rounded-sm hover:bg-paper text-emerald-700 cursor-pointer block"
                              >
                                Approve Payout
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-xs text-ink-soft italic bg-canvas">No central ledger parameters conform with active search criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </TableCard>

      {/* --- Overlay Modal Component Variant 1: Row Item Details View --- */}
      {selectedModalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs transition-all animate-fadeIn">
          <div className="fixed inset-0" onClick={() => setSelectedModalTx(null)} />
          
          <div className="relative w-full max-w-xl rounded-3xl border border-cloud bg-canvas p-6 shadow-xl space-y-5 z-10 animate-scaleUp">
            <div className="flex items-start justify-between pb-3 border-b border-cloud">
              <div className="flex items-center gap-2.5">
                <HugeiconsIcon icon={LegalDocumentIcon} size={20} className="text-brand" />
                <div>
                  <h3 className="text-sm font-bold text-ink">Transaction File Overview</h3>
                  <p className="text-xs text-ink-soft font-mono mt-0.5">{selectedModalTx.reference}</p>
                </div>
              </div>
              <button onClick={() => setSelectedModalTx(null)} className="h-8 w-8 rounded-full border border-cloud bg-canvas hover:bg-paper flex items-center justify-center text-ink-soft text-xs cursor-pointer">✕</button>
            </div>

            <div className="bg-paper/30 border border-cloud rounded-xl p-4 text-xs grid gap-3 sm:grid-cols-2">
              <div>
                <span className="text-ink-soft block font-medium">Associated Account Holder</span>
                <span className="text-sm font-bold text-ink mt-0.5 block">{selectedModalTx.user.name}</span>
                <span className="text-ink-soft font-mono text-[11px] block">{selectedModalTx.user.email}</span>
              </div>
              <div>
                <span className="text-ink-soft block font-medium">Destination Space Registry</span>
                <span className="text-sm font-bold text-ink mt-0.5 block">{selectedModalTx.spaceName}</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div className="border border-cloud p-3 rounded-xl bg-canvas">
                <span className="text-ink-soft block font-medium">Gross Valuation Asset</span>
                <span className="text-base font-bold text-ink mt-1 block">{formatMoneyNGN(selectedModalTx.amount)} NGN</span>
              </div>
              <div className="border border-cloud p-3 rounded-xl bg-canvas">
                <span className="text-ink-soft block font-medium">Third Party Rail Engine</span>
                <span className="text-base font-bold font-mono text-ink mt-1 block">{selectedModalTx.processorRef}</span>
              </div>
            </div>

            <div className="rounded-xl border border-cloud bg-paper/20 p-3.5 text-xs space-y-2">
              <span className="font-bold text-ink-soft uppercase tracking-wider text-[10px] block">System Triage Reconciliation status</span>
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">Automated verification loop check:</span>
                <span className="text-emerald-600 font-bold inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" /> Monnify Confirmed
                </span>
              </div>
              <p className="text-[11px] text-ink-soft leading-relaxed">This record maps cleanly against Monnify webhook callback indices and card processing rails without transaction discrepancies.</p>
            </div>

            {/* <div className="flex justify-end pt-2 border-t border-cloud">
              <button type="button" onClick={() => setSelectedModalTx(null)} className="px-4 py-2 border border-cloud rounded-xl text-xs font-semibold text-ink-soft hover:bg-paper cursor-pointer">
                Dismiss File
              </button>
            </div> */}
          </div>
        </div>
      )}

      {/* --- Overlay Modal Component Variant 2: Manual Correction Adjustment Form --- */}
      {isAdjustmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs transition-all animate-fadeIn">
          <div className="fixed inset-0" onClick={() => setIsAdjustmentModalOpen(false)} />
          
          <div className="relative w-full max-w-md rounded-3xl border border-cloud bg-canvas p-6 shadow-xl space-y-4 z-10 animate-scaleUp">
            <div className="flex items-start justify-between pb-3 border-b border-cloud">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={DatabaseIcon} size={20} className="text-brand" />
                <div>
                  <h3 className="text-sm font-bold text-ink">Execute Manual Correction</h3>
                  <p className="text-xs text-ink-soft mt-0.5">Internal balance modification trail setup</p>
                </div>
              </div>
              <button onClick={() => setIsAdjustmentModalOpen(false)} className="h-8 w-8 rounded-full border border-cloud bg-canvas hover:bg-paper flex items-center justify-center text-ink-soft text-xs cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleManualAdjustment} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-ink-soft block mb-1">Target Account Profile</label>
                <input type="text" required value={adjUser} onChange={(e) => setAdjUser(e.target.value)} placeholder="e.g. Chioma Adebayo" className="w-full text-xs h-9 rounded-md border border-cloud p-2 outline-none focus:border-brand bg-paper/20 text-ink" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-ink-soft block mb-1">Target Hub Space</label>
                <input type="text" required value={adjDept} onChange={(e) => setAdjDept(e.target.value)} placeholder="e.g. Accounting Dept" className="w-full text-xs h-9 rounded-md border border-cloud p-2 outline-none focus:border-brand bg-paper/20 text-ink" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-ink-soft block mb-1">Amount (NGN)</label>
                  <input type="number" required value={adjAmount} onChange={(e) => setAdjAmount(e.target.value)} placeholder="5000" className="w-full text-xs h-9 rounded-md border border-cloud p-2 outline-none focus:border-brand bg-paper/20 text-ink" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-ink-soft block mb-1">Adjustment Action</label>
                  <div className="relative">
                    <select value={adjType} onChange={(e) => setAdjType(e.target.value as TransactionType)} className="w-full text-xs h-9 rounded-md border border-cloud pl-2 pr-7 outline-none bg-canvas text-ink cursor-pointer appearance-none">
                      <option value="deposit">Manual Inflow</option>
                      <option value="payout">Manual Outflow</option>
                      <option value="reversal">Ledger Reversal</option>
                    </select>
                    <span className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-ink-soft">
                      <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-ink-soft block mb-1">Authorization Correction Note</label>
                <textarea rows={2} required value={adjNote} onChange={(e) => setAdjNote(e.target.value)} placeholder="State explicitly why this manual balance correction is being executed..." className="w-full text-xs rounded-md border border-cloud p-2 outline-none focus:border-brand bg-paper/20 text-ink resize-none" />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-cloud">
                <button type="button" onClick={() => setIsAdjustmentModalOpen(false)} className="px-4 py-2 border border-cloud rounded-xl font-semibold text-ink-soft hover:bg-paper cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand text-white rounded-xl font-bold hover:bg-brand/90 transition-colors cursor-pointer">Commit Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Overlay Modal Component Variant 3: Payout Action Rationale Modal --- */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs transition-all animate-fadeIn">
          <div className="fixed inset-0" onClick={() => { setSelectedPayout(null); setActionType(null); }} />
          
          <div className="relative w-full max-w-md rounded-3xl border border-cloud bg-canvas p-6 shadow-xl space-y-4 z-10 animate-scaleUp">
            <div className="flex items-start gap-3">
              <span className="p-2 rounded-full bg-brand/10 text-brand">
                <HugeiconsIcon icon={ValidationIcon} size={20} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-ink">Process Payout Request</h3>
                <p className="text-xs text-ink-soft mt-0.5">Transitioning withdrawal ticket status for <b>{selectedPayout.repName}</b> (Allocation value: <b>{formatMoneyNGN(selectedPayout.amount)}</b>).</p>
              </div>
            </div>
            
            <div className="text-xs">
              <label className="text-[11px] font-bold text-ink-soft block mb-1">Authorization Rationale / Audit Log Note</label>
              <textarea
                rows={3}
                required
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder="Provide explicit reasons for modifying this payout status. This parameter will be logged into permanent system archives..."
                className="w-full text-xs rounded-lg border border-cloud p-2.5 outline-none focus:border-brand bg-paper/20 text-ink resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 text-xs">
              <button type="button" onClick={() => { setSelectedPayout(null); setActionType(null); setActionReason(""); }} className="px-4 py-2 border border-cloud rounded-xl font-semibold text-ink-soft hover:bg-paper transition-colors cursor-pointer">
                Cancel
              </button>
              <button type="button" onClick={submitPayoutAction} disabled={!actionReason.trim()} className="px-4 py-2 bg-brand text-white rounded-xl font-bold hover:bg-brand/90 disabled:opacity-50 transition-colors cursor-pointer">
                Confirm {actionType ? actionType.toUpperCase() : "EXECUTE"} Action
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}