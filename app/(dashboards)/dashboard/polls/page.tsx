"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoneyBag02Icon,
  Megaphone01Icon,
  PlusSignIcon,
  UserGroup03Icon,
} from "@hugeicons/core-free-icons";
import type { HugeIcon } from "../_components/nav-config";
import { EmptyState } from "../_components/EmptyState";
import { REP_SPACE } from "../create-dues/_components/data";
import { INITIAL_POLLS, naira, pollRevenue, slugify, totalVotes } from "./_components/data";
import type { Poll, PollDraft } from "./_components/types";
import { PollListRow } from "./_components/PollListRow";
import { PollForm } from "./_components/PollForm";
import { PollAnalytics } from "./_components/PollAnalytics";
import { ShareLinkModal } from "./_components/ShareLinkModal";
import { ConfirmDialog } from "../_components/ConfirmDialog";

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: HugeIcon;
  label: string;
  value: string;
  tone?: "brand";
}) {
  return (
    <div className="rounded-3xl border border-cloud bg-canvas p-5">
      <div className="mb-3 grid h-9 w-9 place-items-center rounded-full bg-cloud text-brand">
        <HugeiconsIcon icon={icon} size={18} />
      </div>
      <p className="text-xs font-medium text-ink-soft">{label}</p>
      <p
        className={`mt-1 text-xl font-semibold tracking-tight ${
          tone === "brand" ? "text-brand" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>(INITIAL_POLLS);
  const [mode, setMode] = useState<"list" | "form" | "analytics">("list");
  const [editing, setEditing] = useState<Poll | null>(null);
  const [viewing, setViewing] = useState<Poll | null>(null);
  const [sharePoll, setSharePoll] = useState<Poll | null>(null);
  const [toDelete, setToDelete] = useState<Poll | null>(null);

  const totals = useMemo(() => {
    const live = polls.filter((p) => p.status === "active").length;
    const votes = polls.reduce((sum, p) => sum + totalVotes(p), 0);
    const raised = polls.reduce((sum, p) => sum + pollRevenue(p), 0);
    return { live, votes, raised };
  }, [polls]);

  const openCreate = () => {
    setEditing(null);
    setMode("form");
  };
  const openEdit = (poll: Poll) => {
    setEditing(poll);
    setMode("form");
  };
  const openAnalytics = (poll: Poll) => {
    setViewing(poll);
    setMode("analytics");
  };

  const save = (draft: PollDraft) => {
    if (editing) {
      setPolls((list) =>
        list.map((p) =>
          p.id === editing.id
            ? { ...p, ...draft, slug: slugify(draft.title) }
            : p,
        ),
      );
      toast.success("Poll updated", { description: draft.title });
    } else {
      const created: Poll = {
        id: crypto.randomUUID(),
        ...draft,
        status: "active",
        slug: slugify(draft.title),
      };
      setPolls((list) => [created, ...list]);
      toast.success("Poll published", {
        description: `${draft.title} · voting link ready to share`,
      });
      setEditing(null);
      setMode("list");
      setSharePoll(created);
      return;
    }
    setEditing(null);
    setMode("list");
  };

  const remove = (poll: Poll) => {
    setPolls((list) => list.filter((p) => p.id !== poll.id));
    toast.success("Poll deleted", { description: poll.title });
    setToDelete(null);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <AnimatePresence mode="wait" initial={false}>
        {mode === "form" ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <PollForm
              initial={editing}
              onCancel={() => setMode("list")}
              onSave={save}
            />
          </motion.div>
        ) : mode === "analytics" && viewing ? (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <PollAnalytics
              poll={viewing}
              onBack={() => setMode("list")}
              onShare={setSharePoll}
            />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="mb-2 inline-block rounded-full bg-cloud px-3 py-1 text-[11px] font-semibold text-brand">
                  Rep tools
                </span>
                <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                  Vote polls
                </h1>
                <p className="mt-1 text-[13px] text-ink-soft">
                  Set up award votes for {REP_SPACE.name} — dinner nights,
                  awardees and more.
                </p>
              </div>
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
              >
                <HugeiconsIcon icon={PlusSignIcon} size={16} />
                New poll
              </button>
            </header>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <Stat icon={Megaphone01Icon} label="Live polls" value={String(totals.live)} />
              <Stat
                icon={UserGroup03Icon}
                label="Total votes"
                value={totals.votes.toLocaleString("en-NG")}
              />
              <Stat
                icon={MoneyBag02Icon}
                label="Money raised"
                value={naira(totals.raised)}
                tone="brand"
              />
            </div>

            <div className="mt-4 rounded-3xl border border-cloud bg-canvas p-4 sm:p-6">
              {polls.length === 0 ? (
                <EmptyState
                  icon={Megaphone01Icon}
                  title="No polls yet"
                  description="Create your first vote poll for the dinner and awards night, then share the link with students."
                  action={
                    <button
                      type="button"
                      onClick={openCreate}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-brand px-5 text-[13px] font-semibold text-white transition-colors duration-300 hover:bg-brand-bright cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                    >
                      <HugeiconsIcon icon={PlusSignIcon} size={15} />
                      Create poll
                    </button>
                  }
                />
              ) : (
                <ul className="flex flex-col">
                  {polls.map((poll) => (
                    <PollListRow
                      key={poll.id}
                      poll={poll}
                      onAnalytics={openAnalytics}
                      onEdit={openEdit}
                      onShare={setSharePoll}
                      onDelete={setToDelete}
                    />
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {sharePoll && (
        <ShareLinkModal poll={sharePoll} onClose={() => setSharePoll(null)} />
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Delete this poll?"
        description={
          toDelete
            ? `"${toDelete.title}", its nominees and all votes will be removed. This can't be undone.`
            : ""
        }
        confirmLabel="Delete poll"
        onConfirm={() => toDelete && remove(toDelete)}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
