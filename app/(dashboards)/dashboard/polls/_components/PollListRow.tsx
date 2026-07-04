import { HugeiconsIcon } from "@hugeicons/react";
import {
  Analytics01Icon,
  Award01Icon,
  Clock01Icon,
  Delete02Icon,
  Link01Icon,
  PencilEdit01Icon,
  UserGroup03Icon,
} from "@hugeicons/core-free-icons";
import { relativeDue } from "../../dues/_components/data";
import { naira, POLL_STATUS_META, pollRevenue, totalVotes } from "./data";
import type { Poll } from "./types";

export function PollListRow({
  poll,
  onAnalytics,
  onEdit,
  onShare,
  onDelete,
}: {
  poll: Poll;
  onAnalytics: (poll: Poll) => void;
  onEdit: (poll: Poll) => void;
  onShare: (poll: Poll) => void;
  onDelete: (poll: Poll) => void;
}) {
  const rel = relativeDue(poll.deadline);
  const status = POLL_STATUS_META[poll.status];
  const votes = totalVotes(poll);
  const revenue = pollRevenue(poll);
  const isDraft = poll.status === "draft";

  return (
    <li className="flex flex-col gap-4 border-t border-cloud py-4 first:border-t-0 sm:flex-row sm:items-center">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cloud text-brand">
        <HugeiconsIcon icon={Award01Icon} size={20} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-ink">{poll.title}</p>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.className}`}
          >
            {status.label}
          </span>
          {poll.paid && (
            <span className="shrink-0 rounded-full bg-cloud px-2 py-0.5 text-[10px] font-semibold text-brand">
              {naira(poll.amountPerVote)}/vote
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-ink-soft">
          <span className="inline-flex items-center gap-1">
            <HugeiconsIcon icon={Award01Icon} size={12} />
            {poll.categories.length} award
            {poll.categories.length === 1 ? "" : "s"}
          </span>
          <span className="text-cloud">•</span>
          <span className="inline-flex items-center gap-1">
            <HugeiconsIcon icon={UserGroup03Icon} size={12} />
            {votes} vote{votes === 1 ? "" : "s"}
          </span>
          <span className="text-cloud">•</span>
          {poll.paid && (
            <>
              <span className="font-semibold text-brand">
                {naira(revenue)} raised
              </span>
              <span className="text-cloud">•</span>
            </>
          )}
          <span
            className={`inline-flex items-center gap-1 ${
              rel.past && poll.status === "active" ? "text-rose-600" : ""
            }`}
          >
            <HugeiconsIcon icon={Clock01Icon} size={12} />
            {rel.text}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => onAnalytics(poll)}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-cloud bg-paper px-3.5 text-xs font-semibold text-ink transition-colors duration-300 hover:bg-cloud cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <HugeiconsIcon icon={Analytics01Icon} size={14} className="text-brand" />
          Analytics
        </button>
        <button
          type="button"
          onClick={() => onShare(poll)}
          disabled={isDraft}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-cloud bg-paper px-3.5 text-xs font-semibold text-ink transition-colors duration-300 hover:bg-cloud disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <HugeiconsIcon icon={Link01Icon} size={14} className="text-brand" />
          Share
        </button>
        <button
          type="button"
          onClick={() => onEdit(poll)}
          aria-label={`Edit ${poll.title}`}
          className="grid h-9 w-9 place-items-center rounded-full text-ink-soft transition-colors duration-300 hover:bg-paper hover:text-ink cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <HugeiconsIcon icon={PencilEdit01Icon} size={16} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(poll)}
          aria-label={`Delete ${poll.title}`}
          className="grid h-9 w-9 place-items-center rounded-full text-ink-soft transition-colors duration-300 hover:bg-rose-50 hover:text-rose-600 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <HugeiconsIcon icon={Delete02Icon} size={16} />
        </button>
      </div>
    </li>
  );
}
