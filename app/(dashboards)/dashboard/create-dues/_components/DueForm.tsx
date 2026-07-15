"use client";

import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  PencilEdit01Icon,
  AddInvoiceIcon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BRAND_INPUT } from "../../_components/form-styles";
import { SettingsCard } from "../../settings/_components/SettingsCard";
import { ToggleRow } from "../../settings/_components/Toggle";
import type { DueCategory } from "../../dues/_components/types";
import type { DueDraft, RepDue } from "./types";
import { CategoryPicker } from "./CategoryPicker";
import { DatePicker } from "./DatePicker";
import { DuePreview } from "./DuePreview";

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <Label className="block text-xs font-medium text-ink-soft">{label}</Label>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1 text-[11px] text-ink-soft">{hint}</p>}
    </div>
  );
}

/** Create or edit a single due. Kept lean — a due always targets the rep's own space. */
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
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState<DueCategory>(initial?.category ?? "levy");
  const [amountDigits, setAmountDigits] = useState(
    initial ? String(initial.amount) : "",
  );
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [allowGuests, setAllowGuests] = useState(initial?.allowGuests ?? false);
  const [submitting, setSubmitting] = useState(false);

  const amount = Number(amountDigits || 0);
  const valid = title.trim().length > 1 && amount > 0 && dueDate !== "";

  const onlyDigits = (raw: string) => raw.replace(/\D/g, "").slice(0, 9);
  const formatDigits = (d: string) => (d ? Number(d).toLocaleString("en-NG") : "");

  const submit = async () => {
    if (!valid) {
      toast.error("Add a title, amount and deadline first");
      return;
    }
    setSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        note: note.trim(),
        amount,
        dueDate,
        category,
        allowGuests,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft transition-colors hover:text-ink cursor-pointer"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
        All dues
      </button>

      <div className="mt-4 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-cloud text-brand">
          <HugeiconsIcon icon={editing ? PencilEdit01Icon : AddInvoiceIcon} size={20} />
        </span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            {editing ? "Edit due" : "Create a due"}
          </h1>
          <p className="text-[13px] text-ink-soft">
            For {spaceName}
          </p>
        </div>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Fields. */}
        <SettingsCard
          icon={PencilEdit01Icon}
          title="Due details"
          description="What are you collecting, and how much?"
        >
          <div className="flex flex-col gap-4">
            <Field label="Title">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. First Semester Departmental Levy"
                className={BRAND_INPUT}
              />
            </Field>

            <Field label="Category">
              <CategoryPicker value={category} onChange={setCategory} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Amount">
                <div className="flex items-center gap-1 rounded-2xl border border-cloud bg-canvas px-4 focus-within:border-brand">
                  <span className="text-sm font-semibold text-ink-soft">₦</span>
                  <Input
                    inputMode="numeric"
                    value={formatDigits(amountDigits)}
                    onChange={(e) => setAmountDigits(onlyDigits(e.target.value))}
                    placeholder="0"
                    className="h-11 border-0 bg-transparent px-1 text-sm text-ink shadow-none focus-visible:ring-0 placeholder:text-ink-soft"
                  />
                </div>
              </Field>

              <Field label="Deadline">
                <DatePicker value={dueDate} onChange={setDueDate} />
              </Field>
            </div>

            <Field label="Description" hint="Optional — tell members what it covers.">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Covers labs, printing credits and the resource portal."
                className="min-h-[84px] w-full resize-none rounded-2xl border border-cloud bg-canvas px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-brand placeholder:text-ink-soft"
              />
            </Field>

            <div className="border-t border-cloud pt-1">
              <ToggleRow
                title="Allow guests to pay"
                description="Non-members can pay this due with a shared link."
                checked={allowGuests}
                onChange={setAllowGuests}
              />
            </div>
          </div>
        </SettingsCard>

        {/* Preview + actions. */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
          <section className="rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
            <h2 className="text-base font-semibold tracking-tight text-ink">
              Preview
            </h2>
            <p className="mt-0.5 text-[13px] text-ink-soft">
              How members will see this due.
            </p>
            <div className="mt-4">
              <DuePreview
                title={title}
                category={category}
                amount={amount}
                dueDate={dueDate}
                note={note}
              />
            </div>
          </section>

          <div className="rounded-3xl border border-cloud bg-canvas p-4">
            <button
              type="button"
              onClick={submit}
              disabled={!valid || submitting}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              {submitting && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {submitting
                ? editing
                  ? "Saving changes…"
                  : "Publishing…"
                : editing
                  ? "Save changes"
                  : "Publish due"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-full bg-paper text-sm font-semibold text-ink transition-colors duration-300 hover:bg-cloud disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <p className="mt-3 flex items-start gap-1.5 text-[11px] text-ink-soft">
              <HugeiconsIcon
                icon={InformationCircleIcon}
                size={13}
                className="mt-px shrink-0"
              />
              Members can pay from their wallet, card or bank transfer once
              published.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
