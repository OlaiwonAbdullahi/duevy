"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CheckmarkSquare01Icon,
  Megaphone01Icon,
  MoneyBag02Icon,
  UserGroup03Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
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
import type { PollStatus } from "@/lib/api/types";
import { listAdminPolls, closeAdminPoll, type AdminPoll } from "@/lib/api/admin";

const STATUS_META: Record<PollStatus, { label: string; tone: StatusTone }> = {
  active: { label: "Live", tone: "ok" },
  draft: { label: "Draft", tone: "neutral" },
  closed: { label: "Closed", tone: "warn" },
};

export default function AdminPollsPage() {
  const [polls, setPolls] = useState<AdminPoll[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  async function load() {
    setLoading(true);
    try {
      const { data } = await listAdminPolls({
        q: debouncedSearch || undefined,
        status: statusFilter === "all" ? undefined : statusFilter,
        perPage: 100,
      });
      setPolls(data);
    } catch {
      toast.error("Couldn't load polls.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter]);

  const selected = useMemo(
    () => polls.find((p) => p.id === selectedId) ?? null,
    [polls, selectedId],
  );

  const livePolls = polls.filter((p) => p.status === "active").length;
  const votesCast = polls.reduce((s, p) => s + p.totalVotes, 0);
  const revenue = polls.reduce((s, p) => s + p.revenue, 0);

  async function forceClose(poll: AdminPoll) {
    const reason = window.prompt(`Reason for closing "${poll.title}"?`)?.trim();
    if (!reason) return;
    setBusy(true);
    try {
      await closeAdminPoll(poll.id, reason);
      setPolls((prev) => prev.map((p) => (p.id === poll.id ? { ...p, status: "closed" } : p)));
      toast.success(`"${poll.title}" closed.`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't close this poll.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Vote polls"
        description="Every award vote reps are running across the platform."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Megaphone01Icon} label="Live polls" value={String(livePolls)} />
        <StatCard
          icon={UserGroup03Icon}
          label="Votes cast"
          value={votesCast.toLocaleString("en-NG")}
        />
        <StatCard
          icon={MoneyBag02Icon}
          label="Vote revenue"
          value={nairaFromKobo(revenue)}
          hint="From paid votes"
          tone="brand"
        />
      </div>

      <Toolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by poll or space…"
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          label="Filter by status"
          options={[
            { value: "all", label: "All statuses" },
            { value: "active", label: "Live" },
            { value: "draft", label: "Draft" },
            { value: "closed", label: "Closed" },
          ]}
        />
      </Toolbar>

      <TableCard title="Polls" subtitle="Click a row for categories and standings">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-paper" />
            ))}
          </div>
        ) : polls.length === 0 ? (
          <EmptyState
            icon={CheckmarkSquare01Icon}
            title="No polls match"
            description="Try a different search or clear the filters."
          />
        ) : (
          <DataTable
            headers={[
              { label: "Poll" },
              { label: "Space" },
              { label: "Vote price" },
              { label: "Votes" },
              { label: "Revenue" },
              { label: "Deadline" },
              { label: "Status" },
              { label: "", align: "right" },
            ]}
          >
            {polls.map((p) => (
              <tr
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className="cursor-pointer transition-colors hover:bg-paper/40"
              >
                <td className="p-4 font-semibold text-ink">{p.title}</td>
                <td className="p-4 font-medium">{p.space}</td>
                <td className="p-4">{p.paid ? nairaFromKobo(p.amountPerVote) : "Free"}</td>
                <td className="p-4 font-medium">{p.totalVotes.toLocaleString("en-NG")}</td>
                <td className="p-4 font-semibold text-brand">{nairaFromKobo(p.revenue)}</td>
                <td className="p-4 whitespace-nowrap text-xs text-ink-soft">{p.deadline}</td>
                <td className="p-4">
                  <StatusBadge tone={STATUS_META[p.status].tone}>
                    {STATUS_META[p.status].label}
                  </StatusBadge>
                </td>
                <td className="p-4 text-right">
                  {p.status === "active" && (
                    <Button
                      variant="danger-outline"
                      size="pill"
                      disabled={busy}
                      onClick={(e) => {
                        e.stopPropagation();
                        forceClose(p);
                      }}
                    >
                      Close poll
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </TableCard>

      {selected && (
        <AdminModal
          wide
          icon={CheckmarkSquare01Icon}
          title={selected.title}
          description={`${selected.space} · deadline ${selected.deadline}`}
          onClose={() => setSelectedId(null)}
          footer={
            selected.status === "active" ? (
              <Button
                variant="danger-outline"
                size="pill"
                disabled={busy}
                onClick={() => forceClose(selected)}
              >
                Close poll
              </Button>
            ) : undefined
          }
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <ModalField label="Status">
              <StatusBadge tone={STATUS_META[selected.status].tone}>
                {STATUS_META[selected.status].label}
              </StatusBadge>
            </ModalField>
            <ModalField label="Votes cast">
              {selected.totalVotes.toLocaleString("en-NG")}
            </ModalField>
            <ModalField label="Revenue">
              <span className="text-brand">{nairaFromKobo(selected.revenue)}</span>
            </ModalField>
            <ModalField label="Vote price">
              {selected.paid ? `${nairaFromKobo(selected.amountPerVote)} per vote` : "Free"}
            </ModalField>
            <ModalField label="Who can vote" className="sm:col-span-2">
              {selected.membersOnly
                ? "Verified space members only — one vote each"
                : "Anyone with the voting link"}
            </ModalField>
          </div>

          <p className="mt-5 mb-2 text-[11px] font-semibold text-ink-soft">
            Categories & current leaders
          </p>
          <ul className="space-y-2">
            {selected.categories.map((cat) => {
              const leader = [...cat.nominees].sort(
                (a, b) => (b.votes ?? 0) - (a.votes ?? 0),
              )[0];
              const catVotes = cat.nominees.reduce((s, n) => s + (n.votes ?? 0), 0);
              return (
                <li
                  key={cat.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-cloud bg-canvas p-3.5"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-ink">{cat.title}</p>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {cat.nominees.length} nominees · {catVotes.toLocaleString("en-NG")} votes
                    </p>
                  </div>
                  {leader && (leader.votes ?? 0) > 0 ? (
                    <div className="shrink-0 text-right">
                      <p className="text-[13px] font-semibold text-ink">{leader.name}</p>
                      <p className="mt-0.5 text-xs text-ink-soft">
                        leading with {(leader.votes ?? 0).toLocaleString("en-NG")}
                      </p>
                    </div>
                  ) : (
                    <StatusBadge tone="neutral">No votes yet</StatusBadge>
                  )}
                </li>
              );
            })}
          </ul>
        </AdminModal>
      )}
    </div>
  );
}
