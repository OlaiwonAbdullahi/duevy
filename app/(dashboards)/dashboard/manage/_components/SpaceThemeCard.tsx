"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { PaintBoardIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { SPACE_THEMES, useSpaceTheme } from "../../_components/space-theme";
import { SettingsCard } from "../../settings/_components/SettingsCard";

/**
 * Lets the rep pick the space's colour theme. The pick re-tints this whole
 * dashboard instantly, and it's the colour students will see on the space.
 */
export function SpaceThemeCard() {
  const { themeId, setThemeId } = useSpaceTheme();

  // The saved theme comes from localStorage, which the server can't see —
  // only mark the selected swatch after hydration to avoid a mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const pick = (id: (typeof SPACE_THEMES)[number]["id"], label: string) => {
    if (id === themeId) return;
    setThemeId(id);
    toast.success("Space theme updated", { description: label });
  };

  return (
    <SettingsCard
      icon={PaintBoardIcon}
      title="Space theme"
      description="Pick your department's colour. It styles your dashboard and how students see your space."
    >
      <ul className="flex flex-wrap gap-4 sm:gap-5">
        {SPACE_THEMES.map((theme) => {
          const selected = mounted && theme.id === themeId;
          return (
            <li key={theme.id}>
              <button
                type="button"
                onClick={() => pick(theme.id, theme.label)}
                aria-pressed={selected}
                aria-label={`Use the ${theme.label} theme`}
                className="group flex cursor-pointer flex-col items-center gap-1.5 focus-visible:outline-none"
              >
                <span
                  // The selection ring matches the swatch, not the active brand.
                  style={{
                    backgroundColor: theme.swatch,
                    ...(selected && {
                      ["--tw-ring-color" as string]: theme.swatch,
                    }),
                  }}
                  className={cn(
                    "grid h-10 w-10 place-items-center rounded-full text-white transition-all duration-300 group-focus-visible:ring-2 group-focus-visible:ring-brand/40 group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-canvas",
                    selected
                      ? "ring-2 ring-offset-2 ring-offset-canvas"
                      : "group-hover:scale-110",
                  )}
                >
                  {selected && <HugeiconsIcon icon={Tick02Icon} size={18} strokeWidth={2.5} />}
                </span>
                <span
                  className={cn(
                    "text-[11px] font-semibold transition-colors duration-300",
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
      <p className="mt-4 text-xs text-ink-soft">
        Members see this colour across your space — dues, receipts, and the join
        page included.
      </p>
    </SettingsCard>
  );
}
