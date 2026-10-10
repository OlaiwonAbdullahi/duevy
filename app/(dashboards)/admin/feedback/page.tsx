"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { BubbleChatEditIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { EmptyState } from "../../dashboard/_components/EmptyState";
import PageHeader from "../_components/PageHeader";
import TableCard from "../_components/TableCard";
import StatusBadge, { type StatusTone } from "../_components/StatusBadge";
import { DataTable } from "../_components/DataTable";
import { Toolbar, SearchInput, FilterSelect } from "../_components/Toolbar";
import { AdminModal, ModalField } from "../_components/AdminModal";
import { ApiError } from "@/lib/api/errors";
import type { Feedback, FeedbackCategory, FeedbackStatus } from "@/lib/api/feedback";
import { listAdminFeedback, reopenFeedback, resolveFeedback } from "@/lib/api/admin";

const CATEGORY: Record<FeedbackCategory, { label: string; tone: StatusTone }> = {
  bug: { label: "Bug", tone: "bad" },
  idea: { label: "Idea", tone: "ok" },
  other: { label: "Other", tone: "neutral" },
};

const STATUS: Record<FeedbackStatus, { label: string; tone: StatusTone }> = {
  new: { label: "New", tone: "warn" },
  resolved: { label: "Resolved", tone: "ok" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "Mozilla/5.0 (iPhone; …) … Safari/…" → "iPhone · Safari": enough to reproduce a bug. */
function describeAgent(ua: string | null) {
  if (!ua) return "—";
  const device = /iPhone|iPad|Android|Windows|Macintosh|Linux/.exec(ua)?.[0]?.replace("Macintosh", "Mac") ?? "Unknown device";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Unknown browser";
  return `${device} · ${browser}`;
}

export default function AdminFeedbackPage() {
  const [rows, setRows] = useState<Feedback[]>([]);
  const [unresolved, setUnresolved] = useState<number | null>(null);
  // The filters whose results are on screen; loading until they match the current ones.
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | FeedbackStatus>("new");
  const [categoryFilter, setCategoryFilter] = useState<"all" | FeedbackCategory>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const queryKey = JSON.stringify([debouncedSearch, statusFilter, categoryFilter]);
  const loading = loadedKey !== queryKey;

  useEffect(() => {
    let cancelled = false;
    listAdminFeedback({
      q: debouncedSearch || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      category: categoryFilter === "all" ? undefined : categoryFilter,
      perPage: 100,
    })
      .then(({ data, meta }) => {
        if (cancelled) return;
        setRows(data);
        setUnresolved(meta?.unresolved ?? null);
      })
      .catch(() => !cancelled && toast.error("Couldn't load feedback."))
      .finally(() => !cancelled && setLoadedKey(queryKey));
    return () => {
      cancelled = true;
    };
  }, [queryKey, debouncedSearch, statusFilter, categoryFilter]);

  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);

  const open = (row: Feedback) => {
    setSelectedId(row.id);
    setNote(row.adminNote ?? "");
  };

  async function decide(row: Feedback, action: "resolve" | "reopen") {
    setBusy(true);
    try {
      const updated = action === "resolve" ? await resolveFeedback(row.id, note.trim() || undefined) : await reopenFeedback(row.id);
      setRows((prev) => prev.map((r) => (r.id === row.id ? updated : r)));
      setUnresolved((n) => (n === null ? n : Math.max(0, n + (action === "resolve" ? -1 : 1))));
      toast.success(action === "resolve" ? "Marked as resolved." : "Reopened.");
      setSelectedId(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't update this feedback.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Feedback"
        description={
          unresolved === null
            ? "Bug reports, ideas and comments sent from the app."
            : `Bug reports, ideas and comments sent from the app · ${unresolved} unresolved`
        }
      />

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search message, name or email…" />
        <FilterSelect
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as typeof statusFilter)}
          label="Filter by status"
          options={[
            { value: "new", label: "New" },
            { value: "resolved", label: "Resolved" },
            { value: "all", label: "All statuses" },
          ]}
        />
        <FilterSelect
          value={categoryFilter}
          onChange={(v) => setCategoryFilter(v as typeof categoryFilter)}
          label="Filter by category"
          options={[
            { value: "all", label: "All categories" },
            { value: "bug", label: "Bugs" },
            { value: "idea", label: "Ideas" },
            { value: "other", label: "Other" },
          ]}
        />
      </Toolbar>

      <TableCard title="Inbox" subtitle="Click a row to read it in full">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-paper" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={BubbleChatEditIcon}
            title={statusFilter === "new" && !debouncedSearch && categoryFilter === "all" ? "All caught up" : "No feedback matches"}
            description={
              statusFilter === "new" && !debouncedSearch && categoryFilter === "all"
                ? "There's no unresolved feedback right now."
                : "Try a different search or clear the filters."
            }
          />
        ) : (
          <DataTable
            headers={[{ label: "Type" }, { label: "From" }, { label: "Message" }, { label: "Received" }, { label: "Status" }]}
          >
            {rows.map((r) => (
              <tr key={r.id} onClick={() => open(r)} className="cursor-pointer transition-colors hover:bg-paper/40">
                <td className="p-4">
                  <StatusBadge tone={CATEGORY[r.category].tone}>{CATEGORY[r.category].label}</StatusBadge>
                </td>
                <td className="p-4">
                  <p className="font-semibold text-ink">{r.user.name}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">{r.user.email}</p>
                </td>
                <td className="max-w-sm p-4">
                  <p className="line-clamp-2 text-[13px] text-ink">{r.message}</p>
                  {r.page && <p className="mt-0.5 truncate font-mono text-[11px] text-ink-soft">{r.page}</p>}
                </td>
                <td className="whitespace-nowrap p-4 text-xs text-ink-soft">{formatDate(r.createdAt)}</td>
                <td className="p-4">
                  <StatusBadge tone={STATUS[r.status].tone}>{STATUS[r.status].label}</StatusBadge>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </TableCard>

      {selected && (
        <AdminModal
          wide
          icon={BubbleChatEditIcon}
          title={`${CATEGORY[selected.category].label} from ${selected.user.name}`}
          description={selected.user.email}
          onClose={() => !busy && setSelectedId(null)}
          footer={
            selected.status === "new" ? (
              <Button variant="brand" size="pill" disabled={busy} aria-busy={busy || undefined} onClick={() => decide(selected, "resolve")}>
                {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                {busy ? "Saving…" : "Mark resolved"}
              </Button>
            ) : (
              <Button variant="brand-outline" size="pill" disabled={busy} aria-busy={busy || undefined} onClick={() => decide(selected, "reopen")}>
                {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />}
                {busy ? "Reopening…" : "Reopen"}
              </Button>
            )
          }
        >
          <p className="mb-2 text-[11px] font-semibold text-ink-soft">Message</p>
          <p className="whitespace-pre-wrap rounded-2xl border border-cloud bg-canvas p-4 text-[13px] leading-6 text-ink">
            {selected.message}
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <ModalField label="Received">{formatDate(selected.createdAt)}</ModalField>
            <ModalField label="Account">
              <span className="capitalize">{selected.user.role}</span>
            </ModalField>
            <ModalField label="Page">
              {selected.page ? <span className="font-mono text-xs">{selected.page}</span> : "—"}
            </ModalField>
            <ModalField label="Device">
              <span title={selected.userAgent ?? undefined}>{describeAgent(selected.userAgent)}</span>
            </ModalField>
          </div>

          {selected.status === "new" ? (
            <div className="mt-5">
              <label htmlFor="feedback-note" className="text-[11px] font-semibold text-ink-soft">
                Internal note (optional)
              </label>
              <textarea
                id="feedback-note"
                rows={2}
                value={note}
                disabled={busy}
                onChange={(e) => setNote(e.target.value.slice(0, 1000))}
                placeholder="e.g. Fixed in the 1.4 release."
                className="mt-1.5 w-full resize-none rounded-xl border border-cloud bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:opacity-60"
              />
            </div>
          ) : (
            selected.adminNote && (
              <>
                <p className="mt-5 mb-2 text-[11px] font-semibold text-ink-soft">
                  Note{selected.resolvedAt ? ` · resolved ${formatDate(selected.resolvedAt)}` : ""}
                </p>
                <p className="rounded-2xl border border-cloud bg-paper/30 p-4 text-[13px] leading-6 text-ink">
                  {selected.adminNote}
                </p>
              </>
            )
          )}
        </AdminModal>
      )}
    </div>
  );
}
