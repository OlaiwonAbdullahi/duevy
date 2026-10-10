"use client";

import React, { useMemo, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  PropertyNewIcon,
  Note01Icon,
  AlertCircleIcon,
  MoreHorizontalIcon,
  ArrowDown01Icon,
  UserIcon,
  Settings01Icon,
  Download01Icon,
} from "@hugeicons/core-free-icons";
import PageHeader from "../_components/PageHeader";
import TableCard from "../_components/TableCard";
import StatusBadge from "../_components/StatusBadge";
import { formatMoneyNGN, formatPercent01 } from "../_components/format";
import { mockDepartments, mockReps } from "../_components/MockData";

type SpaceType = "Department" | "Faculty" | "Association" | "Club";
type DueTaxonomy = "Levy" | "Handout" | "Event/Dinner" | "Kit" | "Welfare Contribution" | "Access Pass";
type PaymentStanding = "Paid" | "Partial" | "Unpaid";

interface DueStructureItem {
  id: string;
  name: string;
  type: DueTaxonomy;
  amount: number;
}

interface SpaceMember {
  id: string;
  name: string;
  tag: "Member" | "Guest";
  status: PaymentStanding;
  totalOwed: number;
}

interface EnhancedSpace {
  id: string;
  name: string;
  school: string;
  type: SpaceType;
  memberCount: number;
  duesTarget: number;
  collectedAmount: number;
  assignedRepIds: string[];
  overdueCount: number;
  overdueAmount: number;
  duesTaxonomy: DueStructureItem[];
  membersList: SpaceMember[];
  isArchived: boolean;
}

function toneForCollectionRatio(ratio: number) {
  if (ratio >= 0.85) return "ok";
  if (ratio >= 0.65) return "warn";
  return "bad";
}

function toneForPayment(status: PaymentStanding) {
  if (status === "Paid") return "ok";
  if (status === "Partial") return "warn";
  return "bad";
}

export default function AdminSpacesPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
  // States to manage dropdown targets and detail context modals
  const [activeDropdownRowId, setActiveDropdownRowId] = useState<string | null>(null);
  const [selectedModalSpace, setSelectedModalSpace] = useState<EnhancedSpace | null>(null);
  const [modalTab, setModalTab] = useState<"dues" | "members" | "analytics">("dues");

  // Local state array to facilitate inline workspace alterations
  const [spacesList, setSpacesList] = useState<EnhancedSpace[]>(() =>
    mockDepartments.map((d, index) => {
      const spaceTypes: SpaceType[] = ["Department", "Faculty", "Association", "Club"];
      const selectedType = spaceTypes[index % spaceTypes.length];
      
      return {
        id: d.id,
        name: d.name,
        school: d.school,
        type: selectedType,
        memberCount: d.memberCount ?? 140,
        duesTarget: d.duesTarget,
        collectedAmount: d.collectedAmount,
        assignedRepIds: d.assignedRepIds ?? ["rep_01"],
        overdueCount: Math.round((d.memberCount ?? 140) * 0.15),
        overdueAmount: Math.round(d.duesTarget * 0.12),
        isArchived: false,
        duesTaxonomy: [
          { id: "d1", name: "First Semester Core Dues", type: "Levy", amount: 10000 },
          { id: "d2", name: "Faculty Annual Gala Entry", type: "Event/Dinner", amount: 5000 },
          { id: "d3", name: "Departmental Lab Blueprint Pack", type: "Handout", amount: 3500 },
          { id: "d4", name: "Welfare Emergency Stack", type: "Welfare Contribution", amount: 2000 }
        ],
        membersList: [
          { id: "m1", name: "Amara Nwosu", tag: "Member", status: "Paid", totalOwed: 0 },
          { id: "m2", name: "Chidi Egwu", tag: "Member", status: "Partial", totalOwed: 5000 },
          { id: "m3", name: "Tunde Bakare", tag: "Guest", status: "Unpaid", totalOwed: 20500 }
        ]
      };
    })
  );

  // Filter matrix parsing pipeline
  const filteredSpaces = useMemo(() => {
    return spacesList.filter((s) => {
      if (s.isArchived) return false;
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.school.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || s.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [spacesList, search, typeFilter]);

  // Executive trigger state functions
  const handleAdjustTarget = (id: string) => {
    const freshAmount = prompt("Enter new target allocation metrics limit (NGN):");
    if (!freshAmount || isNaN(parseFloat(freshAmount))) return;
    
    setSpacesList(prev => prev.map(s => s.id === id ? { ...s, duesTarget: parseFloat(freshAmount) } : s));
    if (selectedModalSpace?.id === id) {
      setSelectedModalSpace(prev => prev ? { ...prev, duesTarget: parseFloat(freshAmount) } : null);
    }
  };

  const handleArchiveSpace = (id: string) => {
    if (confirm("Are you sure you want to transition this space to historical archive status? This halts active rep collection access keys.")) {
      setSpacesList(prev => prev.map(s => s.id === id ? { ...s, isArchived: true } : s));
      setSelectedModalSpace(null);
      setActiveDropdownRowId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <PageHeader
        title="Spaces Registry"
        description="Configure collection hubs, assign representative nodes, inspect student ledger payments, and review due taxonomy lines."
      />

      {/* --- Filter Toolbar --- */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between bg-canvas border border-cloud rounded-xl p-4 shadow-sm">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-3 flex items-center text-ink-soft">
            <HugeiconsIcon icon={Search01Icon} size={15} />
          </span>
          <input
            type="text"
            placeholder="Search spaces by title label or institutional school..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 rounded-md border border-cloud bg-paper/20 pl-9 pr-4 py-2 text-sm text-ink placeholder:text-ink-soft outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-all"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Custom shadcn Select Layout: Classification Filter */}
          <div className="relative inline-block">
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)} 
              className="h-9 pl-3 pr-8 py-1 text-xs bg-canvas border border-cloud rounded-md text-ink outline-none focus:ring-1 focus:ring-brand focus:border-brand font-medium cursor-pointer appearance-none transition-all shadow-2xs"
            >
              <option value="all">All Classifications</option>
              <option value="Department">Departments</option>
              <option value="Faculty">Faculties</option>
              <option value="Association">Associations</option>
              <option value="Club">Clubs & Units</option>
            </select>
            <span className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-ink-soft">
              <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={2.5} />
            </span>
          </div>

          <button onClick={() => alert("Redirecting to Space Configuration Builder node...")} className="h-9 px-3 rounded-md bg-brand text-white text-xs font-bold hover:bg-brand/90 transition-colors shadow-2xs">
            + Create Space
          </button>
        </div>
      </div>

      {/* --- Full Width Matrix Data Table --- */}
      <TableCard title="Portals & Spaces Ledger" subtitle="Comprehensive list of institution hubs and core performance runs">
        <div className="w-full overflow-auto rounded-xl border border-cloud bg-canvas shadow-xs">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="border-b border-cloud bg-paper/30 font-semibold text-xs text-ink-soft uppercase tracking-wider">
              <tr>
                <th className="p-4 align-middle">Space Hub Title</th>
                <th className="p-4 align-middle">Institutional Affiliation</th>
                <th className="p-4 align-middle">Classification</th>
                <th className="p-4 align-middle">Member Census</th>
                <th className="p-4 align-middle">Dues Target</th>
                <th className="p-4 align-middle">Yield Collected</th>
                <th className="p-4 align-middle">Collection Rate</th>
                <th className="p-4 align-middle text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cloud bg-canvas text-ink text-xs font-medium">
              {filteredSpaces.map((s) => {
                const ratio = s.collectedAmount / s.duesTarget;

                return (
                  <tr 
                    key={s.id} 
                    onClick={() => { setSelectedModalSpace(s); setModalTab("dues"); }}
                    className="hover:bg-paper/20 transition-colors cursor-pointer"
                  >
                    <td className="p-4 align-middle font-bold text-ink">{s.name}</td>
                    <td className="p-4 align-middle text-ink-soft font-semibold">{s.school}</td>
                    <td className="p-4 align-middle">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold border border-cloud bg-paper/50">
                        {s.type}
                      </span>
                    </td>
                    <td className="p-4 align-middle text-ink font-semibold">{s.memberCount} Accounts</td>
                    <td className="p-4 align-middle font-semibold text-ink">{formatMoneyNGN(s.duesTarget)} ₦</td>
                    <td className="p-4 align-middle font-semibold text-emerald-600">{formatMoneyNGN(s.collectedAmount)} ₦</td>
                    <td className="p-4 align-middle">
                      <StatusBadge tone={toneForCollectionRatio(ratio)}>{formatPercent01(ratio)}</StatusBadge>
                    </td>

                    {/* Row Context Menu Trigger Actions dropdown */}
                    <td className="p-4 align-middle text-right relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setActiveDropdownRowId(activeDropdownRowId === s.id ? null : s.id)}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-cloud bg-canvas hover:bg-paper text-ink transition-colors outline-none cursor-pointer"
                      >
                        <HugeiconsIcon icon={MoreHorizontalIcon} size={14} />
                      </button>

                      {activeDropdownRowId === s.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setActiveDropdownRowId(null)} />
                          <div className="absolute right-4 mt-1 w-48 rounded-md border border-cloud bg-canvas p-1 text-ink shadow-md z-20 text-left divide-y divide-cloud">
                            <div className="py-1">
                              <button
                                type="button"
                                onClick={() => handleAdjustTarget(s.id)}
                                className="w-full px-2 py-1.5 text-xs text-left font-medium rounded-sm hover:bg-paper transition-colors text-ink cursor-pointer block"
                              >
                                Adjust Target Limit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  alert("Opening representative allocation modal...");
                                  setActiveDropdownRowId(null);
                                }}
                                className="w-full px-2 py-1.5 text-xs text-left font-medium rounded-sm hover:bg-paper transition-colors text-ink cursor-pointer block"
                              >
                                Reassign Proxies Rep
                              </button>
                            </div>
                            <div className="py-1">
                              <button
                                type="button"
                                onClick={() => handleArchiveSpace(s.id)}
                                className="w-full px-2 py-1.5 text-xs text-left font-bold rounded-sm hover:bg-rose-50 text-rose-700 cursor-pointer block"
                              >
                                Archive Space Hub
                              </button>
                            </div>
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

      {/* --- Detailed Space Parameter Dialog Overlay Modal --- */}
      {selectedModalSpace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs transition-all animate-fadeIn">
          <div className="fixed inset-0" onClick={() => setSelectedModalSpace(null)} />
          
          <div className="relative w-full max-w-2xl rounded-3xl border border-cloud bg-canvas p-6 shadow-xl space-y-6 z-10 max-h-[90vh] overflow-y-auto">
            {/* Header Layout */}
            <div className="flex items-start justify-between pb-4 border-b border-cloud">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-cloud flex items-center justify-center text-brand shrink-0">
                  <HugeiconsIcon icon={PropertyNewIcon} size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink">{selectedModalSpace.name}</h3>
                  <p className="text-xs text-ink-soft">{selectedModalSpace.type} classification • {selectedModalSpace.school}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedModalSpace(null)}
                className="h-8 w-8 rounded-full border border-cloud bg-canvas hover:bg-paper flex items-center justify-center text-ink-soft font-semibold cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* General Highlights Cards Row */}
            <div className="grid gap-4 sm:grid-cols-3 text-xs">
              <div className="border border-cloud bg-paper/20 rounded-xl p-3.5">
                <span className="text-ink-soft block font-semibold">Dues Targets Pool</span>
                <span className="text-base font-bold text-ink mt-1 inline-block">{formatMoneyNGN(selectedModalSpace.duesTarget)} ₦</span>
              </div>
              <div className="border border-cloud bg-paper/20 rounded-xl p-3.5">
                <span className="text-ink-soft block font-semibold">Collected Ledger Balance</span>
                <span className="text-base font-bold text-emerald-600 mt-1 inline-block">{formatMoneyNGN(selectedModalSpace.collectedAmount)} ₦</span>
              </div>
              <div className="border border-cloud bg-paper/20 rounded-xl p-3.5">
                <span className="text-ink-soft block font-semibold">Overdue Uncollected Debt</span>
                <span className="text-base font-bold text-rose-700 mt-1 inline-block">{formatMoneyNGN(selectedModalSpace.overdueAmount)} ₦</span>
              </div>
            </div>

            {/* Content Tabs Navigation System */}
            <div className="flex border-b border-cloud text-sm">
              <button onClick={() => setModalTab("dues")} className={`pb-2.5 px-4 font-semibold transition-all border-b-2 -mb-[2px] ${modalTab === "dues" ? "border-brand text-brand" : "border-transparent text-ink-soft hover:text-ink"}`}>
                Dues Taxonomies
              </button>
              <button onClick={() => setModalTab("members")} className={`pb-2.5 px-4 font-semibold transition-all border-b-2 -mb-[2px] ${modalTab === "members" ? "border-brand text-brand" : "border-transparent text-ink-soft hover:text-ink"}`}>
                Member Roll Ledger
              </button>
              <button onClick={() => setModalTab("analytics")} className={`pb-2.5 px-4 font-semibold transition-all border-b-2 -mb-[2px] ${modalTab === "analytics" ? "border-brand text-brand" : "border-transparent text-ink-soft hover:text-ink"}`}>
                Debt Signals
              </button>
            </div>

            {/* Dynamic Modal View Wrapper */}
            <div className="min-h-[160px]">
              {modalTab === "dues" && (
                <div className="space-y-2">
                  {selectedModalSpace.duesTaxonomy.map((due) => (
                    <div key={due.id} className="flex items-center justify-between p-3 border border-cloud rounded-xl bg-canvas text-xs">
                      <div>
                        <span className="font-semibold text-ink block">{due.name}</span>
                        <span className="text-[10px] bg-paper border border-cloud px-1.5 py-0.5 rounded text-ink-soft uppercase font-bold mt-1 inline-block">{due.type}</span>
                      </div>
                      <span className="font-bold text-ink">{formatMoneyNGN(due.amount)} ₦</span>
                    </div>
                  ))}
                </div>
              )}

              {modalTab === "members" && (
                <div className="border border-cloud rounded-xl overflow-hidden bg-canvas">
                  <table className="w-full text-left text-xs text-ink-soft">
                    <thead className="bg-paper font-semibold text-ink border-b border-cloud">
                      <tr>
                        <th className="p-2.5">Student Alias</th>
                        <th className="p-2.5">Tier Tag</th>
                        <th className="p-2.5">Standing</th>
                        <th className="p-2.5 text-right">Owed Cache</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cloud">
                      {selectedModalSpace.membersList.map((m) => (
                        <tr key={m.id}>
                          <td className="p-2.5 font-medium text-ink">{m.name}</td>
                          <td className="p-2.5"><span className="text-[10px] font-bold uppercase text-ink-soft">{m.tag}</span></td>
                          <td className="p-2.5"><StatusBadge tone={toneForPayment(m.status)}>{m.status}</StatusBadge></td>
                          <td className="p-2.5 text-right font-semibold text-ink">{formatMoneyNGN(m.totalOwed)} ₦</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {modalTab === "analytics" && (
                <div className="space-y-3 bg-paper/30 border border-cloud p-4 rounded-xl text-xs">
                  <div className="flex items-center gap-2 text-rose-800 font-semibold">
                    <HugeiconsIcon icon={AlertCircleIcon} size={16} />
                    Liquidity Discrepancy Signal Tracked
                  </div>
                  <p className="text-[11px] text-ink-soft leading-relaxed">
                    This space possesses an overdue total of <b>{formatMoneyNGN(selectedModalSpace.overdueAmount)} NGN</b> across <b>{selectedModalSpace.overdueCount} accounts</b>. This represents roughly <b>{formatPercent01(selectedModalSpace.overdueAmount / selectedModalSpace.duesTarget)}</b> of the total target limit constraint.
                  </p>
                  <div className="text-right">
                    <button onClick={() => alert("Broadcast alerts dispatched.")} className="text-xs font-bold text-brand hover:underline cursor-pointer">
                      Issue Overdue Alerts Broadcast →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Global Overrides Control Suit Footer */}
            <div className="border border-cloud bg-paper/30 rounded-2xl p-4 space-y-3">
              <span className="text-[11px] font-bold text-ink-soft uppercase tracking-wider block">Workspace Modifications Engine</span>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => handleAdjustTarget(selectedModalSpace.id)} className="px-3 py-1.5 rounded-xl border border-cloud bg-canvas text-xs font-semibold text-ink hover:bg-paper transition-all cursor-pointer">
                  Adjust Target Limit
                </button>
                <button onClick={() => alert("Merge & Split Engine configuration initialized.")} className="px-3 py-1.5 rounded-xl border border-cloud bg-canvas text-xs font-semibold text-ink hover:bg-paper transition-all cursor-pointer">
                  Merge / Split Space
                </button>
                <button onClick={() => handleArchiveSpace(selectedModalSpace.id)} className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold hover:bg-rose-100 transition-all ml-auto cursor-pointer">
                  Archive Space Hub
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-cloud">
              <button 
                type="button" 
                onClick={() => setSelectedModalSpace(null)} 
                className="px-4 py-2 border border-cloud rounded-xl text-xs font-semibold text-ink-soft hover:bg-paper cursor-pointer transition-colors"
              >
                Close Space Profile
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}