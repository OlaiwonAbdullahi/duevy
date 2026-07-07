"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Analytics01Icon, Download01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BRAND_INPUT } from "../../dashboard/_components/form-styles";
import PageHeader from "../_components/PageHeader";
import TableCard from "../_components/TableCard";
import StatusBadge from "../_components/StatusBadge";
import { DataTable } from "../_components/DataTable";
import { FilterSelect } from "../_components/Toolbar";
import { AdminModal } from "../_components/AdminModal";
import { cn } from "@/lib/utils";

type ReportScope = "financial_summary" | "space_collection" | "rep_performance" | "full_ledger";
type ExportFormat = "csv" | "pdf";

interface ReportLog {
  id: string;
  name: string;
  scope: ReportScope;
  format: ExportFormat;
  generatedAt: string;
  fileSize: string;
  status: "ready" | "expired";
}

const SCOPE_LABELS: Record<ReportScope, string> = {
  financial_summary: "Financial summary",
  space_collection: "Per-space collection",
  rep_performance: "Per-rep performance",
  full_ledger: "Full transaction ledger",
};

const initialHistory: ReportLog[] = [
  {
    id: "REP-901",
    name: "Full_Ledger_Q2_Audit.csv",
    scope: "full_ledger",
    format: "csv",
    generatedAt: "2026-07-04 14:20",
    fileSize: "1.4 MB",
    status: "ready",
  },
  {
    id: "REP-902",
    name: "Financial_Summary_July.pdf",
    scope: "financial_summary",
    format: "pdf",
    generatedAt: "2026-07-03 09:12",
    fileSize: "420 KB",
    status: "ready",
  },
  {
    id: "REP-903",
    name: "Space_Collection_June.csv",
    scope: "space_collection",
    format: "csv",
    generatedAt: "2026-06-30 18:00",
    fileSize: "850 KB",
    status: "expired",
  },
];

export default function AdminReportsPage() {
  const [history, setHistory] = useState<ReportLog[]>(initialHistory);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [scope, setScope] = useState<ReportScope>("financial_summary");
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [startDate, setStartDate] = useState("2026-06-01");
  const [endDate, setEndDate] = useState("2026-07-05");

  const generateReport = () => {
    const report: ReportLog = {
      id: `REP-${Math.floor(100 + Math.random() * 900)}`,
      name: `${SCOPE_LABELS[scope].replaceAll(" ", "_")}_${startDate}_to_${endDate}.${format}`,
      scope,
      format,
      generatedAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      fileSize: `${Math.floor(150 + Math.random() * 800)} KB`,
      status: "ready",
    };
    setHistory((prev) => [report, ...prev]);
    setBuilderOpen(false);
    toast(`Report ready: ${report.name}`);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Reports"
        description="Export financial and performance data as CSV or PDF."
        right={
          <Button variant="brand" size="pill" onClick={() => setBuilderOpen(true)}>
            New report
          </Button>
        }
      />

      <TableCard title="Generated reports" subtitle="Recent exports and their download status">
        <DataTable
          headers={[
            { label: "Report" },
            { label: "Scope" },
            { label: "Format" },
            { label: "Size" },
            { label: "Generated" },
            { label: "Status" },
            { label: "", align: "right" },
          ]}
        >
          {history.map((log) => (
            <tr key={log.id}>
              <td className="p-4 font-semibold text-ink">{log.name}</td>
              <td className="p-4">{SCOPE_LABELS[log.scope]}</td>
              <td className="p-4 font-mono text-xs font-semibold uppercase text-brand">
                {log.format}
              </td>
              <td className="p-4 text-ink-soft">{log.fileSize}</td>
              <td className="p-4 whitespace-nowrap text-xs text-ink-soft">
                {log.generatedAt}
              </td>
              <td className="p-4">
                <StatusBadge tone={log.status === "ready" ? "ok" : "neutral"}>
                  {log.status}
                </StatusBadge>
              </td>
              <td className="p-4 text-right">
                <Button
                  variant="brand-outline"
                  size="pill"
                  disabled={log.status !== "ready"}
                  onClick={() => toast(`Downloading ${log.name}…`)}
                >
                  <HugeiconsIcon icon={Download01Icon} size={14} data-icon="inline-start" />
                  Download
                </Button>
              </td>
            </tr>
          ))}
        </DataTable>
      </TableCard>

      {builderOpen && (
        <AdminModal
          icon={Analytics01Icon}
          title="New report"
          description="Pick a scope, date range and format."
          onClose={() => setBuilderOpen(false)}
          footer={
            <>
              <Button variant="brand-outline" size="pill" onClick={() => setBuilderOpen(false)}>
                Cancel
              </Button>
              <Button variant="brand" size="pill" onClick={generateReport}>
                Generate report
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 text-xs font-semibold text-ink-soft">Scope</p>
              <FilterSelect
                value={scope}
                onChange={(next) => setScope(next as ReportScope)}
                label="Report scope"
                options={Object.entries(SCOPE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="report-start"
                  className="mb-1.5 block text-xs font-semibold text-ink-soft"
                >
                  From
                </label>
                <Input
                  id="report-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={BRAND_INPUT}
                />
              </div>
              <div>
                <label
                  htmlFor="report-end"
                  className="mb-1.5 block text-xs font-semibold text-ink-soft"
                >
                  To
                </label>
                <Input
                  id="report-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={BRAND_INPUT}
                />
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold text-ink-soft">Format</p>
              <div className="flex gap-2">
                {(["csv", "pdf"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    className={cn(
                      "h-10 flex-1 cursor-pointer rounded-full border text-xs font-semibold uppercase transition-colors",
                      format === f
                        ? "border-brand bg-brand text-white"
                        : "border-cloud bg-canvas text-ink-soft hover:bg-paper",
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
