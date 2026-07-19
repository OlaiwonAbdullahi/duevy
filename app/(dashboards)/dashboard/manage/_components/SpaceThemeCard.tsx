"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { PaintBoardIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import {
  SPACE_THEMES,
  isSpaceThemeId,
  useSpaceTheme,
} from "../../_components/space-theme";
import { SettingsCard } from "../../settings/_components/SettingsCard";
import { useRepSpace } from "../../_components/use-rep-space";
import { getSpace } from "@/lib/api/spaces";
import { updateSpaceProfile } from "@/lib/api/rep";
import { ApiError } from "@/lib/api/errors";

/**
 * Lets the lead rep pick the space's colour theme, saved via `PATCH
 * /spaces/:id`. The pick re-tints this whole dashboard instantly and is the
 * colour students see on the space.
 */
export function SpaceThemeCard() {
  const repSpace = useRepSpace();
  const spaceId = repSpace?.id;
  const { themeId, setThemeId } = useSpaceTheme();

  // Only mark the selected swatch after hydration to avoid a mismatch with the
  // pre-paint script's localStorage read, and once the space's actual saved
  // theme has loaded (it may differ from this browser's cached value).
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!spaceId) return;
    let cancelled = false;
    getSpace(spaceId)
      .then((space) => {
        if (cancelled) return;
        if (isSpaceThemeId(space.theme)) setThemeId(space.theme);
        setMounted(true);
      })
      .catch(() => setMounted(true));
    return () => {
      cancelled = true;
    };
    // `setThemeId` is stable (context), so this only re-runs when the space changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spaceId]);

  const pick = async (id: (typeof SPACE_THEMES)[number]["id"], label: string) => {
    if (id === themeId || saving || !spaceId) return;
    const previous = themeId;
    setThemeId(id);
    setSaving(true);
    try {
      await updateSpaceProfile(spaceId, { theme: id });
      toast.success("Space theme updated", { description: label });
    } catch (err) {
      setThemeId(previous);
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Couldn't update the space theme.",
      );
    } finally {
      setSaving(false);
    }
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
                onClick={() => void pick(theme.id, theme.label)}
                disabled={saving}
                aria-pressed={selected}
                aria-label={`Use the ${theme.label} theme`}
                className="group flex cursor-pointer flex-col items-center gap-1.5 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
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
