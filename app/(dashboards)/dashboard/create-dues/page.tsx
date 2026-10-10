"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Wallet01Icon,
  UserMultipleIcon,
  Invoice01Icon,
} from "@hugeicons/core-free-icons";
import { StatCard } from "../_components/StatCard";
import { InlineStat } from "../_components/overview/OverviewUI";
import { naira } from "./_components/data";
import type { DueDraft, RepDue, RepDueStatus } from "./_components/types";
import { DueListRow } from "./_components/DueListRow";
import { DueForm } from "./_components/DueForm";
import { DueCollections } from "./_components/DueCollections";
import { EmptyState } from "../_components/EmptyState";
import { ConfirmDialog } from "../_components/ConfirmDialog";
import { ListSkeleton, StatRowSkeleton } from "../_components/Skeleton";
import { useRepSpace } from "../_components/use-rep-space";
import {
  listRepDues,
  createDue,
  updateDue,
  deleteDue,
  closeDue,
  publishDue,
  type DueDraft as ApiDueDraft,
} from "@/lib/api/rep";
import type { RepDue as ApiRepDue } from "@/lib/api/types";
import { ApiError } from "@/lib/api/errors";
import { normalizeDueType } from "../dues/_components/adapt";

const FILTERS: { id: "all" | RepDueStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "draft", label: "Drafts" },
  { id: "closed", label: "Closed" },
];

/** API rep due (kobo) → the page's RepDue (whole naira). */
function adaptRepDue(api: ApiRepDue): RepDue {
  return {
    id: api.id,
    title: api.title,
    note: api.note ?? "",
    amount: api.amount / 100,
    dueDate: api.dueDate,
    category: normalizeDueType(api.type ?? api.category),
    allowGuests: api.allowGuests ?? false,
    status: api.status as RepDueStatus,
    paidCount: api.paidCount,
    memberCount: api.memberCount,
    assignedRepId: api.assignedRepId,
  };
}

/** DueForm draft (naira) → the create/update payload (kobo). */
function toApiDraft(draft: DueDraft): ApiDueDraft {
  return {
    title: draft.title,
    note: draft.note,
    amount: draft.amount * 100,
    dueDate: draft.dueDate,
    type: draft.category,
    allowGuests: draft.allowGuests,
  };
}

export default function CreateDuesPage() {
  const repSpace = useRepSpace();
  const spaceId = repSpace?.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const dueParam = searchParams.get("due");

  const [dues, setDues] = useState<RepDue[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"list" | "form" | "collections">("list");
  const [editing, setEditing] = useState<RepDue | null>(null);
  const [viewingDue, setViewingDue] = useState<RepDue | null>(null);
  const [toDelete, setToDelete] = useState<RepDue | null>(null);
  const [toClose, setToClose] = useState<RepDue | null>(null);


  useEffect(() => {
    if (!spaceId) return;
    let cancelled = false;
    (async () => {
      try {
        const apiDues = await listRepDues(spaceId);
        if (!cancelled) setDues(apiDues.map(adaptRepDue));
      } catch {
        if (!cancelled) toast.error("Couldn't load your dues.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [spaceId]);

  // Deep-link from the dashboard's "Active dues" list straight into collections.
  useEffect(() => {
    if (!dueParam || loading) return;
    const due = dues.find((d) => d.id === dueParam);
    if (due) {
      setViewingDue(due);
      setMode("collections");
    }
  }, [dueParam, dues, loading]);

  const totals = useMemo(() => {
    const active = dues.filter((d) => d.status === "active");
    const collected = active.reduce((s, d) => s + d.paidCount * d.amount, 0);
    const outstanding = active.reduce(
      (s, d) => s + (d.memberCount - d.paidCount) * d.amount,
      0,
    );
    const expected = collected + outstanding;
    const rate = expected ? Math.round((collected / expected) * 100) : 0;
    return { activeCount: active.length, collected, outstanding, rate };
  }, [dues]);

  // The status filter only shows on phones, so desktop always sees "all".
  const [filter, setFilter] = useState<"all" | RepDueStatus>("all");
  const visibleDues = filter === "all" ? dues : dues.filter((d) => d.status === filter);

  const openCreate = () => {
    setEditing(null);
    setMode("form");
  };
  const openEdit = (due: RepDue) => {
    setEditing(due);
    setMode("form");
  };
  const openCollections = (due: RepDue) => {
    setViewingDue(due);
    setMode("collections");
  };

  const save = async (draft: DueDraft) => {
    if (!spaceId) return;
    try {
      if (editing) {
        const updated = await updateDue(spaceId, editing.id, toApiDraft(draft));
        const row = adaptRepDue(updated);
        setDues((list) => list.map((d) => (d.id === editing.id ? row : d)));
        toast.success("Due updated", { description: draft.title });
      } else {
        const created = await createDue(spaceId, { ...toApiDraft(draft), publish: true });
        setDues((list) => [adaptRepDue(created), ...list]);
        toast.success("Due published", {
          description: `${draft.title} · ${naira(draft.amount)}`,
        });
      }
      setEditing(null);
      setMode("list");
    } catch (err) {
      if (err instanceof ApiError && err.code === "KYC_REQUIRED" && !editing) {
        // Drafts are allowed before verification — keep the rep's work and let
        // them publish it from the list once they're verified.
        try {
          const draftDue = await createDue(spaceId, { ...toApiDraft(draft), publish: false });
          setDues((list) => [adaptRepDue(draftDue), ...list]);
          setEditing(null);
          setMode("list");
          toastKycRequired("Saved as a draft", "publish it");
        } catch (draftErr) {
          toast.error(
            draftErr instanceof ApiError ? draftErr.message : "Couldn't save the due. Please try again.",
          );
        }
        return;
      }
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't save the due. Please try again.",
      );
    }
  };

  const toastKycRequired = (title: string, action: string) =>
    toast.info(title, {
      description: `Your space can't collect payments until verification (identity and student ID) is complete. Finish it on the Verification page, then ${action}.`,
      action: {
        label: "Verify now",
        onClick: () => router.push("/dashboard/kyc"),
      },
      duration: 10000,
    });

  const publish = async (due: RepDue) => {
    if (!spaceId) return;
    try {
      const published = await publishDue(spaceId, due.id);
      const row = adaptRepDue(published);
      setDues((list) => list.map((d) => (d.id === due.id ? row : d)));
      toast.success("Due published", { description: `${due.title} · ${naira(due.amount)}` });
    } catch (err) {
      if (err instanceof ApiError && err.code === "KYC_REQUIRED") {
        toastKycRequired("Verification needed to publish", "try again");
        return;
      }
      toast.error(err instanceof ApiError ? err.message : "Couldn't publish the due.");
    }
  };

  const remove = async (due: RepDue) => {
    if (!spaceId) return;
    const prev = dues;
    setDues((list) => list.filter((d) => d.id !== due.id));
    setToDelete(null);
    try {
      await deleteDue(spaceId, due.id);
      toast.success("Due deleted", { description: due.title });
    } catch (err) {
      setDues(prev);
      toast.error(err instanceof ApiError ? err.message : "Couldn't delete the due.");
    }
  };

  const closeDueAction = async (due: RepDue) => {
    if (!spaceId) return;
    const prev = dues;
    setDues((list) =>
      list.map((d) => (d.id === due.id ? { ...d, status: "closed" } : d)),
    );
    setToClose(null);
    try {
      await closeDue(spaceId, due.id);
      toast.success("Due closed", { description: due.title });
    } catch {
      setDues(prev);
      toast.error("Couldn't close the due.");
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <AnimatePresence mode="wait" initial={false}>
        {mode === "form" ? (
          <m.div
            key="form"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <DueForm
              initial={editing}
              spaceName={repSpace?.name ?? "your department"}
              onCancel={() => setMode("list")}
              onSave={save}
            />
          </m.div>
        ) : mode === "collections" && viewingDue && spaceId ? (
          <m.div
            key="collections"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <DueCollections
              spaceId={spaceId}
              due={viewingDue}
              onBack={() => setMode("list")}
            />
          </m.div>
        ) : (
          <m.div
            key="list"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <header className="flex items-center justify-between gap-4 sm:items-end">
              <div>
                <span className="mb-2 hidden rounded-full sm:inline-block bg-cloud px-3 py-1 text-[11px] font-semibold text-brand">
                  Rep tools
                </span>
                <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                  Dues
                </h1>
                <p className="mt-1 text-[13px] text-ink-soft max-sm:hidden">
                  Dues you&apos;ve raised for {repSpace?.name ?? "your department"}.
                </p>
              </div>
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-brand px-4 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_var(--p-primary)] transition-colors duration-300 hover:bg-brand-bright cursor-pointer sm:h-11 sm:gap-2 sm:px-6 sm:shadow-none"
              >
                <HugeiconsIcon icon={Add01Icon} size={16} />
                New due
              </button>
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
                {/* Phones: collected-to-date as an inline headline figure. */}
                <div className="mt-4 sm:hidden">
                  <InlineStat
                    label="Collected on active dues"
                    value={naira(totals.collected)}
                    rate={totals.rate}
                    caption={`${naira(totals.outstanding)} outstanding · ${totals.activeCount} active due${
                      totals.activeCount === 1 ? "" : "s"
                    }`}
                  />
                </div>

                <div className="mt-6 hidden gap-4 sm:grid sm:grid-cols-3">
                  <StatCard
                    icon={Invoice01Icon}
                    label="Active dues"
                    value={String(totals.activeCount)}
                  />
                  <StatCard
                    icon={Wallet01Icon}
                    label="Collected"
                    value={naira(totals.collected)}
                    tone="brand"
                  />
                  <StatCard
                    icon={UserMultipleIcon}
                    label="Outstanding"
                    value={naira(totals.outstanding)}
                  />
                </div>

                {/* Phones: filter by status. */}
                {dues.length > 0 && (
                  <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:hidden">
                    {FILTERS.map((f) => {
                      const count = f.id === "all" ? dues.length : dues.filter((d) => d.status === f.id).length;
                      const on = filter === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFilter(f.id)}
                          aria-pressed={on}
                          className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-xs font-semibold transition-colors cursor-pointer ${
                            on ? "bg-ink text-canvas" : "border border-cloud bg-canvas text-ink-soft"
                          }`}
                        >
                          {f.label}
                          <span className={`tabular-nums ${on ? "text-canvas/60" : "text-ink-soft/70"}`}>{count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="mt-3 rounded-3xl border border-cloud bg-canvas px-4 py-1 sm:mt-4 sm:p-6">
                  {dues.length === 0 ? (
                    <EmptyState
                      icon={Invoice01Icon}
                      title="No dues yet"
                      description="Raise your first due for the department and start tracking payments."
                      action={
                        <button
                          type="button"
                          onClick={openCreate}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-brand px-5 text-[13px] font-semibold text-white transition-colors duration-300 hover:bg-brand-bright cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                        >
                          <HugeiconsIcon icon={Add01Icon} size={15} />
                          Create due
                        </button>
                      }
                    />
                  ) : (
                    <ul className="flex flex-col">
                      {visibleDues.length === 0 && (
                        <li className="py-8 text-center text-xs text-ink-soft sm:hidden">
                          No {filter} dues.
                        </li>
                      )}
                      {visibleDues.map((due) => (
                        <DueListRow
                          key={due.id}
                          due={due}
                          onEdit={openEdit}
                          onDelete={setToDelete}
                          onClose={setToClose}
                          onPublish={publish}
                          onViewCollections={openCollections}
                        />
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </m.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete this draft?"
        description={
          toDelete
            ? `"${toDelete.title}" hasn't been published, so no one has paid it. This can't be undone.`
            : ""
        }
        confirmLabel="Delete due"
        onConfirm={() => toDelete && remove(toDelete)}
        onClose={() => setToDelete(null)}
      />

      <ConfirmDialog
        open={!!toClose}
        title="Close this due?"
        description={
          toClose
            ? `No further payments can be collected for "${toClose.title}" once closed. This can't be undone.`
            : ""
        }
        confirmLabel="Close due"
        onConfirm={() => toClose && closeDueAction(toClose)}
        onClose={() => setToClose(null)}
      />
    </div>
  );
}
