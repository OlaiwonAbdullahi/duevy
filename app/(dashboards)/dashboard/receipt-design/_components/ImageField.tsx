import { useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, PencilEdit02Icon, Upload04Icon } from "@hugeicons/core-free-icons";
import { prepareImage } from "./image";
import { SignaturePad } from "./SignaturePad";

const pill =
  "inline-flex h-9 items-center gap-1.5 rounded-full border border-cloud px-3.5 text-xs font-semibold text-ink transition-colors hover:border-brand/40 hover:text-brand disabled:opacity-50 cursor-pointer";

/**
 * Pick, replace or remove one receipt image. Files are resized in the browser
 * before upload; the signature can also be drawn on the spot.
 */
export function ImageField({
  label,
  hint,
  value,
  max,
  canDraw = false,
  disabled,
  onSave,
  onRemove,
}: {
  label: string;
  hint: string;
  /** The saved image as a data URL. */
  value: string | null;
  /** Largest size to keep, in pixels. */
  max: { w: number; h: number };
  canDraw?: boolean;
  disabled: boolean;
  onSave: (image: Blob) => Promise<void>;
  onRemove: () => Promise<void>;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drawing, setDrawing] = useState(false);

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    try {
      await work();
      setDrawing(false);
    } finally {
      setBusy(false);
    }
  };

  const pick = (file: File | undefined) => {
    if (!file) return;
    void run(async () => onSave(await prepareImage(file, max.w, max.h)));
  };

  return (
    <div>
      <p className="text-xs font-medium text-ink-soft">{label}</p>
      <p className="mt-0.5 text-[11px] text-ink-soft">{hint}</p>

      {drawing ? (
        <div className="mt-2">
          <SignaturePad busy={busy} onDone={(png) => void run(() => onSave(png))} onCancel={() => setDrawing(false)} />
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-3">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={label} className="h-14 max-w-[180px] rounded-xl bg-white object-contain p-2" />
          ) : (
            <span className="grid h-14 w-24 place-items-center rounded-xl border border-dashed border-cloud text-[11px] text-ink-soft">
              None
            </span>
          )}
          {!disabled && (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => input.current?.click()} disabled={busy} className={pill}>
                <HugeiconsIcon icon={Upload04Icon} size={14} />
                {busy ? "Uploading…" : value ? "Replace" : "Upload"}
              </button>
              {canDraw && (
                <button type="button" onClick={() => setDrawing(true)} disabled={busy} className={pill}>
                  <HugeiconsIcon icon={PencilEdit02Icon} size={14} />
                  Draw
                </button>
              )}
              {value && (
                <button
                  type="button"
                  onClick={() => void run(onRemove)}
                  disabled={busy}
                  aria-label={`Remove ${label.toLowerCase()}`}
                  className={`${pill} hover:border-rose-200 hover:text-rose-600`}
                >
                  <HugeiconsIcon icon={Delete02Icon} size={14} />
                  Remove
                </button>
              )}
            </div>
          )}
          <input
            ref={input}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              pick(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
      )}
    </div>
  );
}
