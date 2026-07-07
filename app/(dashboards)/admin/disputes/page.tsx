"use client";

import React, { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  UserIcon,
  ValidationIcon,
  TickCircleIcon,
  CancelCircleIcon,
  AlertCircleIcon,
  Note01Icon,
  MoreHorizontalIcon,
  ArrowDown01Icon,
  NineCircleIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import PageHeader from "../_components/PageHeader";
import TableCard from "../_components/TableCard";
import StatusBadge from "../_components/StatusBadge";
import { formatMoneyNGN } from "../_components/format";

type DisputeStatus = "open" | "under_review" | "resolved" | "escalated";
type DisputeType = "payment_not_reflecting" | "non_remittance" | "refund_request";

interface EvidenceNode {
  title: string;
  description: string;
  referenceCode?: string;
  amount?: number;
}

interface DisputeTicket {
  id: string;
  type: DisputeType;
  openedBy: string;
  studentEmail: string;
  department: string;
  createdAt: string;
  status: DisputeStatus;
  slaDays: number;
  ageDays: number;
  studentEvidence: EvidenceNode;
  repEvidence: EvidenceNode;
}

const initialDisputes: DisputeTicket[] = [
  {
    id: "DSP-1042",
    type: "payment_not_reflecting",
    openedBy: "Ada Nwosu",
    studentEmail: "ada@duevy.com",
    department: "Computer Science 2025",
    createdAt: "2026-06-27T10:15:00.000Z",
    status: "open",
    slaDays: 5,
    ageDays: 4,
    studentEvidence: {
      title: "Student Payment Confirmation",
      description: "Transferred money via Monnify bank rail. Bank debit alert generated successfully.",
      referenceCode: "MNFY-TX-882910",
      amount: 12000,
    },
    repEvidence: {
      title: "Rep Ledger Sync History",
      description: "Webhook callback stack shows no matching transaction string matching this specific student ID token.",
      referenceCode: "REPLOG-992",
    },
  },
  {
    id: "DSP-1041",
    type: "non_remittance",
    openedBy: "Kofi Mensah (Rep File)",
    studentEmail: "kofi@duevy.com",
    department: "Business Studies 2025",
    createdAt: "2026-06-30T08:05:00.000Z",
    status: "under_review",
    slaDays: 7,
    ageDays: 2,
    studentEvidence: {
      title: "Class Association Ledger",
      description: "32 students paid cash to the representative, but space balances show zero movement.",
      amount: 160000,
    },
    repEvidence: {
      title: "Rep Wallet Status",
      description: "Wallet balance holds ₦98,000 cash float. Outflow limit threshold temporarily capped.",
      amount: 98000,
    },
  },
  {
    id: "DSP-1039",
    type: "refund_request",
    openedBy: "Zainab Sani",
    studentEmail: "zainab@duevy.com",
    department: "Mass Comm 2024",
    createdAt: "2026-06-18T14:42:00.000Z",
    status: "resolved",
    slaDays: 14,
    ageDays: 16,
    studentEvidence: {
      title: "Accidental Double Charge",
      description: "Card payment retried due to initial error timeout, resulting in a duplicate debit.",
      referenceCode: "VISA-WNK-1102",
      amount: 5000,
    },
    repEvidence: {
      title: "Gateway Event Confirmed",
      description: "Monnify database verifies two separate identical collection events within a 45-second window.",
      amount: 5000,
    },
  },
];

function statusTone(status: DisputeStatus) {
  switch (status) {
    case "open": return "warn";
    case "under_review": return "neutral";
    case "resolved": return "ok";
    case "escalated": return "bad";
    default: return "neutral";
  }
}

function getTypeLabel(type: DisputeType) {
  const maps: Record<DisputeType, string> = {
    payment_not_reflecting: "Payment Not Reflecting",
    non_remittance: "Non-Remittance by Rep",
    refund_request: "Refund Request",
  };
  return maps[type];
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<DisputeTicket[]>(initialDisputes);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [activeDropdownRowId, setActiveDropdownRowId] = useState<string | null>(null);
  const [selectedModalTicket, setSelectedModalTicket] = useState<DisputeTicket | null>(null);

  const filteredDisputes = useMemo(() => {
    return disputes.filter((d) => {
      const matchesSearch =
        d.id.toLowerCase().includes(search.toLowerCase()) ||
        d.openedBy.toLowerCase().includes(search.toLowerCase()) ||
        d.department.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || d.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [disputes, search, statusFilter]);

  const executeResolution = (id: string, action: "refund" | "release" | "freeze") => {
    alert(`Administrative Command Triggered: [${action.toUpperCase()}] executed for target dispute ticket ${id}. Safe audit trail generated.`);
    
    setDisputes(prev => prev.map(d => {
      if (d.id === id) {
        return { ...d, status: "resolved" as const };
      }
      return d;
    }));

    if (selectedModalTicket?.id === id) {
      setSelectedModalTicket(prev => prev ? { ...prev, status: "resolved" as const } : null);
    }
    setActiveDropdownRowId(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <PageHeader
        title="Disputes & Triage"
        description="Review reported payment issues, audit dual-party transaction evidence, track SLA response timelines, and settle user claims."
      />

      {/* --- Filter Toolbar --- */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between bg-canvas border border-cloud rounded-xl p-4 shadow-sm">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-3 flex items-center text-ink-soft">
            <HugeiconsIcon icon={Search01Icon} size={15} />
          </span>
          <input
            type="text"
            placeholder="Search tickets by ID, claimant name, or space hub..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 rounded-md border border-cloud bg-paper/20 pl-9 pr-4 py-2 text-sm text-ink placeholder:text-ink-soft outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
          />
        </div>
        
        {/* Custom shadcn Select Layout Dropdown */}
        <div className="relative inline-block">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="h-9 pl-3 pr-8 py-1 text-xs bg-canvas border border-cloud rounded-md text-ink outline-none focus:ring-1 focus:ring-brand focus:border-brand font-medium cursor-pointer appearance-none transition-all shadow-2xs"
          >
            <option value="all">All Ticket Statuses</option>
            <option value="open">Open Cases</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved Cases</option>
            <option value="escalated">Escalated Disputes</option>
          </select>
          <span className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-ink-soft">
            <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={2.5} />
          </span>
        </div>
      </div>

      {/* --- Full Width Data Table Matrix --- */}
      <TableCard title="Claims Triage Registry" subtitle="Comprehensive platform dispute file index. Click a line row to pull deep evidence files.">
        <div className="w-full overflow-auto rounded-xl border border-cloud bg-canvas shadow-xs">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="border-b border-cloud bg-paper/30 font-semibold text-xs text-ink-soft uppercase tracking-wider">
              <tr>
                <th className="p-4 align-middle">Ticket Code ID</th>
                <th className="p-4 align-middle">Claimant Name</th>
                <th className="p-4 align-middle">Department / Space Link</th>
                <th className="p-4 align-middle">Issue Classification</th>
                <th className="p-4 align-middle">Response SLA Standing</th>
                <th className="p-4 align-middle">Status</th>
                <th className="p-4 align-middle text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cloud bg-canvas text-ink text-xs font-medium">
              {filteredDisputes.map((d) => {
                const isSlaBreached = d.ageDays >= d.slaDays;

                return (
                  <tr 
                    key={d.id} 
                    onClick={() => setSelectedModalTicket(d)}
                    className="hover:bg-paper/20 transition-colors cursor-pointer"
                  >
                    <td className="p-4 align-middle font-bold tracking-tight text-ink font-mono">{d.id}</td>
                    <td className="p-4 align-middle">
                      <div className="font-bold text-ink">{d.openedBy}</div>
                      <div className="text-[11px] text-ink-soft mt-0.5">{d.studentEmail}</div>
                    </td>
                    <td className="p-4 align-middle font-semibold text-ink">{d.department}</td>
                    <td className="p-4 align-middle font-semibold text-ink-soft">{getTypeLabel(d.type)}</td>
                    <td className="p-4 align-middle">
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wide border ${isSlaBreached && d.status !== "resolved" ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse" : "bg-paper text-ink-soft border-transparent"}`}>
                        {d.ageDays}d / {d.slaDays}d Age
                      </span>
                    </td>
                    <td className="p-4 align-middle">
                      <StatusBadge tone={statusTone(d.status)}>{d.status}</StatusBadge>
                    </td>

                    {/* Inline Dropdown Options Selector Panel */}
                    <td className="p-4 align-middle text-right relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setActiveDropdownRowId(activeDropdownRowId === d.id ? null : d.id)}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-cloud bg-canvas hover:bg-paper text-ink transition-colors outline-none cursor-pointer"
                      >
                        <HugeiconsIcon icon={MoreHorizontalIcon} size={14} />
                      </button>

                      {activeDropdownRowId === d.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setActiveDropdownRowId(null)} />
                          <div className="absolute right-4 mt-1 w-44 rounded-md border border-cloud bg-canvas p-1 text-ink shadow-md z-20 text-left divide-y divide-cloud">
                            <div className="py-1">
                              <button
                                type="button"
                                onClick={() => { setSelectedModalTicket(d); setActiveDropdownRowId(null); }}
                                className="w-full px-2 py-1.5 text-xs text-left font-medium rounded-sm hover:bg-paper transition-colors text-ink cursor-pointer block"
                              >
                                View Evidence File
                              </button>
                            </div>
                            {d.status !== "resolved" && (
                              <div className="py-1">
                                <button
                                  type="button"
                                  onClick={() => executeResolution(d.id, "refund")}
                                  className="w-full px-2 py-1.5 text-xs text-left font-bold rounded-sm hover:bg-paper text-emerald-700 cursor-pointer block"
                                >
                                  Settle & Refund
                                </button>
                                <button
                                  type="button"
                                  onClick={() => executeResolution(d.id, "freeze")}
                                  className="w-full px-2 py-1.5 text-xs text-left font-bold rounded-sm hover:bg-paper text-rose-700 cursor-pointer block"
                                >
                                  Freeze Rep Wallet
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </TableCard>

      {/* --- Detailed Evidence Review Dialog Overlay Modal --- */}
      {selectedModalTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs transition-all animate-fadeIn">
          <div className="fixed inset-0" onClick={() => setSelectedModalTicket(null)} />
          
          <div className="relative w-full max-w-2xl rounded-3xl border border-cloud bg-canvas p-6 shadow-xl space-y-6 z-10 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-cloud">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-cloud flex items-center justify-center text-brand shrink-0">
                  <HugeiconsIcon icon={Note01Icon} size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink">Ticket {selectedModalTicket.id} Review</h3>
                  <p className="text-xs text-ink-soft">{selectedModalTicket.department} • Type: <b>{getTypeLabel(selectedModalTicket.type)}</b></p>
                </div>
              </div>
              <button onClick={() => setSelectedModalTicket(null)} className="h-8 w-8 rounded-full border border-cloud bg-canvas hover:bg-paper flex items-center justify-center text-ink-soft font-semibold cursor-pointer">✕</button>
            </div>

            {/* SLA Response Profile Metadata Block */}
            <div className="bg-paper/30 border border-cloud rounded-2xl p-4 text-xs grid gap-4 sm:grid-cols-2">
              <div>
                <span className="text-ink-soft block font-medium">Claimant Identity Info</span>
                <span className="text-sm font-bold text-ink mt-0.5 inline-block">{selectedModalTicket.openedBy}</span>
                <span className="text-ink-soft block text-[11px] mt-0.5 font-mono">{selectedModalTicket.studentEmail}</span>
              </div>
              <div>
                <span className="text-ink-soft block font-medium">Resolution Limit Timeline Standing</span>
                <span className={`text-sm font-bold mt-0.5 inline-block ${selectedModalTicket.ageDays >= selectedModalTicket.slaDays && selectedModalTicket.status !== "resolved" ? "text-rose-600 animate-pulse" : "text-ink"}`}>
                  {selectedModalTicket.ageDays} Business Days Elapsed
                </span>
                <span className="text-ink-soft block text-[10px] mt-0.5">Maximum allowed compliance cap: {selectedModalTicket.slaDays} days</span>
              </div>
            </div>

            {/* Inline Side-by-Side Dual Party Verification Cards */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-ink-soft uppercase tracking-wider block">Both Parties' Transaction Evidence</span>
              <div className="grid gap-4 sm:grid-cols-2">
                
                {/* Student Evidence Card */}
                <div className="border border-cloud rounded-2xl p-4 bg-canvas space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 h-16 w-16 bg-brand/[0.03] rounded-full flex items-center justify-center">
                    <HugeiconsIcon icon={UserIcon} size={28} className="text-brand/10" />
                  </div>
                  <span className="px-2 py-0.5 rounded bg-brand/10 text-brand text-[10px] font-bold uppercase tracking-wide">Student Filing</span>
                  <h5 className="text-xs font-bold text-ink pt-1">{selectedModalTicket.studentEvidence.title}</h5>
                  <p className="text-[11px] text-ink-soft leading-relaxed font-medium">{selectedModalTicket.studentEvidence.description}</p>
                  {selectedModalTicket.studentEvidence.referenceCode && (
                    <div className="text-[10px] text-ink-soft bg-paper border border-cloud p-1 rounded font-mono">
                      Ref: {selectedModalTicket.studentEvidence.referenceCode}
                    </div>
                  )}
                  {selectedModalTicket.studentEvidence.amount && (
                    <div className="text-xs font-bold text-ink pt-1">Value filed: {formatMoneyNGN(selectedModalTicket.studentEvidence.amount)} ₦</div>
                  )}
                </div>

                {/* Representative Verification Card */}
                <div className="border border-cloud rounded-2xl p-4 bg-canvas space-y-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 h-16 w-16 bg-amber-500/[0.03] rounded-full flex items-center justify-center">
                    <HugeiconsIcon icon={ValidationIcon} size={28} className="text-amber-500/10" />
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wide">Rep Status</span>
                  <h5 className="text-xs font-bold text-ink pt-1">{selectedModalTicket.repEvidence.title}</h5>
                  <p className="text-[11px] text-ink-soft leading-relaxed font-medium">{selectedModalTicket.repEvidence.description}</p>
                  {selectedModalTicket.repEvidence.referenceCode && (
                    <div className="text-[10px] text-ink-soft bg-paper border border-cloud p-1 rounded font-mono">
                      Ref: {selectedModalTicket.repEvidence.referenceCode}
                    </div>
                  )}
                  {selectedModalTicket.repEvidence.amount && (
                    <div className="text-xs font-bold text-ink pt-1">Float snapshot: {formatMoneyNGN(selectedModalTicket.repEvidence.amount)} ₦</div>
                  )}
                </div>

              </div>
            </div>

            {/* Direct Resolution Overrides Control Engine */}
            <div className="border border-cloud bg-paper/30 rounded-2xl p-4 space-y-3">
              <span className="text-[11px] font-bold text-ink-soft uppercase tracking-wider block">Direct Resolution Actions</span>
              <div className="flex flex-wrap gap-2">
                <button
                  disabled={selectedModalTicket.status === "resolved"}
                  onClick={() => executeResolution(selectedModalTicket.id, "refund")}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <HugeiconsIcon icon={NineCircleIcon} size={14} /> Issue Refund to Student
                </button>

                <button
                  disabled={selectedModalTicket.status === "resolved"}
                  onClick={() => executeResolution(selectedModalTicket.id, "release")}
                  className="px-3 py-1.5 rounded-xl border border-cloud bg-canvas text-xs font-semibold text-ink hover:bg-paper disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} size={12} className="text-brand" /> Force-Release Payout
                </button>

                <button
                  disabled={selectedModalTicket.status === "resolved"}
                  onClick={() => executeResolution(selectedModalTicket.id, "freeze")}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1 transition-all ml-auto cursor-pointer"
                >
                  <HugeiconsIcon icon={CancelCircleIcon} size={14} /> Freeze Rep Wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}