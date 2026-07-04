"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Wallet01Icon,
  UserMultipleIcon,
  Invoice01Icon,
} from "@hugeicons/core-free-icons";
import type { HugeIcon } from "../_components/nav-config";
import { REP_SPACE, INITIAL_REP_DUES, naira } from "./_components/data";
import type { DueDraft, RepDue } from "./_components/types";
import { DueListRow } from "./_components/DueListRow";
import { DueForm } from "./_components/DueForm";
import { EmptyState } from "../_components/EmptyState";
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

export default function CreateDuesPage() {
  const [dues, setDues] = useState<RepDue[]>(INITIAL_REP_DUES);
  const [mode, setMode] = useState<"list" | "form">("list");
  const [editing, setEditing] = useState<RepDue | null>(null);
  const [toDelete, setToDelete] = useState<RepDue | null>(null);

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

  const save = (draft: DueDraft) => {
    if (editing) {
      setDues((list) =>
        list.map((d) => (d.id === editing.id ? { ...d, ...draft } : d)),
      );
      toast.success("Due updated", { description: draft.title });
    } else {
      const created: RepDue = {
        id: crypto.randomUUID(),
        ...draft,
        status: "active",
        paidCount: 0,
        memberCount: REP_SPACE.memberCount,
      };
      setDues((list) => [created, ...list]);
      toast.success("Due published", {
        description: `${draft.title} · ${naira(draft.amount)}`,
      });
    }
    setEditing(null);
    setMode("list");
  };

  const remove = (due: RepDue) => {
    setDues((list) => list.filter((d) => d.id !== due.id));
    toast.success("Due deleted", { description: due.title });
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
            <DueForm
              initial={editing}
              onCancel={() => setMode("list")}
              onSave={save}
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
                  Dues you&apos;ve raised for {REP_SPACE.name}.
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

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <Stat
                icon={Invoice01Icon}
                label="Active dues"
                value={String(totals.activeCount)}
              />
              <Stat
                icon={Wallet01Icon}
                label="Collected"
                value={naira(totals.collected)}
                tone="brand"
              />
              <Stat
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
                    />
                  ))}
                </ul>
              )}
            </div>
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
