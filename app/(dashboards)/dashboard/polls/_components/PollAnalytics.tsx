"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Award01Icon,
  Clock01Icon,
  Link01Icon,
  Medal01Icon,
  MoneyBag02Icon,
  UserGroup03Icon,
} from "@hugeicons/core-free-icons";
import { StatCard } from "../../_components/StatCard";
import type { HugeIcon } from "../../_components/nav-config";
import { relativeDue } from "../../dues/_components/data";
import {
  naira,
  POLL_STATUS_META,
  pollLeaderboard,
  pollRevenue,
  totalVotes,
} from "./data";
import type { LeaderboardEntry } from "./data";
import type { Poll, PollCategory } from "./types";

export function PollAnalytics({
  poll,
  onBack,
  onShare,
}: {
  poll: Poll;
  onBack: () => void;
  onShare: (poll: Poll) => void;
}) {
  const votes = totalVotes(poll);
  const revenue = pollRevenue(poll);
  const status = POLL_STATUS_META[poll.status];
  const rel = relativeDue(poll.deadline);
  const nomineeCount = poll.categories.reduce(
    (sum, c) => sum + c.nominees.length,
    0,
  );

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink cursor-pointer"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
        All polls
      </button>

      <header className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              {poll.title}
            </h1>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.className}`}
            >
              {status.label}
            </span>
            {poll.paid && (
              <span className="rounded-full bg-cloud px-2 py-0.5 text-[10px] font-semibold text-brand">
                {naira(poll.amountPerVote)}/vote
              </span>
            )}
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-[13px] text-ink-soft">
            <HugeiconsIcon icon={Clock01Icon} size={13} />
            {rel.text}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onShare(poll)}
          disabled={poll.status === "draft"}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-cloud bg-canvas px-5 text-sm font-semibold text-ink transition-colors duration-300 hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <HugeiconsIcon icon={Link01Icon} size={16} className="text-brand" />
          Share link
        </button>
      </header>

      {/* Topline — stat tiles, not charts. */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={UserGroup03Icon} label="Total votes" value={votes.toLocaleString("en-NG")} tone="brand" />
        {poll.paid ? (
          <StatCard icon={MoneyBag02Icon} label="Money raised" value={naira(revenue)} />
        ) : (
          <StatCard icon={UserGroup03Icon} label="Voting" value="Free" />
        )}
        <StatCard icon={Award01Icon} label="Award categories" value={String(poll.categories.length)} />
        <StatCard icon={Medal01Icon} label="Nominees" value={String(nomineeCount)} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_1.35fr] lg:items-start">
        <Leaderboard poll={poll} />

        {/* Per-award breakdown. */}
        <div className="flex flex-col gap-5">
          {poll.categories.map((category) => (
            <CategoryResult key={category.id} category={category} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Leaderboard({ poll }: { poll: Poll }) {
  const entries = pollLeaderboard(poll).slice(0, 6);
  const topVotes = entries[0]?.votes ?? 0;
  const anyVotes = topVotes > 0;

  return (
    <section className="rounded-3xl border border-cloud bg-canvas p-5 sm:p-6 lg:sticky lg:top-24">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-2xl bg-cloud text-brand">
          <HugeiconsIcon icon={Medal01Icon} size={16} />
        </span>
        <div>
          <h2 className="text-base font-semibold tracking-tight text-ink">
            Leaderboard
          </h2>
          <p className="text-[11px] text-ink-soft">Top nominees, all awards</p>
        </div>
      </div>

      {!anyVotes ? (
        <p className="mt-5 rounded-2xl border border-dashed border-cloud px-4 py-6 text-center text-xs text-ink-soft">
          No votes yet. Rankings appear once students start voting.
        </p>
      ) : (
        <ol className="mt-4 flex flex-col gap-3">
          {entries.map((entry, index) => (
            <LeaderboardRow
              key={entry.name}
              entry={entry}
              rank={index + 1}
              topVotes={topVotes}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

/** Medal tint for the top three; muted chip afterwards. */
const RANK_STYLES = [
  "bg-amber-100 text-amber-700",
  "bg-slate-200 text-slate-600",
  "bg-orange-100 text-orange-700",
];

function LeaderboardRow({
  entry,
  rank,
  topVotes,
}: {
  entry: LeaderboardEntry;
  rank: number;
  topVotes: number;
}) {
  const width = topVotes > 0 ? Math.round((entry.votes / topVotes) * 100) : 0;
  const rankClass = RANK_STYLES[rank - 1] ?? "bg-cloud text-ink-soft";

  return (
    <li>
      <div className="flex items-center gap-3">
        <span
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold tabular-nums ${rankClass}`}
        >
          {rank}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-ink">
              {entry.name}
            </span>
            <span className="shrink-0 text-xs font-semibold text-ink tabular-nums">
              {entry.votes.toLocaleString("en-NG")}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper">
            <div
              className={`h-full rounded-full ${
                rank === 1 ? "bg-brand" : "bg-brand/45"
              }`}
              style={{ width: `${width}%` }}
            />
          </div>
        </div>
      </div>
    </li>
  );
}

function CategoryResult({ category }: { category: PollCategory }) {
  const ranked = [...category.nominees].sort((a, b) => b.votes - a.votes);
  const total = ranked.reduce((sum, n) => sum + n.votes, 0);
  const leaderVotes = ranked[0]?.votes ?? 0;
  // A clear leader only when someone is strictly ahead.
  const hasLeader = total > 0 && leaderVotes > (ranked[1]?.votes ?? 0);

  return (
    <section className="rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-2xl bg-cloud text-brand">
            <HugeiconsIcon icon={Award01Icon} size={16} />
          </span>
          <h2 className="text-base font-semibold tracking-tight text-ink">
            {category.title}
          </h2>
        </div>
        <span className="text-xs text-ink-soft tabular-nums">
          {total} vote{total === 1 ? "" : "s"}
        </span>
      </div>

      <ul className="mt-4 flex flex-col gap-3">
        {ranked.map((nominee, index) => {
          const share = total > 0 ? Math.round((nominee.votes / total) * 100) : 0;
          const isLeader = hasLeader && index === 0;
          return (
            <li key={nominee.id}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  {isLeader ? (
                    <HugeiconsIcon
                      icon={Medal01Icon}
                      size={15}
                      className="shrink-0 text-brand"
                    />
                  ) : (
                    <span className="w-[15px] shrink-0 text-center text-[11px] font-semibold text-ink-soft tabular-nums">
                      {index + 1}
                    </span>
                  )}
                  <span
                    className={`truncate text-sm ${
                      isLeader ? "font-semibold text-ink" : "font-medium text-ink"
                    }`}
                  >
                    {nominee.name}
                  </span>
                  {isLeader && (
                    <span className="shrink-0 rounded-full bg-cloud px-2 py-0.5 text-[10px] font-semibold text-brand">
                      Leading
                    </span>
                  )}
                </div>
                <span className="shrink-0 text-xs text-ink-soft tabular-nums">
                  {nominee.votes} · {share}%
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-paper">
                <div
                  className={`h-full rounded-full ${
                    isLeader ? "bg-brand" : "bg-brand/45"
                  }`}
                  style={{ width: `${share}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
