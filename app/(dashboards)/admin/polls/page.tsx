"use client";

import { useMemo, useState } from "react";
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
import type { Poll, PollStatus } from "../../dashboard/polls/_components/types";
import {
  INITIAL_POLLS,
  pollLeaderboard,
  pollRevenue,
  totalVotes,
} from "../../dashboard/polls/_components/data";
import PageHeader from "../_components/PageHeader";
import TableCard from "../_components/TableCard";
import StatusBadge, { type StatusTone } from "../_components/StatusBadge";
import { DataTable } from "../_components/DataTable";
import { Toolbar, SearchInput, FilterSelect } from "../_components/Toolbar";
import { RowActions } from "../_components/RowActions";
import { AdminModal, ModalField } from "../_components/AdminModal";
import { naira } from "../_components/format";

/** A rep's poll plus the space it belongs to — the admin view is platform-wide. */
type AdminPoll = Poll & { space: string };

const initialPolls: AdminPoll[] = [
  { ...INITIAL_POLLS[0], space: "Computer Science 2025" },
  { ...INITIAL_POLLS[1], space: "Computer Science 2025" },
  {
    id: "poll-3",
    title: "MassComm Media Night Awards",
    description: "Award votes for the media night — winners announced live.",
    deadline: "2026-06-28",
    status: "closed",
    membersOnly: false,
    paid: true,
    amountPerVote: 50,
    slug: "masscomm-media-night-awards",
    space: "Mass Comm 2024",
    categories: [
      {
        id: "cat-5",
        title: "Broadcaster of the Year",
        nominees: [
          { id: "n11", name: "Halima Sadiq", votes: 120 },
          { id: "n12", name: "Peter Eze", votes: 96 },
        ],
      },
    ],
  },
];

const STATUS_META: Record<PollStatus, { label: string; tone: StatusTone }> = {
  active: { label: "Live", tone: "ok" },
  draft: { label: "Draft", tone: "neutral" },
  closed: { label: "Closed", tone: "warn" },
};

export default function AdminPollsPage() {
  const [polls, setPolls] = useState<AdminPoll[]>(initialPolls);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return polls.filter(
      (p) =>
        (q === "" ||
          p.title.toLowerCase().includes(q) ||
          p.space.toLowerCase().includes(q)) &&
        (statusFilter === "all" || p.status === statusFilter),
    );
  }, [polls, search, statusFilter]);

  const selected = polls.find((p) => p.id === selectedId) ?? null;

  const livePolls = polls.filter((p) => p.status === "active").length;
  const votesCast = polls.reduce((s, p) => s + totalVotes(p), 0);
  const revenue = polls.reduce((s, p) => s + pollRevenue(p), 0);

  const setStatus = (id: string, status: PollStatus) => {
    setPolls((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    const poll = polls.find((p) => p.id === id);
    if (poll)
      toast(`"${poll.title}" ${status === "closed" ? "closed" : "reopened"}.`);
  };

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
          value={naira(revenue)}
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
        {filtered.length === 0 ? (
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
            {filtered.map((p) => (
              <tr
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className="cursor-pointer transition-colors hover:bg-paper/40"
              >
                <td className="p-4 font-semibold text-ink">{p.title}</td>
                <td className="p-4 font-medium">{p.space}</td>
                <td className="p-4">{p.paid ? naira(p.amountPerVote) : "Free"}</td>
                <td className="p-4 font-medium">{totalVotes(p).toLocaleString("en-NG")}</td>
                <td className="p-4 font-semibold text-brand">{naira(pollRevenue(p))}</td>
                <td className="p-4 whitespace-nowrap text-xs text-ink-soft">
                  {p.deadline}
                </td>
                <td className="p-4">
                  <StatusBadge tone={STATUS_META[p.status].tone}>
                    {STATUS_META[p.status].label}
                  </StatusBadge>
                </td>
                <td className="p-4 text-right">
                  <RowActions
                    actions={
                      p.status === "active"
                        ? [
                            {
                              label: "Close poll",
                              tone: "danger",
                              onSelect: () => setStatus(p.id, "closed"),
                            },
                          ]
                        : p.status === "closed"
                          ? [{ label: "Reopen poll", onSelect: () => setStatus(p.id, "active") }]
                          : [{ label: "View details", onSelect: () => setSelectedId(p.id) }]
                    }
                  />
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
                onClick={() => setStatus(selected.id, "closed")}
              >
                Close poll
              </Button>
            ) : selected.status === "closed" ? (
              <Button
                variant="brand"
                size="pill"
                onClick={() => setStatus(selected.id, "active")}
              >
                Reopen poll
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
              {totalVotes(selected).toLocaleString("en-NG")}
            </ModalField>
            <ModalField label="Revenue">
              <span className="text-brand">{naira(pollRevenue(selected))}</span>
            </ModalField>
            <ModalField label="Vote price">
              {selected.paid ? `${naira(selected.amountPerVote)} per vote` : "Free"}
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
              const leader = [...cat.nominees].sort((a, b) => b.votes - a.votes)[0];
              const catVotes = cat.nominees.reduce((s, n) => s + n.votes, 0);
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
                  {leader && leader.votes > 0 ? (
                    <div className="shrink-0 text-right">
                      <p className="text-[13px] font-semibold text-ink">{leader.name}</p>
                      <p className="mt-0.5 text-xs text-ink-soft">
                        leading with {leader.votes.toLocaleString("en-NG")}
                      </p>
                    </div>
                  ) : (
                    <StatusBadge tone="neutral">No votes yet</StatusBadge>
                  )}
                </li>
              );
            })}
          </ul>

          {totalVotes(selected) > 0 && (
            <>
              <p className="mt-5 mb-2 text-[11px] font-semibold text-ink-soft">
                Overall leaderboard
              </p>
              <ul className="space-y-1.5">
                {pollLeaderboard(selected)
                  .slice(0, 3)
                  .map((entry, i) => (
                    <li
                      key={entry.name}
                      className="flex items-center gap-3 rounded-2xl border border-cloud bg-paper/30 px-3.5 py-2.5"
                    >
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-cloud text-[11px] font-bold text-brand">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">
                        {entry.name}
                      </span>
                      <span className="text-xs text-ink-soft">
                        {entry.votes.toLocaleString("en-NG")} votes
                      </span>
                    </li>
                  ))}
              </ul>
            </>
          )}
        </AdminModal>
      )}
    </div>
  );
}
