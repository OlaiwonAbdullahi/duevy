import { useId } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import type { HugeIcon } from "../../_components/nav-config";
import type { Space } from "./types";
import { EMBLEM_PALETTES } from "./data";

/**
 * Thick, round-capped strokes in the style of the Duevy doodle artwork, drawn
 * in a 100×100 box. Each space picks one (plus a dot and a rotation) from a
 * hash of its id, so every logo is distinct but clearly from the same family.
 */
const DOODLES = [
  "M-10 72 C 12 72, 20 44, 44 44 S 72 68, 94 52 S 110 18, 122 22",
  "M22 -10 C 22 20, 52 28, 54 52 S 30 86, 50 112",
  "M-10 26 C 16 14, 36 34, 30 58 S 56 96, 82 82 S 98 48, 114 56",
  "M-8 88 C 18 96, 34 70, 30 46 S 48 6, 78 14 S 110 46, 116 30",
] as const;

const DOTS = [
  { cx: 80, cy: 24 },
  { cx: 22, cy: 78 },
  { cx: 78, cy: 80 },
  { cx: 24, cy: 22 },
] as const;

function hash(value: string) {
  let h = 0;
  for (const ch of value) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/**
 * A space's logo: a rounded plate in the space's palette, carved with a
 * doodle stroke unique to that space, the monogram set across the middle and,
 * optionally, a white medallion at the lower-right carrying the category glyph.
 * Pure SVG + CSS (no image asset), so it stays crisp at any size. `interactive`
 * wires a hover drift to the `group` on the enclosing card.
 */
export function SpaceEmblem({
  space,
  glyph,
  size = 56,
  interactive = false,
  className = "",
}: {
  space: Pick<Space, "id" | "short" | "hue">;
  glyph?: HugeIcon;
  size?: number;
  interactive?: boolean;
  /** Extra classes for the plate itself — e.g. a ring to lift it off a cover. */
  className?: string;
}) {
  const uid = useId();
  const p = EMBLEM_PALETTES[space.hue] ?? EMBLEM_PALETTES.emerald;
  const h = hash(space.id || space.short || "duevy");
  const doodle = DOODLES[h % DOODLES.length];
  const dot = DOTS[(h >>> 3) % DOTS.length];
  const turn = ((h >>> 6) % 4) * 90;

  const monogram = (space.short || "—").slice(0, 5).toUpperCase();
  const fontScale = monogram.length > 4 ? 0.22 : monogram.length > 3 ? 0.25 : 0.3;
  const medallion = Math.max(16, size * 0.38);

  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <span
        className={`relative grid h-full w-full place-items-center overflow-hidden ${className}`}
        style={{
          borderRadius: size * 0.3,
          color: p.ink,
          backgroundColor: p.base,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.25), inset 0 0 0 1px rgba(255,255,255,0.08), 0 10px 22px -14px ${p.base}`,
        }}
      >
        <svg
          aria-hidden
          viewBox="0 0 100 100"
          className={`absolute inset-0 h-full w-full ${
            interactive
              ? "transition-transform duration-700 ease-out group-hover:scale-110 group-hover:rotate-6"
              : ""
          }`}
        >
          <defs>
            <radialGradient id={`${uid}-light`} cx="25%" cy="12%" r="95%">
              <stop offset="0%" stopColor={p.sheen} stopOpacity="0.95" />
              <stop offset="60%" stopColor={p.base} stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill={`url(#${uid}-light)`} />
          <g transform={`rotate(${turn} 50 50)`}>
            <path
              d={doodle}
              fill="none"
              stroke="#fff"
              strokeOpacity="0.16"
              strokeWidth="15"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx={dot.cx} cy={dot.cy} r="9" fill="#fff" fillOpacity="0.12" />
          </g>
        </svg>

        <span
          className="relative font-bold leading-none tracking-tight"
          style={{
            fontSize: size * fontScale,
            textShadow: `0 1px 2px ${p.base}`,
          }}
        >
          {monogram}
        </span>
      </span>

      {glyph && (
        <span
          className={`absolute grid place-items-center rounded-full bg-white shadow-[0_2px_6px_-2px_rgba(0,0,0,0.25)] ring-2 ring-canvas ${
            interactive ? "transition-transform duration-300 group-hover:-translate-y-0.5" : ""
          }`}
          style={{
            width: medallion,
            height: medallion,
            right: -medallion * 0.22,
            bottom: -medallion * 0.22,
            color: p.base,
          }}
        >
          <HugeiconsIcon icon={glyph} size={medallion * 0.56} />
        </span>
      )}
    </span>
  );
}
