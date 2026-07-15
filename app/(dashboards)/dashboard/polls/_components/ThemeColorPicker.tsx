"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { SPACE_THEMES, type SpaceThemeId } from "../../_components/space-theme";

/**
 * Lets a rep pick a colour for this poll's public voting page — reuses the
 * same five space themes as Manage → Space theme (`data-space-theme` +
 * globals.css), just scoped to the vote page instead of the whole dashboard.
 */
export function ThemeColorPicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (id: SpaceThemeId) => void;
}) {
  return (
    <ul className="flex flex-wrap gap-3">
      {SPACE_THEMES.map((theme) => {
        const selected = (value ?? "emerald") === theme.id;
        return (
          <li key={theme.id}>
            <button
              type="button"
              onClick={() => onChange(theme.id)}
              aria-pressed={selected}
              aria-label={`Use the ${theme.label} theme`}
              className="group flex cursor-pointer flex-col items-center gap-1 focus-visible:outline-none"
            >
              <span
                style={{
                  backgroundColor: theme.swatch,
                  ...(selected && { ["--tw-ring-color" as string]: theme.swatch }),
                }}
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-full text-white transition-all duration-300",
                  selected
                    ? "ring-2 ring-offset-2 ring-offset-canvas"
                    : "group-hover:scale-110",
                )}
              >
                {selected && <HugeiconsIcon icon={Tick02Icon} size={16} strokeWidth={2.5} />}
              </span>
              <span
                className={cn(
                  "text-[10px] font-semibold transition-colors duration-300",
                  selected ? "text-ink" : "text-ink-soft group-hover:text-ink",
                )}
              >
                {theme.label}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
