"use client";

import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  CheckmarkCircle02Icon,
  Delete02Icon,
  Download04Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import { useSpace } from "@/lib/api/queries";
import {
  MAX_SIGNATURES,
  RECEIPT_DEFAULTS,
  addReceiptSignature,
  getReceiptDesign,
  receiptSamplePath,
  removeReceiptLogo,
  removeReceiptStamp,
  removeReceiptSignature,
  removeSignatureImage,
  saveReceiptDesign,
  uploadReceiptLogo,
  uploadReceiptStamp,
  uploadSignatureImage,
  type ReceiptDesign,
  type ReceiptDesignSettings,
  type StampStyle,
} from "@/lib/api/receipt-design";
import { BRAND_INPUT } from "../_components/form-styles";
import { useRepSpace } from "../_components/use-rep-space";
import { SPACE_THEMES } from "../_components/space-theme";
import { Toggle } from "../settings/_components/Toggle";
import { ColorPicker } from "./_components/ColorPicker";
import { ImageField } from "./_components/ImageField";
import { ReceiptPreview } from "./_components/ReceiptPreview";
import PageSkeleton from "./loading";

/** Duevy's look. Signatures aren't part of it: resetting keeps them. */
const DEFAULT_LOOK: Omit<ReceiptDesignSettings, "signatures"> = {
  accent: null,
  headerStyle: "artwork",
  title: null,
  showStamp: true,
  stampText: null,
  stampStyle: "round",
  stampColor: null,
  thankYou: null,
  note: null,
  showAnswers: true,
};

/** Colour picks: Duevy green (no accent), then the space themes' colours. */
const SWATCHES: { label: string; value: string | null; swatch: string }[] = [
  { label: "Duevy green", value: null, swatch: RECEIPT_DEFAULTS.accent },
  ...SPACE_THEMES.filter((t) => t.swatch !== RECEIPT_DEFAULTS.accent).map((t) => ({
    label: t.label,
    value: t.swatch,
    swatch: t.swatch,
  })),
  { label: "Charcoal", value: "#1f2937", swatch: "#1f2937" },
];

/** Classic ink colours for the stamp, beyond matching the receipt. */
const STAMP_SWATCHES = [
  { label: "Red ink", value: "#b91c1c", swatch: "#b91c1c" },
  { label: "Blue ink", value: "#1d4ed8", swatch: "#1d4ed8" },
  { label: "Purple ink", value: "#6d28d9", swatch: "#6d28d9" },
  { label: "Black ink", value: "#1f2937", swatch: "#1f2937" },
];

const STAMP_SHAPES: { id: StampStyle; label: string }[] = [
  { id: "round", label: "Round seal" },
  { id: "rect", label: "Rubber stamp" },
  { id: "ribbon", label: "Ribbon" },
];

/** Colour dots plus our own picker for anything else. */
function SwatchRow({
  options,
  value,
  fallback,
  disabled,
  checkContrast,
  onChange,
}: {
  options: { label: string; value: string | null; swatch: string }[];
  value: string | null;
  fallback: string;
  disabled: boolean;
  checkContrast?: boolean;
  onChange: (value: string | null) => void;
}) {
  const custom = value && !options.some((o) => o.value === value) ? value : null;
  return (
    <div className="flex flex-wrap items-center gap-3">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.label}
            type="button"
            onClick={() => onChange(o.value)}
            disabled={disabled}
            aria-pressed={on}
            aria-label={o.label}
            title={o.label}
            style={{ backgroundColor: o.swatch, ...(on && { ["--tw-ring-color" as string]: o.swatch }) }}
            className={cn(
              "grid h-9 w-9 place-items-center rounded-full text-white transition-transform cursor-pointer disabled:cursor-not-allowed",
              on ? "ring-2 ring-offset-2 ring-offset-canvas" : "hover:scale-110",
            )}
          >
            {on && <HugeiconsIcon icon={Tick02Icon} size={16} strokeWidth={2.5} />}
          </button>
        );
      })}
      <ColorPicker
        value={custom}
        fallback={value ?? fallback}
        active={!!custom}
        disabled={disabled}
        checkContrast={checkContrast}
        onChange={onChange}
      />
    </div>
  );
}

/** A tiny outline of each stamp shape, for its chip. */
function StampShapeIcon({ shape }: { shape: StampStyle }) {
  return (
    <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden className="shrink-0">
      {shape === "round" ? (
        <circle cx="9" cy="7" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      ) : shape === "rect" ? (
        <rect x="1.5" y="2.5" width="15" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
      ) : (
        <path d="M1 3h16l-2.5 4L17 11H1l2.5-4z" fill="currentColor" />
      )}
    </svg>
  );
}

const settingsOf = (d: ReceiptDesign): ReceiptDesignSettings => ({
  accent: d.accent,
  headerStyle: d.headerStyle,
  title: d.title,
  showStamp: d.showStamp,
  stampText: d.stampText,
  stampStyle: d.stampStyle,
  stampColor: d.stampColor,
  thankYou: d.thankYou,
  note: d.note,
  showAnswers: d.showAnswers,
  signatures: d.signatures.map(({ id, name, role }) => ({ id, name, role })),
});

const iconButton =
  "grid h-8 w-8 place-items-center rounded-full text-ink-soft transition-colors hover:bg-paper hover:text-ink disabled:pointer-events-none disabled:opacity-30 cursor-pointer";

const chip = (on: boolean) =>
  cn(
    "inline-flex h-9 items-center rounded-full border px-3.5 text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed",
    on ? "border-brand bg-brand text-white" : "border-cloud bg-canvas text-ink-soft hover:text-ink",
  );

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-cloud bg-canvas p-4 sm:p-6">
      <h2 className="text-sm font-semibold tracking-tight text-ink">{title}</h2>
      {hint && <p className="mt-0.5 text-xs text-ink-soft">{hint}</p>}
      <div className="mt-4 flex flex-col gap-5">{children}</div>
    </section>
  );
}

function Field({
  id,
  label,
  count,
  children,
}: {
  id?: string;
  label: string;
  count?: { value: string | null; max: number };
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="block text-xs font-medium text-ink-soft">
          {label}
        </Label>
        {count && (
          <span className="text-[11px] text-ink-soft tabular-nums">
            {(count.value ?? "").length}/{count.max}
          </span>
        )}
      </div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function ToggleRow({
  title,
  hint,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  hint: string;
  checked: boolean;
  disabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{hint}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} label={title} disabled={disabled} />
    </div>
  );
}

/**
 * Receipt design: the lead rep restyles the receipts their payers get — colour,
 * header, wording, a note, their own logo and signatures — with a live
 * preview. Co-reps can look but not change it.
 */
export default function ReceiptDesignPage() {
  const repSpace = useRepSpace();
  const spaceId = repSpace?.id;
  const spaceName = useSpace(spaceId).data?.name ?? repSpace?.name ?? "Your department";
  // Reads "rep" until the reps list resolves lead/co; the backend enforces it either way.
  const canEdit = repSpace?.membership !== "co";

  const [saved, setSaved] = useState<ReceiptDesign | null>(null);
  const [draft, setDraft] = useState<ReceiptDesignSettings>({ ...DEFAULT_LOOK, signatures: [] });
  const [adding, setAdding] = useState(false);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!spaceId) return;
    let cancelled = false;
    getReceiptDesign(spaceId)
      .then((d) => {
        if (cancelled) return;
        setSaved(d);
        setDraft(settingsOf(d));
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [spaceId]);

  if (failed) {
    return (
      <p className="mx-auto max-w-md rounded-3xl border border-cloud bg-canvas p-6 text-center text-sm text-ink-soft">
        Couldn&apos;t load your receipt design. Refresh to try again.
      </p>
    );
  }
  if (!saved || !spaceId) return <PageSkeleton />;

  const dirty = JSON.stringify(draft) !== JSON.stringify(settingsOf(saved));
  const isDefaultLook = JSON.stringify({ ...draft, signatures: undefined }) === JSON.stringify(DEFAULT_LOOK);
  const set = <K extends keyof ReceiptDesignSettings>(key: K, value: ReceiptDesignSettings[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const text = (key: "title" | "stampText" | "thankYou" | "note") => ({
    value: draft[key] ?? "",
    disabled: !canEdit,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(key, e.target.value || null),
  });

  const fail = (err: unknown, fallback: string) =>
    toast.error(err instanceof ApiError ? err.message : fallback);

  const save = async () => {
    setSaving(true);
    try {
      const next = await saveReceiptDesign(spaceId, draft);
      setSaved(next);
      setDraft(settingsOf(next));
      toast.success("Receipt design saved", { description: "Every receipt from now on uses it — including re-downloads." });
    } catch (err) {
      fail(err, "Couldn't save the receipt design.");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Take a design the server just sent after an image or signatory change.
   * Unsaved edits stay; the draft's signatures follow the server's list —
   * removed ones go, new ones join the end.
   */
  const applyServer = (next: ReceiptDesign) => {
    setSaved(next);
    setDraft((d) => {
      const ids = new Set(next.signatures.map((s) => s.id));
      const kept = d.signatures.filter((s) => ids.has(s.id));
      const added = next.signatures.filter((s) => !kept.some((k) => k.id === s.id)).map(({ id, name, role }) => ({ id, name, role }));
      return { ...d, signatures: [...kept, ...added] };
    });
  };

  // Images and signatories save on their own, so they never wait on the Save button.
  const serverCall = async (work: () => Promise<ReceiptDesign>, fallback: string, done?: string) => {
    try {
      applyServer(await work());
      if (done) toast.success(done);
    } catch (err) {
      fail(err, fallback);
    }
  };

  const addSignature = async () => {
    setAdding(true);
    await serverCall(() => addReceiptSignature(spaceId), "Couldn't add a signature.");
    setAdding(false);
  };
  const setSignature = (i: number, patch: { name?: string | null; role?: string | null }) =>
    setDraft((d) => ({ ...d, signatures: d.signatures.map((s, j) => (j === i ? { ...s, ...patch } : s)) }));
  const moveSignature = (i: number, by: -1 | 1) =>
    setDraft((d) => {
      const next = [...d.signatures];
      [next[i], next[i + by]] = [next[i + by]!, next[i]!];
      return { ...d, signatures: next };
    });
  const imageOf = (id: string) => saved.signatures.find((s) => s.id === id)?.image ?? null;

  const downloadSample = async () => {
    setDownloading(true);
    try {
      const url = URL.createObjectURL(await apiClient.getBlob(receiptSamplePath(spaceId)));
      // Safari and some mobile browsers ignore clicks on a link that isn't in the page.
      const a = document.createElement("a");
      a.href = url;
      a.download = "receipt-sample.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (err) {
      fail(err, "Couldn't download the sample.");
    } finally {
      setDownloading(false);
    }
  };

  const actions = canEdit && (
    <button
        type="button"
        onClick={() => void save()}
        disabled={!dirty || saving}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
      >
        {saving ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        ) : (
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
        )}
        {saving ? "Saving…" : dirty ? "Save design" : "Saved"}
    </button>
  );

  return (
    <div className="mx-auto max-w-6xl">
      <header>
        <span className="mb-2 hidden rounded-full bg-cloud px-3 py-1 text-[11px] font-semibold text-brand sm:inline-block">
          Rep tools
        </span>
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">Receipt design</h1>
        <p className="mt-1 text-[13px] text-ink-soft">
          Make the receipts your payers get look like they came from {spaceName}.
        </p>
      </header>

      {!canEdit && (
        <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
          Only the lead rep can change the receipt design. You can preview it and download a sample.
        </p>
      )}

      <div className="mt-5 grid min-w-0 items-start gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <Section title="Brand" hint="Your logo and colour on every receipt.">
            <ImageField
              label="Logo"
              hint="PNG or JPEG, ideally with a transparent background. It sits on the coloured header, and Duevy's name moves to the footer."
              value={saved.logo}
              max={{ w: 600, h: 240 }}
              disabled={!canEdit}
              onSave={(blob) => serverCall(() => uploadReceiptLogo(spaceId, blob), "Couldn't upload that image.", "Logo updated")}
              onRemove={() => serverCall(() => removeReceiptLogo(spaceId), "Couldn't remove the logo.")}
            />

            <Field label="Colour">
              <SwatchRow
                options={SWATCHES}
                value={draft.accent}
                fallback={RECEIPT_DEFAULTS.accent}
                disabled={!canEdit}
                onChange={(v) => set("accent", v)}
              />
            </Field>

            <Field label="Header">
              <div className="flex gap-2">
                <button type="button" disabled={!canEdit} onClick={() => set("headerStyle", "artwork")} className={chip(draft.headerStyle === "artwork")}>
                  With artwork
                </button>
                <button type="button" disabled={!canEdit} onClick={() => set("headerStyle", "solid")} className={chip(draft.headerStyle === "solid")}>
                  Plain colour
                </button>
              </div>
            </Field>
          </Section>

          <Section title="Wording" hint="Leave a box empty to use Duevy's wording.">
            <Field id="r-title" label="Receipt title" count={{ value: draft.title, max: 32 }}>
              <Input id="r-title" maxLength={32} placeholder={RECEIPT_DEFAULTS.title} className={BRAND_INPUT} {...text("title")} />
            </Field>

            <Field id="r-thanks" label="Thank-you line" count={{ value: draft.thankYou, max: 80 }}>
              <Input id="r-thanks" maxLength={80} placeholder={RECEIPT_DEFAULTS.thankYou} className={BRAND_INPUT} {...text("thankYou")} />
            </Field>

            <Field id="r-note" label="Note to payers (optional)" count={{ value: draft.note, max: 300 }}>
              <textarea
                id="r-note"
                maxLength={300}
                placeholder="e.g. Collect your handout from Room 12 after lectures. Bring this receipt."
                className="min-h-[88px] w-full resize-none rounded-2xl border border-cloud bg-canvas px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-brand placeholder:text-ink-soft disabled:opacity-60"
                {...text("note")}
              />
            </Field>

            <ToggleRow
              title="Print guests' answers"
              hint="Answers to your guest pay questions (sizes, phone numbers…) appear under “Your details”."
              checked={draft.showAnswers}
              disabled={!canEdit}
              onChange={(v) => set("showAnswers", v)}
            />
          </Section>

          <Section title="Stamp" hint="The stamp beside the totals.">
            <ToggleRow
              title="Show the stamp"
              hint="Turn it off for a cleaner receipt."
              checked={draft.showStamp}
              disabled={!canEdit}
              onChange={(v) => set("showStamp", v)}
            />
            {draft.showStamp && (
              <>
                <ImageField
                  label="Your own stamp (optional)"
                  hint="Upload your department's official stamp, ideally a PNG with a transparent background. It replaces the shape below."
                  value={saved.stampImage}
                  max={{ w: 400, h: 400 }}
                  disabled={!canEdit}
                  onSave={(blob) => serverCall(() => uploadReceiptStamp(spaceId, blob), "Couldn't upload that image.", "Stamp updated")}
                  onRemove={() => serverCall(() => removeReceiptStamp(spaceId), "Couldn't remove the stamp.")}
                />
                <div className={cn("flex flex-col gap-5", saved.stampImage && "pointer-events-none opacity-50")}>
                  {saved.stampImage && (
                    <p className="-mb-2 text-[11px] text-ink-soft">Your uploaded stamp is in use. Remove it to use a drawn one.</p>
                  )}
                  <Field label="Shape">
                    <div className="flex flex-wrap gap-2">
                      {STAMP_SHAPES.map((shape) => (
                        <button
                          key={shape.id}
                          type="button"
                          disabled={!canEdit || !!saved.stampImage}
                          onClick={() => set("stampStyle", shape.id)}
                          aria-pressed={draft.stampStyle === shape.id}
                          className={cn(chip(draft.stampStyle === shape.id), "gap-2")}
                        >
                          <StampShapeIcon shape={shape.id} />
                          {shape.label}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field id="r-stamp" label="Stamp word" count={{ value: draft.stampText, max: 10 }}>
                    <Input
                      id="r-stamp"
                      maxLength={10}
                      placeholder={RECEIPT_DEFAULTS.stampText}
                      className={BRAND_INPUT}
                      {...text("stampText")}
                      disabled={!canEdit || !!saved.stampImage}
                    />
                  </Field>
                  <Field label="Stamp colour">
                    <SwatchRow
                      options={[{ label: "Match receipt", value: null, swatch: draft.accent ?? RECEIPT_DEFAULTS.accent }, ...STAMP_SWATCHES]}
                      value={draft.stampColor}
                      fallback={draft.accent ?? RECEIPT_DEFAULTS.accent}
                      checkContrast={false}
                      disabled={!canEdit || !!saved.stampImage}
                      onChange={(v) => set("stampColor", v)}
                    />
                  </Field>
                </div>
              </>
            )}
          </Section>

          <Section
            title="Signatures"
            hint={`Up to ${MAX_SIGNATURES} signatories, e.g. the class rep and the treasurer. They print side by side, first on the left.`}
          >
            {draft.signatures.length === 0 && (
              <p className="rounded-2xl border border-dashed border-cloud p-4 text-center text-xs text-ink-soft">
                No signatures yet.
              </p>
            )}
            {draft.signatures.map((sig, i) => (
              <div key={sig.id} className="rounded-2xl border border-cloud p-4">
                <div className="flex items-center gap-1">
                  <p className="flex-1 text-xs font-semibold text-ink">Signatory {i + 1}</p>
                  {canEdit && (
                    <>
                      <button type="button" onClick={() => moveSignature(i, -1)} disabled={i === 0} aria-label="Move up" className={iconButton}>
                        <HugeiconsIcon icon={ArrowUp01Icon} size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSignature(i, 1)}
                        disabled={i === draft.signatures.length - 1}
                        aria-label="Move down"
                        className={iconButton}
                      >
                        <HugeiconsIcon icon={ArrowDown01Icon} size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void serverCall(() => removeReceiptSignature(spaceId, sig.id), "Couldn't remove that signature.")}
                        aria-label={`Remove signatory ${i + 1}`}
                        className={cn(iconButton, "hover:text-rose-600")}
                      >
                        <HugeiconsIcon icon={Delete02Icon} size={16} />
                      </button>
                    </>
                  )}
                </div>
                <div className="mt-3 flex flex-col gap-4">
                  <ImageField
                    label="Signature"
                    hint="Draw it here, or upload a photo of it on plain white paper."
                    value={imageOf(sig.id)}
                    max={{ w: 600, h: 200 }}
                    canDraw
                    disabled={!canEdit}
                    onSave={(blob) =>
                      serverCall(() => uploadSignatureImage(spaceId, sig.id, blob), "Couldn't upload that image.", "Signature updated")
                    }
                    onRemove={() => serverCall(() => removeSignatureImage(spaceId, sig.id), "Couldn't remove that image.")}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field id={`r-sig-name-${sig.id}`} label="Name under it" count={{ value: sig.name, max: 60 }}>
                      <Input
                        id={`r-sig-name-${sig.id}`}
                        maxLength={60}
                        placeholder="e.g. Ada Obi"
                        className={BRAND_INPUT}
                        value={sig.name ?? ""}
                        disabled={!canEdit}
                        onChange={(e) => setSignature(i, { name: e.target.value || null })}
                      />
                    </Field>
                    <Field id={`r-sig-role-${sig.id}`} label="Role" count={{ value: sig.role, max: 60 }}>
                      <Input
                        id={`r-sig-role-${sig.id}`}
                        maxLength={60}
                        placeholder="e.g. Class rep, CSC 300L"
                        className={BRAND_INPUT}
                        value={sig.role ?? ""}
                        disabled={!canEdit}
                        onChange={(e) => setSignature(i, { role: e.target.value || null })}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            ))}
            {canEdit && draft.signatures.length < MAX_SIGNATURES && (
              <button
                type="button"
                onClick={() => void addSignature()}
                disabled={adding}
                className="inline-flex h-10 items-center justify-center gap-1.5 self-start rounded-full border border-brand/30 px-4 text-xs font-semibold text-brand transition-colors hover:bg-brand/5 disabled:opacity-50 cursor-pointer"
              >
                <HugeiconsIcon icon={Add01Icon} size={14} />
                {adding ? "Adding…" : draft.signatures.length ? "Add another signatory" : "Add a signatory"}
              </button>
            )}
          </Section>
        </div>

        <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-24">
          <section className="rounded-3xl border border-cloud bg-canvas p-4 sm:p-6">
            <h2 className="text-sm font-semibold tracking-tight text-ink">Preview</h2>
            <p className="mt-0.5 text-xs text-ink-soft">A sample payment, updating as you edit.</p>
            <div className="mx-auto mt-4 max-w-[380px]">
              <ReceiptPreview
                design={{ ...saved, ...draft, signatures: draft.signatures.map((sig) => ({ ...sig, image: imageOf(sig.id) })) }}
                spaceName={spaceName}
              />
            </div>
          </section>

          <div className="flex flex-col gap-2 rounded-3xl border border-cloud bg-canvas p-4">
            <div className="hidden sm:block">{actions}</div>
            <button
              type="button"
              onClick={() => void downloadSample()}
              disabled={downloading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-paper text-sm font-semibold text-ink transition-colors duration-300 hover:bg-cloud disabled:opacity-50 cursor-pointer"
            >
              <HugeiconsIcon icon={Download04Icon} size={16} />
              {downloading ? "Preparing…" : "Download sample PDF"}
            </button>
            {dirty && <p className="text-center text-[11px] text-ink-soft">The sample uses your saved design — save first to include these changes.</p>}
            {canEdit && !isDefaultLook && (
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...DEFAULT_LOOK, signatures: d.signatures }))}
                className="mt-1 text-xs font-semibold text-ink-soft hover:text-ink cursor-pointer"
              >
                Reset wording and colours to Duevy&apos;s
              </button>
            )}
          </div>
        </aside>
      </div>

      {/* Phones: a save bar while there are unsaved changes. */}
      {canEdit && dirty && (
        <>
          <div aria-hidden className="h-24 sm:hidden" />
          <div className="fixed inset-x-4 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-20 sm:hidden">
            <div className="mx-auto max-w-md rounded-[28px] border border-cloud bg-canvas/95 p-1.5 shadow-[0_18px_40px_-20px_rgba(11,110,79,0.5)] backdrop-blur">
              {actions}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
