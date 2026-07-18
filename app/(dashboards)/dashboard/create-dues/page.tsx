"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Wallet01Icon,
  UserMultipleIcon,
  Invoice01Icon,
} from "@hugeicons/core-free-icons";
import { StatCard } from "../_components/StatCard";
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
  type DueDraft as ApiDueDraft,
} from "@/lib/api/rep";
import type { RepDue as ApiRepDue } from "@/lib/api/types";

/** API rep due (kobo) → the page's RepDue (whole naira). */
function adaptRepDue(api: ApiRepDue): RepDue {
  return {
    id: api.id,
    title: api.title,
    note: api.note ?? "",
    amount: api.amount / 100,
    dueDate: api.dueDate,
    category: api.category,
    allowGuests: api.allowGuests,
    status: api.status as RepDueStatus,
    paidCount: api.paidCount,
    memberCount: api.memberCount,
  };
}

/** DueForm draft (naira) → the create/update payload (kobo). */
function toApiDraft(draft: DueDraft): ApiDueDraft {
  return {
    title: draft.title,
    note: draft.note,
    amount: draft.amount * 100,
    dueDate: draft.dueDate,
    category: draft.category,
    allowGuests: draft.allowGuests,
  };
}

export default function CreateDuesPage() {
  const repSpace = useRepSpace();
  const spaceId = repSpace?.id;
  const searchParams = useSearchParams();
  const dueParam = searchParams.get("due");

  const [dues, setDues] = useState<RepDue[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"list" | "form" | "collections">("list");
  const [editing, setEditing] = useState<RepDue | null>(null);
  const [viewingDue, setViewingDue] = useState<RepDue | null>(null);
  const [toDelete, setToDelete] = useState<RepDue | null>(null);

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
    return { activeCount: active.length, collected, outstanding };
  }, [dues]);

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
    } catch {
      toast.error("Couldn't save the due. Please try again.");
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
    } catch {
      setDues(prev);
      toast.error("Couldn't delete the due.");
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
            <DueForm
              initial={editing}
              spaceName={repSpace?.name ?? "your department"}
              onCancel={() => setMode("list")}
              onSave={save}
            />
          </motion.div>
        ) : mode === "collections" && viewingDue && spaceId ? (
          <motion.div
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
                  Dues
                </h1>
                <p className="mt-1 text-[13px] text-ink-soft">
                  Dues you&apos;ve raised for {repSpace?.name ?? "your department"}.
                </p>
              </div>
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright cursor-pointer"
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
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
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

                <div className="mt-4 rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
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
                      {dues.map((due) => (
                        <DueListRow
                          key={due.id}
                          due={due}
                          onEdit={openEdit}
                          onDelete={setToDelete}
                          onViewCollections={openCollections}
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

      <ConfirmDialog
        open={!!toDelete}
        title="Delete this due?"
        description={
          toDelete
            ? `"${toDelete.title}" and its collection records will be removed. This can't be undone.`
            : ""
        }
        confirmLabel="Delete due"
        onConfirm={() => toDelete && remove(toDelete)}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
