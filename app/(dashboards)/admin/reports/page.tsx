"use client";

import React, { useState, useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Download01Icon,
  PropertyNewIcon,
  Wallet01Icon,
  Time02Icon,
  LegalDocumentIcon,
  DatabaseIcon,
  Shield01Icon,
  ArrowDown01Icon,
  MoreHorizontalIcon,
  FilterIcon,
  Calendar01Icon,
} from "@hugeicons/core-free-icons";
import PageHeader from "../_components/PageHeader";
import TableCard from "../_components/TableCard";
import StatusBadge from "../_components/StatusBadge";
import { formatMoneyNGN, formatPercent01 } from "../_components/format";

type ReportScope = "financial_summary" | "space_collection" | "rep_performance" | "full_ledger" | "referral_liability";
type ExportFormat = "csv" | "pdf";
type ScheduleFrequency = "daily" | "weekly" | "monthly" | "none";

interface HistoricalReportLog {
  id: string;
  name: string;
  scope: ReportScope;
  format: ExportFormat;
  generatedAt: string;
  fileSize: string;
  status: "ready" | "expired";
  filtersApplied: {
    dateRange: string;
    dueType: string;
    spaceType: string;
  };
}

const initialHistory: HistoricalReportLog[] = [
  { 
    id: "REP-901", 
    name: "Full_Ledger_Q2_Audit.csv", 
    scope: "full_ledger", 
    format: "csv", 
    generatedAt: "2026-07-04 14:20", 
    fileSize: "1.4 MB", 
    status: "ready",
    filtersApplied: { dateRange: "2026-04-01 to 2026-06-30", dueType: "All Taxonomies", spaceType: "All Spaces" }
  },
  { 
    id: "REP-902", 
    name: "Incentive_Referral_Liability_July.pdf", 
    scope: "referral_liability", 
    format: "pdf", 
    generatedAt: "2026-07-03 09:12", 
    fileSize: "420 KB", 
    status: "ready",
    filtersApplied: { dateRange: "2026-07-01 to 2026-07-03", dueType: "Referrals Only", spaceType: "N/A" }
  },
  { 
    id: "REP-903", 
    name: "Space_Collection_RunRate_June.csv", 
    scope: "space_collection", 
    format: "csv", 
    generatedAt: "2026-06-30 18:00", 
    fileSize: "850 KB", 
    status: "expired",
    filtersApplied: { dateRange: "2026-06-01 to 2026-06-30", dueType: "Levy Only", spaceType: "Department" }
  },
];

export default function AdminReportsPage() {
  const [reportHistory, setReportHistory] = useState<HistoricalReportLog[]>(initialHistory);
  const [selectedScope, setSelectedScope] = useState<ReportScope>("financial_summary");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  
  const [startDate, setStartDate] = useState("2026-06-01");
  const [endDate, setStartDateEnd] = useState("2026-07-05");
  const [dueTypeFilter, setDueTypeFilter] = useState("all");
  const [spaceTypeFilter, setSpaceTypeFilter] = useState("all");

  const [scheduleFreq, setScheduleFrequency] = useState<ScheduleFrequency>("none");

  const [activeDropdownRowId, setActiveDropdownRowId] = useState<string | null>(null);
  const [isBuilderModalOpen, setIsBuilderModalOpen] = useState(false);
  const [selectedPreviewReport, setSelectedPreviewReport] = useState<HistoricalReportLog | null>(null);

  const handleTriggerExport = (e: React.FormEvent) => {
    e.preventDefault();

    const scopeLabels: Record<ReportScope, string> = {
      financial_summary: "Financial_Summary",
      space_collection: "Per_Space_Collection_Report",
      rep_performance: "Per_Rep_Performance_Report",
      full_ledger: "Full_Transaction_Ledger_Export",
      referral_liability: "Referral_Liability_Audit",
    };

    const newReport: HistoricalReportLog = {
      id: `REP-${Math.floor(100 + Math.random() * 900)}`,
      name: `${scopeLabels[selectedScope]}_${startDate}_to_${endDate}.${exportFormat}`,
      scope: selectedScope,
      format: exportFormat,
      generatedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
      fileSize: `${Math.floor(150 + Math.random() * 800)} KB`,
      status: "ready",
      filtersApplied: {
        dateRange: `${startDate} to ${endDate}`,
        dueType: dueTypeFilter === "all" ? "All Taxonomies" : dueTypeFilter,
        spaceType: spaceTypeFilter === "all" ? "All Spaces" : spaceTypeFilter,
      }
    };

    setReportHistory([newReport, ...reportHistory]);
    setIsBuilderModalOpen(false);
    alert(`Report compiled successfully: Added file "${newReport.name}" to the historical vault.`);
  };

  const getScopeBadgeLabel = (scope: ReportScope) => {
    const labels: Record<ReportScope, string> = {
      financial_summary: "Financial Breakdown",
      space_collection: "Space Yield",
      rep_performance: "Rep Performance",
      full_ledger: "Transaction Ledger",
      referral_liability: "Referral Liability",
    };
    return labels[scope];
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <PageHeader
        title="Reports & Exports"
        description="Extract raw system transaction records, filter financial yields by due taxonomies, monitor space liabilities, and configure automated recurring tracking reports."
      />

      {/* --- Executive Toolbar Controls --- */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between bg-canvas border border-cloud rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="text-xs text-ink-soft font-semibold">
            Platform referral payout liability: <b className="text-ink">₦70,000 Total</b> <span className="text-amber-600">(₦15,000 pending)</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
          <div className="relative inline-block">
            <select 
              value={scheduleFreq} 
              onChange={(e) => {
                const val = e.target.value as ScheduleFrequency;
                setScheduleFrequency(val);
                if (val !== "none") {
                  const email = prompt("Enter target administrative email destination for recurring reports:");
                  if (email) alert(`Recurrence pipeline rule established: Syncing updates to ${email}.`);
                }
              }} 
              className="h-9 pl-3 pr-8 py-1 text-xs bg-canvas border border-cloud rounded-md text-ink outline-none focus:ring-1 focus:ring-brand focus:border-brand font-medium cursor-pointer appearance-none transition-all shadow-2xs"
            >
              <option value="none">Manual Generation Mode</option>
              <option value="daily">Daily Automated Snapshot</option>
              <option value="weekly">Weekly Consolidated Sync</option>
              <option value="monthly">Monthly Consolidated Fiscal Ledger</option>
            </select>
            <span className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none text-ink-soft">
              <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={2.5} />
            </span>
          </div>

          <button 
            type="button" 
            onClick={() => setIsBuilderModalOpen(true)}
            className="h-9 px-3 rounded-md bg-brand text-white text-xs font-bold hover:bg-brand/90 transition-colors shadow-2xs inline-flex items-center gap-1"
          >
            <HugeiconsIcon icon={FilterIcon} size={14} /> Open Custom Builder
          </button>
        </div>
      </div>

      {/* --- Full Width Matrix History Data Table Vault --- */}
      <TableCard title="Historical Document Vault" subtitle="Click any report row line to reveal audit parameters and filter specifics.">
        <div className="w-full overflow-auto rounded-xl border border-cloud bg-canvas shadow-xs">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="border-b border-cloud bg-paper/30 font-semibold text-xs text-ink-soft uppercase tracking-wider">
              <tr>
                <th className="p-4 align-middle">Generated Filename File</th>
                <th className="p-4 align-middle">Target Scope Class</th>
                <th className="p-4 align-middle">Document Format</th>
                <th className="p-4 align-middle">Binary File Specs</th>
                <th className="p-4 align-middle">Generation Date Context</th>
                <th className="p-4 align-middle">Data Status</th>
                <th className="p-4 align-middle text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cloud bg-canvas text-ink text-xs font-medium">
              {reportHistory.map((log) => (
                <tr 
                  key={log.id} 
                  onClick={() => setSelectedPreviewReport(log)}
                  className="hover:bg-paper/20 transition-colors cursor-pointer"
                >
                  <td className="p-4 align-middle font-bold tracking-tight text-ink flex items-center gap-1.5">
                    <HugeiconsIcon icon={LegalDocumentIcon} size={14} className="text-ink-soft" />
                    {log.name}
                  </td>
                  <td className="p-4 align-middle">
                    <span className="font-semibold text-ink bg-paper border border-cloud px-2 py-0.5 rounded text-[11px]">
                      {getScopeBadgeLabel(log.scope)}
                    </span>
                  </td>
                  <td className="p-4 align-middle font-mono font-bold uppercase text-brand">{log.format}</td>
                  <td className="p-4 align-middle text-ink-soft font-semibold">{log.fileSize}</td>
                  <td className="p-4 align-middle text-ink-soft">{log.generatedAt}</td>
                  <td className="p-4 align-middle">
                    <StatusBadge tone={log.status === "ready" ? "ok" : "neutral"}>{log.status}</StatusBadge>
                  </td>

                  <td className="p-4 align-middle text-right relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setActiveDropdownRowId(activeDropdownRowId === log.id ? null : log.id)}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-cloud bg-canvas hover:bg-paper text-ink transition-colors outline-none cursor-pointer"
                    >
                      <HugeiconsIcon icon={MoreHorizontalIcon} size={14} />
                    </button>

                    {activeDropdownRowId === log.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActiveDropdownRowId(null)} />
                        <div className="absolute right-4 mt-1 w-44 rounded-md border border-cloud bg-canvas p-1 text-ink shadow-md z-20 text-left">
                          <button
                            disabled={log.status !== "ready"}
                            type="button"
                            onClick={() => {
                              alert(`Re-download active token verified: Fetching binary file stream data...`);
                              setActiveDropdownRowId(null);
                            }}
                            className="w-full px-2 py-1.5 text-xs text-left font-medium rounded-sm hover:bg-paper transition-colors text-ink disabled:opacity-40 cursor-pointer block"
                          >
                            Download Binary File
                          </button>
                        </div>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableCard>

      {/* --- shadcn Overlay Dialog Modal: Report Preview Metadata --- */}
      {selectedPreviewReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs transition-opacity animate-fadeIn">
          <div className="fixed inset-0" onClick={() => setSelectedPreviewReport(null)} />
          
          <div className="relative w-full max-w-lg rounded-3xl border border-cloud bg-canvas p-6 shadow-xl space-y-5 z-10 animate-scaleUp">
            <div className="flex items-start justify-between pb-3 border-b border-cloud">
              <div className="flex items-center gap-2.5">
                <HugeiconsIcon icon={LegalDocumentIcon} size={20} className="text-brand" />
                <div>
                  <h3 className="text-sm font-bold text-ink">Report File Blueprint</h3>
                  <p className="text-xs text-ink-soft font-mono mt-0.5">{selectedPreviewReport.id}</p>
                </div>
              </div>
              <button onClick={() => setSelectedPreviewReport(null)} className="h-8 w-8 rounded-full border border-cloud bg-canvas hover:bg-paper flex items-center justify-center text-ink-soft text-xs cursor-pointer">✕</button>
            </div>

            <div className="bg-paper/30 border border-cloud rounded-xl p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-ink-soft font-medium">Document Name</span>
                <span className="font-bold text-ink">{selectedPreviewReport.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-soft font-medium">Target Scope</span>
                <span className="font-semibold text-ink">{getScopeBadgeLabel(selectedPreviewReport.scope)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-soft font-medium">Compiled Date Context</span>
                <span className="text-ink font-medium">{selectedPreviewReport.generatedAt}</span>
              </div>
            </div>

            {/* Applied Custom Query Filters Specifications Sub-Card */}
            <div className="p-3.5 border border-cloud rounded-xl bg-canvas text-xs space-y-1.5">
              <span className="text-[10px] font-bold text-ink-soft uppercase tracking-wider block">Query Filter Framework Applied</span>
              <div className="text-ink-soft">Target Date Window: <b className="text-ink">{selectedPreviewReport.filtersApplied.dateRange}</b></div>
              <div className="text-ink-soft">Dues Taxonomy Filter: <b className="text-ink">{selectedPreviewReport.filtersApplied.dueType}</b></div>
              <div className="text-ink-soft">Space hub Form: <b className="text-ink">{selectedPreviewReport.filtersApplied.spaceType}</b></div>
            </div>

            <div className="rounded-xl border border-cloud bg-paper/20 p-3 text-xs flex justify-between items-center">
              <div>
                <span className="text-ink-soft block">File Size Metric:</span>
                <span className="font-mono text-ink font-bold uppercase">{selectedPreviewReport.format} ({selectedPreviewReport.fileSize})</span>
              </div>
              <button 
                disabled={selectedPreviewReport.status !== "ready"}
                onClick={() => alert("Fetching targeted compiled spreadsheet binary...")}
                className="h-9 px-3 bg-brand text-white font-bold rounded-lg hover:bg-brand/90 text-xs transition-colors disabled:opacity-40 inline-flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <HugeiconsIcon icon={Download01Icon} size={13} /> Download File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Custom Layout Builder Overlay Dialog Modal --- */}
      {isBuilderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs transition-all animate-fadeIn">
          <div className="fixed inset-0" onClick={() => setIsBuilderModalOpen(false)} />
          
          <div className="relative w-full max-w-2xl rounded-3xl border border-cloud bg-canvas p-6 shadow-xl space-y-5 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-cloud">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={FilterIcon} size={20} className="text-brand" />
                <div>
                  <h3 className="text-sm font-bold text-ink">Custom Report Configuration</h3>
                  <p className="text-xs text-ink-soft mt-0.5">Select scopes, tax categories, and calendar date frames before extraction.</p>
                </div>
              </div>
              <button onClick={() => setIsBuilderModalOpen(false)} className="h-8 w-8 rounded-full border border-cloud bg-canvas hover:bg-paper flex items-center justify-center text-ink-soft text-xs cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleTriggerExport} className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wider block mb-2">Target Data Document Scope</label>
                <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {[
                    { id: "financial_summary", label: "Financial Summary", hint: "Overall ledger run-rate" },
                    { id: "space_collection", label: "Per-Space Collection", hint: "Yield data by custom spaces" },
                    { id: "rep_performance", label: "Per-Rep Performance", hint: "Proxy speed & clearance rates" },
                    { id: "full_ledger", label: "Full Transaction Ledger", hint: "Complete core tracking trail block" },
                    { id: "referral_liability", label: "Referral Payout Liability", hint: "Audits growth bonus lines" },
                  ].map((s) => (
                    <div
                      key={s.id}
                      onClick={() => setSelectedScope(s.id as ReportScope)}
                      className={`border p-2.5 rounded-xl cursor-pointer text-left transition-all ${selectedScope === s.id ? "border-brand bg-brand/[0.015] font-semibold shadow-2xs" : "border-cloud bg-canvas hover:bg-paper/40"}`}
                    >
                      <span className="font-bold text-ink block">{s.label}</span>
                      <span className="text-[10px] text-ink-soft block mt-0.5 leading-tight">{s.hint}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 border-t border-cloud pt-3">
                <div>
                  <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wider block mb-1">Calendar Timeline Frame</label>
                  <div className="flex gap-2">
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full text-xs h-9 rounded-md border border-cloud px-2 bg-paper/20 text-ink font-medium" />
                    <input type="date" value={endDate} onChange={(e) => setStartDateEnd(e.target.value)} className="w-full text-xs h-9 rounded-md border border-cloud px-2 bg-paper/20 text-ink font-medium" />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wider block mb-1">Format Extension Architecture</label>
                  <div className="flex gap-2">
                    {["csv", "pdf"].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setExportFormat(f as ExportFormat)}
                        className={`flex-1 h-9 rounded-xl text-xs font-bold border transition-all uppercase ${exportFormat === f ? "border-brand bg-brand text-white shadow-2xs" : "border-cloud bg-canvas text-ink-soft hover:bg-paper"}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 border-t border-cloud pt-3">
                <div>
                  <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wider block mb-1">Filter by Due Taxonomy Class</label>
                  <div className="relative">
                    <select value={dueTypeFilter} onChange={(e) => setDueTypeFilter(e.target.value)} className="w-full h-9 pl-2 pr-7 text-xs bg-canvas border border-cloud rounded-md text-ink outline-none cursor-pointer appearance-none">
                      <option value="all">All Taxonomies (Levies, Handouts, Kits, Access, Events)</option>
                      <option value="Levy">Levies Only</option>
                      <option value="Handout">Handouts Only</option>
                      <option value="Event/Dinner">Events / Dinners Only</option>
                      <option value="Welfare Contribution">Welfare Contributions Only</option>
                    </select>
                    <span className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-ink-soft"><HugeiconsIcon icon={ArrowDown01Icon} size={14} /></span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-ink-soft uppercase tracking-wider block mb-1">Filter by Space Classification Type</label>
                  <div className="relative">
                    <select value={spaceTypeFilter} onChange={(e) => setSpaceTypeFilter(e.target.value)} className="w-full h-9 pl-2 pr-7 text-xs bg-canvas border border-cloud rounded-md text-ink outline-none cursor-pointer appearance-none">
                      <option value="all">All Workspace Forms (Departments, Faculties, Clubs)</option>
                      <option value="Department">Departments Only</option>
                      <option value="Faculty">Faculties Only</option>
                      <option value="Club">Clubs / Associations Only</option>
                    </select>
                    <span className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-ink-soft"><HugeiconsIcon icon={ArrowDown01Icon} size={14} /></span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-cloud">
                <button 
                  type="button" 
                  onClick={() => setIsBuilderModalOpen(false)} 
                  className="px-4 py-2 border border-cloud rounded-xl text-xs font-semibold text-ink-soft hover:bg-paper cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-brand text-white rounded-xl font-bold hover:bg-brand/90 transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1"
                >
                  <HugeiconsIcon icon={Download01Icon} size={13} /> Compile & Download Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}