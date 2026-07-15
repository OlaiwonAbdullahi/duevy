"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoneyBag02Icon,
  Megaphone01Icon,
  PlusSignIcon,
  UserGroup03Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { StatCard } from "../_components/StatCard";
import { EmptyState } from "../_components/EmptyState";
import { StatRowSkeleton, ListSkeleton } from "../_components/Skeleton";
import { useRepSpace } from "../_components/use-rep-space";
import { naira } from "./_components/data";
import type { Poll } from "./_components/types";
import { PollListRow } from "./_components/PollListRow";
import { PollForm } from "./_components/PollForm";
import { PollAnalytics } from "./_components/PollAnalytics";
import { ShareLinkModal } from "./_components/ShareLinkModal";
import { ConfirmDialog } from "../_components/ConfirmDialog";
import {
  listPolls,
  createPoll,
  updatePoll,
  publishPoll,
  closePoll,
  getPollResults,
  type PollDraft,
  type PollPatch,
} from "@/lib/api/polls";
import { ApiError } from "@/lib/api/errors";

export default function PollsPage() {
  const repSpace = useRepSpace();
  const spaceId = repSpace?.id;

  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [mode, setMode] = useState<"list" | "form" | "analytics">("list");
  const [editing, setEditing] = useState<Poll | null>(null);
  const [viewing, setViewing] = useState<Poll | null>(null);
  const [sharePoll, setSharePoll] = useState<Poll | null>(null);
  const [toClose, setToClose] = useState<Poll | null>(null);

  useEffect(() => {
    if (!spaceId) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = await listPolls(spaceId);
        if (!cancelled) setPolls(rows);
      } catch {
        if (!cancelled) toast.error("Couldn't load your polls.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [spaceId]);

  const totals = useMemo(() => {
    const live = polls.filter((p) => p.status === "active").length;
    const votes = polls.reduce((sum, p) => sum + p.totalVotes, 0);
    const raised = polls.reduce((sum, p) => sum + p.revenue, 0);
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
  const openAnalytics = async (poll: Poll) => {
    setViewing(poll);
    setMode("analytics");
    if (!spaceId) return;
    try {
      const results = await getPollResults(spaceId, poll.id);
      setViewing((prev) =>
        prev && prev.id === poll.id
          ? {
              ...prev,
              status: results.poll.status,
              totalVotes: results.totalVotes,
              revenue: results.revenue,
              categories: results.categories,
            }
          : prev,
      );
    } catch {
      // Fall back to the list snapshot already shown — non-fatal.
    }
  };

  const create = async (draft: PollDraft, publish: boolean) => {
    if (!spaceId) return;
    setSaving(true);
    try {
      const created = await createPoll(spaceId, { ...draft, publish });
      setPolls((list) => [created, ...list]);
      setMode("list");
      if (publish) {
        toast.success("Poll published", {
          description: `${created.title} · voting link ready to share`,
        });
        setSharePoll(created);
      } else {
        toast.success("Saved as draft", { description: created.title });
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't create the poll.");
    } finally {
      setSaving(false);
    }
  };

  const update = async (patch: PollPatch) => {
    if (!spaceId || !editing) return;
    setSaving(true);
    try {
      const updated = await updatePoll(spaceId, editing.id, patch);
      setPolls((list) => list.map((p) => (p.id === editing.id ? updated : p)));
      toast.success("Poll updated", { description: updated.title });
      setEditing(null);
      setMode("list");
    } catch (err) {
      const locked = err instanceof ApiError && err.code === "POLL_STRUCTURE_LOCKED";
      toast.error(
        locked
          ? "That field is locked now the poll is live."
          : err instanceof ApiError
            ? err.message
            : "Couldn't update the poll.",
      );
    } finally {
      setSaving(false);
    }
  };

  const publish = async (poll: Poll) => {
    if (!spaceId) return;
    setBusyId(poll.id);
    try {
      const updated = await publishPoll(spaceId, poll.id);
      setPolls((list) => list.map((p) => (p.id === poll.id ? updated : p)));
      toast.success("Poll published", {
        description: `${updated.title} · voting link ready to share`,
      });
      setSharePoll(updated);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't publish the poll.");
    } finally {
      setBusyId(null);
    }
  };

  const close = async (poll: Poll) => {
    if (!spaceId) return;
    setToClose(null);
    setBusyId(poll.id);
    try {
      const updated = await closePoll(spaceId, poll.id);
      setPolls((list) => list.map((p) => (p.id === poll.id ? updated : p)));
      toast.success("Poll closed", { description: "Tallies are now visible to voters." });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't close the poll.");
    } finally {
      setBusyId(null);
    }
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
              spaceName={repSpace?.name ?? "your department"}
              submitting={saving}
              onCancel={() => setMode("list")}
              onCreate={create}
              onUpdate={update}
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
                  Set up award votes for {repSpace?.name ?? "your department"} —
                  dinner nights, awardees and more.
                </p>
              </div>
              <Button
                variant="brand"
                size="pill-lg"
                onClick={openCreate}
                className="shrink-0"
              >
                <HugeiconsIcon icon={PlusSignIcon} size={16} />
                New poll
              </Button>
            </header>

            {loading ? (
              <div className="mt-6">
                <StatRowSkeleton />
                <div className="mt-4">
                  <ListSkeleton />
                </div>
              </div>
            ) : (
              <>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <StatCard icon={Megaphone01Icon} label="Live polls" value={String(totals.live)} />
                  <StatCard
                    icon={UserGroup03Icon}
                    label="Total votes"
                    value={totals.votes.toLocaleString("en-NG")}
                  />
                  <StatCard
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
                        <Button variant="brand" size="pill" onClick={openCreate}>
                          <HugeiconsIcon icon={PlusSignIcon} size={15} />
                          Create poll
                        </Button>
                      }
                    />
                  ) : (
                    <ul className="flex flex-col">
                      {polls.map((poll) => (
                        <PollListRow
                          key={poll.id}
                          poll={poll}
                          busy={busyId === poll.id}
                          onAnalytics={openAnalytics}
                          onEdit={openEdit}
                          onShare={setSharePoll}
                          onPublish={publish}
                          onClose={setToClose}
                        />
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {sharePoll && (
        <ShareLinkModal poll={sharePoll} onClose={() => setSharePoll(null)} />
      )}

      <ConfirmDialog
        open={!!toClose}
        title="Close this poll?"
        description={
          toClose
            ? `"${toClose.title}" will stop accepting votes and its tallies become visible to voters. This can't be undone.`
            : ""
        }
        confirmLabel="Close poll"
        onConfirm={() => toClose && close(toClose)}
        onClose={() => setToClose(null)}
      />
    </div>
  );
}
