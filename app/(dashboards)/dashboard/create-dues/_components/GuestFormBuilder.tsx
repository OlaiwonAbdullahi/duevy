import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Cancel01Icon,
  Delete02Icon,
  SquareLock02Icon,
} from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { GuestField, GuestFieldType } from "@/lib/api/types";
import { BRAND_INPUT } from "../../_components/form-styles";
import { Toggle } from "../../settings/_components/Toggle";

/** Matches the backend's cap (lib/guestForm.ts). */
const MAX_FIELDS = 10;

const TYPE_LABEL: Record<GuestFieldType, string> = {
  text: "Short answer",
  textarea: "Paragraph",
  number: "Number",
  email: "Email",
  phone: "Phone number",
  select: "Dropdown",
};

/**
 * The form every new due starts with, on top of the always-asked fields
 * (matches the API's DEFAULT_GUEST_FIELDS). Reps can edit, reorder or remove
 * it — nothing has to be built before publishing.
 */
export const DEFAULT_GUEST_FIELDS: GuestField[] = [{ id: "phone", label: "Phone number", type: "phone", required: false }];

/** Asked on every pay link, so they're shown locked. The API asks them itself. */
const CORE_FIELDS = ["Full name", "Email", "Matric number"];

/** A due's own questions, minus any an older form asked that are core now (its matric number). */
export function editableGuestFields(fields: GuestField[] | null): GuestField[] {
  return (fields ?? []).filter((f) => f.id !== "matric");
}

/** One-tap questions reps reach for most. */
const PRESETS: GuestField[] = [
  ...DEFAULT_GUEST_FIELDS,
  { id: "department", label: "Department", type: "text", required: false },
  { id: "size", label: "T-shirt size", type: "select", required: true, options: ["S", "M", "L", "XL", "XXL"] },
];

/** What's still missing before the form can be saved, for DueForm's publish hint. */
export function guestFieldsIssue(fields: GuestField[]): string | null {
  if (fields.some((f) => !f.label.trim())) return "a label for each guest question";
  if (fields.some((f) => f.type === "select" && (f.options?.length ?? 0) < 2)) return "two choices for each dropdown";
  return null;
}

const newId = () => `q_${Math.random().toString(36).slice(2, 10)}`;

const iconButton =
  "grid h-8 w-8 place-items-center rounded-full text-ink-soft transition-colors hover:bg-paper hover:text-ink disabled:pointer-events-none disabled:opacity-30 cursor-pointer";

/**
 * The form payers fill in on a due's pay link, on top of the name, email and
 * matric number every payer gives (needed for the receipt and to match
 * payments, so they're shown locked). Reps add, edit, reorder and remove the rest.
 */
export function GuestFormBuilder({
  fields,
  onChange,
}: {
  fields: GuestField[];
  onChange: (fields: GuestField[]) => void;
}) {
  const full = fields.length >= MAX_FIELDS;
  const presets = PRESETS.filter((p) => !fields.some((f) => f.id === p.id));

  const update = (i: number, patch: Partial<GuestField>) =>
    onChange(fields.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  const move = (i: number, by: -1 | 1) => {
    const next = [...fields];
    [next[i], next[i + by]] = [next[i + by]!, next[i]!];
    onChange(next);
  };
  const setType = (i: number, type: GuestFieldType) =>
    update(i, { type, options: type === "select" ? (fields[i]!.options ?? []) : undefined });

  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-xs font-medium text-ink">What payers fill in</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-ink-soft">
          A ready-to-use form to start with. Change it to ask for anything you need to match payments, like
          sizes, levels or seat choices.
        </p>
      </div>

      {CORE_FIELDS.map((label) => (
        <div key={label} className="flex items-center gap-2 rounded-2xl border border-cloud bg-paper/40 px-4 py-3">
          <HugeiconsIcon icon={SquareLock02Icon} size={14} className="text-ink-soft" />
          <p className="flex-1 text-sm text-ink">{label}</p>
          <span className="text-[11px] text-ink-soft">Always asked</span>
        </div>
      ))}

      {fields.map((f, i) => (
        <div key={f.id} className="rounded-2xl border border-cloud bg-canvas p-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={f.label}
              maxLength={80}
              onChange={(e) => update(i, { label: e.target.value })}
              placeholder="Question, e.g. Hall of residence"
              aria-label={`Question ${i + 1}`}
              className={cn(BRAND_INPUT, "min-w-0 flex-1")}
            />
            <Select value={f.type} onValueChange={(v) => setType(i, v as GuestFieldType)}>
              <SelectTrigger aria-label="Answer type" className="h-11 rounded-2xl text-sm font-normal sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(TYPE_LABEL) as GuestFieldType[]).map((t) => (
                  <SelectItem key={t} value={t}>
                    {TYPE_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {f.type === "select" && (
            <OptionsEditor options={f.options ?? []} onChange={(options) => update(i, { options })} />
          )}

          <div className="mt-2 flex items-center gap-2">
            <Toggle checked={f.required} onChange={(required) => update(i, { required })} label="Required" />
            <span className="flex-1 text-xs text-ink-soft">{f.required ? "Required" : "Optional"}</span>
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className={iconButton}>
              <HugeiconsIcon icon={ArrowUp01Icon} size={16} />
            </button>
            <button
              type="button"
              onClick={() => move(i, 1)}
              disabled={i === fields.length - 1}
              aria-label="Move down"
              className={iconButton}
            >
              <HugeiconsIcon icon={ArrowDown01Icon} size={16} />
            </button>
            <button
              type="button"
              onClick={() => onChange(fields.filter((_, j) => j !== i))}
              aria-label="Remove question"
              className={cn(iconButton, "hover:text-rose-600")}
            >
              <HugeiconsIcon icon={Delete02Icon} size={16} />
            </button>
          </div>
        </div>
      ))}

      {full ? (
        <p className="text-[11px] text-ink-soft">That&apos;s the most questions a pay form can have ({MAX_FIELDS}).</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onChange([...fields, { id: newId(), label: "", type: "text", required: false }])}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-brand/30 px-3.5 text-xs font-semibold text-brand transition-colors hover:bg-brand/5 cursor-pointer"
          >
            <HugeiconsIcon icon={Add01Icon} size={14} />
            Add question
          </button>
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange([...fields, p])}
              className="inline-flex h-9 items-center rounded-full border border-cloud px-3.5 text-xs font-semibold text-ink-soft transition-colors hover:text-ink cursor-pointer"
            >
              + {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** A dropdown's choices: type one and press Enter to add it. */
function OptionsEditor({ options, onChange }: { options: string[]; onChange: (options: string[]) => void }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (v && !options.includes(v) && options.length < 20) onChange([...options, v]);
    setDraft("");
  };

  return (
    <div className="mt-2 rounded-2xl border border-cloud bg-paper/40 p-2">
      {options.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {options.map((o) => (
            <li key={o} className="inline-flex h-7 items-center gap-1 rounded-full bg-canvas pl-3 pr-1 text-xs text-ink">
              {o}
              <button
                type="button"
                onClick={() => onChange(options.filter((x) => x !== o))}
                aria-label={`Remove ${o}`}
                className="grid h-5 w-5 place-items-center rounded-full text-ink-soft hover:text-ink cursor-pointer"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Input
        value={draft}
        maxLength={60}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        placeholder={options.length < 2 ? "Add a choice and press Enter (at least two)" : "Add another choice"}
        aria-label="Add a choice"
        className={cn(BRAND_INPUT, "h-9 bg-canvas")}
      />
    </div>
  );
}
