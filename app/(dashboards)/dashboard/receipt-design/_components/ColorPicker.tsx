import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon } from "@hugeicons/core-free-icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Hsv = { h: number; s: number; v: number };

const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));

function hexToHsv(hex: string): Hsv {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => c / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  const h = d === 0 ? 0 : max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s: max === 0 ? 0 : d / max, v: max };
}

function hsvToHex({ h, s, v }: Hsv) {
  const f = (k: number) => {
    const n = (k + h / 60) % 6;
    return Math.round((v - v * s * Math.max(0, Math.min(n, 4 - n, 1))) * 255);
  };
  return `#${[f(5), f(3), f(1)].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

/** WCAG contrast of white text on this colour. */
function contrastWithWhite(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const l = 0.2126 * lin(((n >> 16) & 255) / 255) + 0.7152 * lin(((n >> 8) & 255) / 255) + 0.0722 * lin((n & 255) / 255);
  return 1.05 / (l + 0.05);
}

/** Dark, receipt-friendly picks beyond the main swatches. */
const SUGGESTED = ["#0f766e", "#1e3a8a", "#4c1d95", "#831843", "#7c2d12", "#3f6212", "#374151", "#000000"];

/**
 * Duevy's own colour picker: a saturation/brightness square, a hue slider, a
 * hex box and a few suggestions, in a popover. Drag with mouse or touch, or
 * use the arrow keys on either control. Can warn when white text won't read
 * on the pick, since the receipt's header and total print white over it.
 */
export function ColorPicker({
  value,
  fallback,
  active,
  disabled,
  checkContrast = true,
  onChange,
}: {
  /** The chosen custom colour, or null when a preset (or none) is chosen. */
  value: string | null;
  /** Where the picker starts when there's no custom colour yet. */
  fallback: string;
  active: boolean;
  disabled: boolean;
  /** Warn when white text won't read on the pick (off for colours nothing white sits on). */
  checkContrast?: boolean;
  onChange: (hex: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(value ?? fallback));
  const [hexDraft, setHexDraft] = useState<string | null>(null);
  const hex = hsvToHex(hsv);
  const lowContrast = checkContrast && contrastWithWhite(hex) < 4.5;

  const commit = (next: Hsv) => {
    setHsv(next);
    setHexDraft(null);
    onChange(hsvToHex(next));
  };

  const openChange = (next: boolean) => {
    // Start from whatever's showing on the receipt now.
    if (next) setHsv(hexToHsv(value ?? fallback));
    setOpen(next);
  };

  return (
    <Popover open={open} onOpenChange={openChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label="Custom colour"
          className={cn(
            "inline-flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 data-[state=open]:border-brand",
            active ? "border-brand text-ink" : "border-cloud text-ink-soft hover:text-ink",
          )}
        >
          <span
            className="h-4 w-4 rounded-full border border-black/10"
            style={{ background: active && value ? value : "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)" }}
          />
          {active && value ? value.toUpperCase() : "Custom"}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 rounded-2xl p-3">
        <SatValSquare hsv={hsv} onChange={commit} />
        <HueSlider hue={hsv.h} onChange={(h) => commit({ ...hsv, h })} />

        <div className="mt-3 flex items-center gap-2">
          <span className="h-9 w-9 shrink-0 rounded-xl border border-black/10" style={{ backgroundColor: hex }} />
          <label className="flex h-9 min-w-0 flex-1 items-center rounded-xl border border-cloud bg-canvas px-3 focus-within:border-brand">
            <span className="text-xs text-ink-soft">#</span>
            <input
              value={hexDraft ?? hex.slice(1).toUpperCase()}
              maxLength={6}
              spellCheck={false}
              aria-label="Hex colour"
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9a-f]/gi, "");
                setHexDraft(v);
                if (v.length === 6) {
                  setHsv(hexToHsv(`#${v}`));
                  onChange(`#${v.toLowerCase()}`);
                }
              }}
              onBlur={() => setHexDraft(null)}
              className="w-full min-w-0 bg-transparent pl-1 font-mono text-xs uppercase text-ink outline-none"
            />
          </label>
        </div>

        {lowContrast && (
          <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-amber-50 px-2.5 py-2 text-[11px] leading-snug text-amber-800">
            <HugeiconsIcon icon={Alert01Icon} size={13} className="mt-px shrink-0" />
            White text is hard to read on this colour. Try a darker shade.
          </p>
        )}

        <div className="mt-3 border-t border-cloud pt-3">
          <p className="text-[11px] font-medium text-ink-soft">Suggested</p>
          <div className="mt-2 grid grid-cols-8 gap-1.5">
            {SUGGESTED.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => commit(hexToHsv(s))}
                aria-label={s}
                title={s.toUpperCase()}
                style={{ backgroundColor: s }}
                className={cn(
                  "aspect-square rounded-full transition-transform hover:scale-110 cursor-pointer",
                  hex === s && "ring-2 ring-brand ring-offset-2 ring-offset-canvas",
                )}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Track a pointer across an element as 0–1 fractions, while it's held down. */
function useDrag(onMove: (x: number, y: number) => void) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const r = ref.current!.getBoundingClientRect();
    onMove(clamp((e.clientX - r.left) / r.width), clamp((e.clientY - r.top) / r.height));
  };
  return {
    ref,
    onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      move(e);
    },
    onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) move(e);
    },
  };
}

function SatValSquare({ hsv, onChange }: { hsv: Hsv; onChange: (hsv: Hsv) => void }) {
  const drag = useDrag((x, y) => onChange({ ...hsv, s: x, v: 1 - y }));
  const key = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 0.1 : 0.02;
    const moves: Record<string, Partial<Hsv>> = {
      ArrowLeft: { s: clamp(hsv.s - step) },
      ArrowRight: { s: clamp(hsv.s + step) },
      ArrowUp: { v: clamp(hsv.v + step) },
      ArrowDown: { v: clamp(hsv.v - step) },
    };
    if (!moves[e.key]) return;
    e.preventDefault();
    onChange({ ...hsv, ...moves[e.key] });
  };

  return (
    <div
      {...drag}
      role="slider"
      tabIndex={0}
      aria-label="Saturation and brightness"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(hsv.s * 100)}
      aria-valuetext={`Saturation ${Math.round(hsv.s * 100)}%, brightness ${Math.round(hsv.v * 100)}%`}
      onKeyDown={key}
      className="relative h-36 w-full touch-none rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brand/40 cursor-crosshair"
      style={{
        backgroundColor: `hsl(${hsv.h} 100% 50%)`,
        backgroundImage: "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)",
      }}
    >
      <span
        className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)]"
        style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, backgroundColor: hsvToHex(hsv) }}
      />
    </div>
  );
}

function HueSlider({ hue, onChange }: { hue: number; onChange: (h: number) => void }) {
  const drag = useDrag((x) => onChange(Math.min(359.9, x * 360)));
  const key = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 15 : 3;
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    onChange((hue + (e.key === "ArrowRight" ? step : -step) + 360) % 360);
  };

  return (
    <div
      {...drag}
      role="slider"
      tabIndex={0}
      aria-label="Hue"
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={Math.round(hue)}
      onKeyDown={key}
      className="relative mt-3 h-3 w-full touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-brand/40 cursor-pointer"
      style={{ background: "linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" }}
    >
      <span
        className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3)]"
        style={{ left: `${(hue / 360) * 100}%`, backgroundColor: `hsl(${hue} 100% 50%)` }}
      />
    </div>
  );
}
