"use client";

import { useState, type ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  SentIcon,
  UserMultipleIcon,
  CheckmarkCircle02Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useSpace } from "@/lib/api/queries";
import { BRAND_INPUT } from "../../_components/form-styles";
import { ConfirmDialog } from "../../_components/ConfirmDialog";
import { useRepSpace } from "../../_components/use-rep-space";
import { naira } from "../../dues/_components/data";
import type { DueType } from "../../dues/_components/types";
import type { DueDraft, RepDue } from "./types";
import { CategoryPicker } from "./CategoryPicker";
import { DatePicker } from "./DatePicker";
import { DuePreview } from "./DuePreview";

/** One-tap amounts reps reach for most. */
const QUICK_AMOUNTS = [1000, 2000, 5000, 10000];

/** Title placeholder per type, so the example matches what's being raised. */
const TITLE_EXAMPLE: Partial<Record<DueType, string>> = {
  departmental_due: "e.g. 2026/27 Departmental Due",
  handout: "e.g. CSC 301 Handout",
  exam_levy: "e.g. First Semester Exam Levy",
  lab_manual: "e.g. Physics Lab Manual",
  association_due: "e.g. NACOS Association Due",
  departmental_wear: "e.g. Department T-shirt",
  trip_fee: "e.g. Excursion to Lagos",
  clearance: "e.g. Final Year Clearance",
};

/** Local-safe yyyy-mm-dd. */
function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Deadline shortcuts, computed from today. */
function deadlineShortcuts(): { label: string; value: string }[] {
  const from = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return isoDate(d);
  };
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysToEnd = Math.round((endOfMonth.getTime() - now.getTime()) / 86_400_000);
  return [
    { label: "1 week", value: from(7) },
    { label: "2 weeks", value: from(14) },
    // Skip "end of month" when it's only a couple of days away.
    ...(daysToEnd > 3 ? [{ label: "End of month", value: isoDate(endOfMonth) }] : []),
    { label: "1 month", value: from(30) },
  ];
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-cloud bg-canvas p-4 sm:p-6">
      <h2 className="text-sm font-semibold tracking-tight text-ink">{title}</h2>
      {hint && <p className="mt-0.5 text-xs text-ink-soft">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ label, aside, children }: { label: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <Label className="block text-xs font-medium text-ink-soft">{label}</Label>
        {aside}
      </div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

const chip = (on: boolean) =>
  cn(
    "inline-flex h-9 shrink-0 items-center rounded-full border px-3.5 text-xs font-semibold tabular-nums transition-colors cursor-pointer",
    on ? "border-brand bg-brand text-white" : "border-cloud bg-canvas text-ink-soft hover:text-ink",
  );

/**
 * Create or edit a single due for the rep's own space. Amount comes first
 * (with quick picks and what it adds up to across the class), then the
 * details, with a live preview. Publishing asks once, since members are
 * notified and a published due can only be closed, not deleted.
 */
export function DueForm({
  initial,
  spaceName,
  onCancel,
  onSave,
}: {
  initial: RepDue | null;
  spaceName: string;
  onCancel: () => void;
  onSave: (draft: DueDraft) => Promise<void>;
}) {
  const editing = !!initial;
  const repSpace = useRepSpace();
  const memberCount = useSpace(repSpace?.id).data?.memberCount ?? initial?.memberCount ?? 0;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState<DueType>(initial?.category ?? "departmental_due");
  const [amountDigits, setAmountDigits] = useState(initial ? String(initial.amount) : "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  // Guest payers are refused at checkout, so the form no longer offers it.
  const allowGuests = false;
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [discarding, setDiscarding] = useState(false);

  const amount = Number(amountDigits || 0);
  // The backend refuses amount changes once anyone has paid (matches repDues.ts).
  const amountLocked = editing && (initial?.paidCount ?? 0) > 0;
  const missing = [
    title.trim().length < 3 && "a title",
    amount <= 0 && "an amount",
    !dueDate && "a deadline",
  ].filter(Boolean) as string[];
  const valid = missing.length === 0;

  const dirty =
    title !== (initial?.title ?? "") ||
    category !== (initial?.category ?? "departmental_due") ||
    amountDigits !== (initial ? String(initial.amount) : "") ||
    dueDate !== (initial?.dueDate ?? "") ||
    note !== (initial?.note ?? "");

  const onlyDigits = (raw: string) => raw.replace(/\D/g, "").slice(0, 9);
  const formatDigits = (d: string) => (d ? Number(d).toLocaleString("en-NG") : "");
  const shortcuts = deadlineShortcuts();

  const save = async () => {
    setConfirming(false);
    setSubmitting(true);
    try {
      await onSave({ title: title.trim(), note: note.trim(), amount, dueDate, category, allowGuests });
    } finally {
      setSubmitting(false);
    }
  };

  // New dues confirm first (members get notified); edits save straight away.
  const submit = () => {
    if (!valid || submitting) return;
    if (editing) void save();
    else setConfirming(true);
  };

  const cancel = () => (dirty ? setDiscarding(true) : onCancel());

  const actionLabel = submitting
    ? editing
      ? "Saving…"
      : "Publishing…"
    : editing
      ? "Save changes"
      : amount > 0
        ? `Publish · ${naira(amount)}`
        : "Publish due";

  const missingHint = valid ? null : `Add ${missing.join(", ").replace(/, ([^,]*)$/, " and $1")} to publish.`;

  return (
    <div>
      {/* Header. */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={cancel}
          aria-label="Back to dues"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-cloud text-ink-soft transition-colors hover:bg-paper hover:text-ink cursor-pointer"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold tracking-tight text-ink sm:text-xl">
            {editing ? "Edit due" : "New due"}
          </h1>
          <p className="truncate text-xs text-ink-soft sm:text-[13px]">For {spaceName}</p>
        </div>
      </div>

      {/* min-w-0 on both columns: grid items otherwise grow to their content's
          min width (the big amount input), pushing the page wider than a phone. */}
      <div className="mt-5 grid min-w-0 items-start gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          {/* Amount — the number that matters most, entered big. */}
          <section className="rounded-3xl border border-cloud bg-canvas p-4 sm:p-6">
            <Label htmlFor="due-amount" className="block text-xs font-medium text-ink-soft">
              Amount per member
            </Label>
            <div className="mt-2 flex items-baseline gap-1 border-b border-cloud pb-3 focus-within:border-brand">
              <span className="text-3xl font-semibold text-ink-soft">₦</span>
              <input
                id="due-amount"
                inputMode="numeric"
                size={1}
                autoComplete="off"
                value={formatDigits(amountDigits)}
                onChange={(e) => setAmountDigits(onlyDigits(e.target.value))}
                placeholder="0"
                disabled={amountLocked}
                className="w-full min-w-0 flex-1 bg-transparent text-[40px] disabled:opacity-60 font-semibold leading-none tracking-tight text-ink tabular-nums outline-none placeholder:text-ink-soft/40"
              />
            </div>

            {amountLocked ? (
              <p className="mt-3 text-xs text-ink-soft">
                {initial?.paidCount} member{initial?.paidCount === 1 ? " has" : "s have"} already paid, so the amount
                can&apos;t change.
              </p>
            ) : (
            <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
              {QUICK_AMOUNTS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmountDigits(String(v))}
                  className={chip(amount === v)}
                >
                  {naira(v)}
                </button>
              ))}
            </div>
            )}

            {/* What it adds up to across the class. */}
            {amount > 0 && memberCount > 0 && (
              <div className="mt-4 flex items-center gap-3 rounded-2xl bg-cloud/60 px-4 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-canvas text-brand">
                  <HugeiconsIcon icon={UserMultipleIcon} size={16} />
                </span>
                <p className="text-xs text-ink-soft">
                  Up to{" "}
                  <span className="font-semibold text-ink tabular-nums">{naira(amount * memberCount)}</span>{" "}
                  from {memberCount.toLocaleString("en-NG")} member{memberCount === 1 ? "" : "s"}. Members pay
                  a small service fee on top, so you receive the full {naira(amount)} each.
                </p>
              </div>
            )}
          </section>

          {/* Details. */}
          <Section title="Details" hint="What it's for and when it's due.">
            <div className="flex flex-col gap-5">
              <Field label="Type">
                <CategoryPicker value={category} onChange={setCategory} />
              </Field>

              <Field
                label="Title"
                aside={<span className="text-[11px] text-ink-soft tabular-nums">{title.length}/120</span>}
              >
                <Input
                  value={title}
                  maxLength={120}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={TITLE_EXAMPLE[category] ?? "e.g. First Semester Levy"}
                  className={BRAND_INPUT}
                />
              </Field>

              <Field label="Deadline">
                <div className="-mx-4 mb-2 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
                  {shortcuts.map((s) => (
                    <button key={s.label} type="button" onClick={() => setDueDate(s.value)} className={chip(dueDate === s.value)}>
                      {s.label}
                    </button>
                  ))}
                </div>
                <DatePicker value={dueDate} onChange={setDueDate} placeholder="Or pick a date" />
              </Field>

              <Field
                label="Description (optional)"
                aside={<span className="text-[11px] text-ink-soft tabular-nums">{note.length}/500</span>}
              >
                <textarea
                  value={note}
                  maxLength={500}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What does it cover? e.g. labs, printing credits and the resource portal."
                  className="min-h-[88px] w-full resize-none rounded-2xl border border-cloud bg-canvas px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-brand placeholder:text-ink-soft"
                />
              </Field>
            </div>
          </Section>
        </div>

        {/* Preview + actions (actions move to a bottom bar on phones). */}
        <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-24">
          <Section title="Preview" hint="How members will see it in their dues.">
            <DuePreview title={title} category={category} amount={amount} dueDate={dueDate} note={note} />
          </Section>

          <div className="hidden rounded-3xl border border-cloud bg-canvas p-4 sm:block">
            <button
              type="button"
              onClick={submit}
              disabled={!valid || submitting}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <HugeiconsIcon icon={editing ? CheckmarkCircle02Icon : SentIcon} size={16} />
              )}
              {actionLabel}
            </button>
            <button
              type="button"
              onClick={cancel}
              disabled={submitting}
              className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-full bg-paper text-sm font-semibold text-ink transition-colors duration-300 hover:bg-cloud disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            {missingHint && <p className="mt-3 text-center text-[11px] text-ink-soft">{missingHint}</p>}
          </div>
        </aside>
      </div>

      {/* Phones: room for the fixed action bar. */}
      <div aria-hidden className="h-24 sm:hidden" />
      <div className="fixed inset-x-4 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-20 sm:hidden">
        <div className="mx-auto max-w-md rounded-[28px] border border-cloud bg-canvas/95 p-1.5 shadow-[0_18px_40px_-20px_rgba(11,110,79,0.5)] backdrop-blur">
          {missingHint && <p className="px-3 pb-1.5 pt-1 text-center text-[11px] text-ink-soft">{missingHint}</p>}
          <button
            type="button"
            onClick={submit}
            disabled={!valid || submitting}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-opacity disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <HugeiconsIcon icon={editing ? CheckmarkCircle02Icon : SentIcon} size={16} />
            )}
            {actionLabel}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirming}
        tone="brand"
        icon={SentIcon}
        title={`Publish ${title.trim() || "this due"}?`}
        description={`${naira(amount)} per member${
          memberCount > 0 ? ` · ${memberCount.toLocaleString("en-NG")} members will be notified` : ""
        }. They can pay right away. You can edit or close it later, but a published due can't be deleted.`}
        confirmLabel="Publish"
        onConfirm={() => void save()}
        onClose={() => setConfirming(false)}
      />
      <ConfirmDialog
        open={discarding}
        icon={Delete02Icon}
        title="Discard changes?"
        description={editing ? "Your edits to this due won't be saved." : "This due hasn't been published, so what you've entered will be lost."}
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onConfirm={() => {
          setDiscarding(false);
          onCancel();
        }}
        onClose={() => setDiscarding(false)}
      />
    </div>
  );
}
