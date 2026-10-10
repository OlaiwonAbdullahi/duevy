"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Analytics01Icon, Download01Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BRAND_INPUT } from "../../dashboard/_components/form-styles";
import { EmptyState } from "../../dashboard/_components/EmptyState";
import PageHeader from "../_components/PageHeader";
import TableCard from "../_components/TableCard";
import StatusBadge, { type StatusTone } from "../_components/StatusBadge";
import { DataTable } from "../_components/DataTable";
import { FilterSelect } from "../_components/Toolbar";
import { AdminModal } from "../_components/AdminModal";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import {
  createReport,
  listReports,
  reportDownloadPath,
  type Report,
  type ReportScope,
} from "@/lib/api/admin";

type ExportFormat = "csv" | "pdf";

const SCOPE_LABELS: Record<ReportScope, string> = {
  financial_summary: "Financial summary",
  space_collection: "Per-space collection",
  rep_performance: "Per-rep performance",
  full_ledger: "Full transaction ledger",
};

function statusTone(status: string): StatusTone {
  if (status === "ready") return "ok";
  if (status === "expired") return "neutral";
  return "warn";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminReportsPage() {
  const [history, setHistory] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [scope, setScope] = useState<ReportScope>("financial_summary");
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [generating, setGenerating] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await listReports({ perPage: 100 });
      setHistory(data);
    } catch {
      toast.error("Couldn't load reports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function generateReport() {
    if (!startDate || !endDate) {
      toast.error("Pick a date range first.");
      return;
    }
    setGenerating(true);
    try {
      const report = await createReport({ scope, format, from: startDate, to: endDate });
      setHistory((prev) => [report, ...prev]);
      setBuilderOpen(false);
      toast.success(`${SCOPE_LABELS[report.scope]} report queued.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't generate this report.");
    } finally {
      setGenerating(false);
    }
  }

  async function download(report: Report) {
    setDownloadingId(report.id);
    try {
      const blob = await apiClient.getBlob(reportDownloadPath(report.id));
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${SCOPE_LABELS[report.scope].replaceAll(" ", "_")}_${report.from}_to_${report.to}.${report.format}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't download this report.");
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Reports"
        description="Export financial and performance data as CSV or PDF."
        right={
          <div className="flex gap-2">
            <Button variant="brand-outline" size="pill" onClick={load} disabled={loading}>
              <HugeiconsIcon icon={RefreshIcon} size={14} />
              Refresh
            </Button>
            <Button variant="brand" size="pill" onClick={() => setBuilderOpen(true)}>
              New report
            </Button>
          </div>
        }
      />

      <TableCard title="Generated reports" subtitle="Recent exports and their download status">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-paper" />
            ))}
          </div>
        ) : history.length === 0 ? (
          <EmptyState
            icon={Analytics01Icon}
            title="No reports yet"
            description="Generate one to see it show up here."
          />
        ) : (
          <DataTable
            headers={[
              { label: "Scope" },
              { label: "Range" },
              { label: "Format" },
              { label: "Generated" },
              { label: "Status" },
              { label: "", align: "right" },
            ]}
          >
            {history.map((report) => (
              <tr key={report.id}>
                <td className="p-4 font-semibold text-ink">{SCOPE_LABELS[report.scope]}</td>
                <td className="p-4 text-ink-soft">
                  {report.from} → {report.to}
                </td>
                <td className="p-4 font-mono text-xs font-semibold uppercase text-brand">
                  {report.format}
                </td>
                <td className="p-4 whitespace-nowrap text-xs text-ink-soft">
                  {formatDate(report.createdAt)}
                </td>
                <td className="p-4">
                  <StatusBadge tone={statusTone(report.status)}>{report.status}</StatusBadge>
                </td>
                <td className="p-4 text-right">
                  <Button
                    variant="brand-outline"
                    size="pill"
                    disabled={report.status !== "ready" || downloadingId === report.id}
                    onClick={() => download(report)}
                  >
                    <HugeiconsIcon icon={Download01Icon} size={14} data-icon="inline-start" />
                    {downloadingId === report.id ? "Downloading…" : "Download"}
                  </Button>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
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
              <Button variant="brand" size="pill" disabled={generating} onClick={generateReport}>
                {generating ? "Generating…" : "Generate report"}
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
                  required
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
                  required
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
