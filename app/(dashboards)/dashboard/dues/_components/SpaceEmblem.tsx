import { HugeiconsIcon } from "@hugeicons/react";
import { Building03Icon } from "@hugeicons/core-free-icons";
import type { HugeIcon } from "../../_components/nav-config";
import type { Space } from "./types";
import { EMBLEM_PALETTES } from "./data";

/**
 * A space's "crest" — a squircle plate painted from the space's palette, with a
 * concentric-ring engraving, a top-light sheen and the monogram struck across
 * the middle. A small medallion in the lower-right carries the space's category
 * glyph. Built from layered CSS (no image asset) so it stays crisp at any size
 * and animates cheaply. `interactive` wires the hover motion the grid drives via
 * the `group` on the enclosing card.
 */
export function SpaceEmblem({
  space,
  glyph,
  size = 56,
  interactive = false,
}: {
  space: Space;
  glyph?: HugeIcon;
  size?: number;
  interactive?: boolean;
}) {
  const p = EMBLEM_PALETTES[space.hue];
  const radius = size * 0.32;

  return (
    <span
      className="relative inline-grid shrink-0 place-items-center overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        color: p.ink,
        backgroundImage: `radial-gradient(120% 120% at 30% 15%, ${p.sheen} 0%, ${p.base} 55%, ${p.base} 100%)`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,0.28), inset 0 0 0 1px rgba(255,255,255,0.08), 0 8px 20px -12px ${p.base}`,
      }}
    >
      {/* Concentric ring engraving, off-set to the lower-right. Rotates a touch
          on hover to give the crest a sense of weight. */}
      <span
        className={`pointer-events-none absolute -bottom-1/3 -right-1/3 aspect-square w-[150%] rounded-full border ${
          interactive
            ? "transition-transform duration-500 ease-out group-hover:rotate-45"
            : ""
        }`}
        style={{ borderColor: "rgba(255,255,255,0.14)" }}
      >
        <span
          className="absolute rounded-full border"
          style={{ inset: size * 0.14, borderColor: "rgba(255,255,255,0.1)" }}
        />
        <span
          className="absolute rounded-full border"
          style={{ inset: size * 0.28, borderColor: "rgba(255,255,255,0.07)" }}
        />
      </span>

      {/* Monogram — the space's short code, struck across the plate. */}
      <span
        className="relative font-semibold leading-none tracking-tight"
        style={{ fontSize: size * (space.short.length > 4 ? 0.24 : 0.3) }}
      >
        {space.short}
      </span>

      {/* Category medallion, notched into the lower-right corner. */}
      {glyph && (
        <span
          className={`absolute grid place-items-center rounded-full bg-white text-ink shadow-sm ${
            interactive
              ? "transition-transform duration-300 group-hover:-translate-y-0.5"
              : ""
          }`}
          style={{
            width: size * 0.36,
            height: size * 0.36,
            right: -size * 0.06,
            bottom: -size * 0.06,
            color: p.base,
          }}
        >
          <HugeiconsIcon icon={glyph ?? Building03Icon} size={size * 0.2} />
        </span>
      )}
    </span>
  );
}
