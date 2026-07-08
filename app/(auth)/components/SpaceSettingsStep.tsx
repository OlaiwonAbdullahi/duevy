"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon,
  Tick02Icon,
  PaintBoardIcon,
  SecurityCheckIcon,
} from "@hugeicons/core-free-icons";
import {
  SPACE_THEMES,
  type SpaceThemeId,
} from "@/app/(dashboards)/dashboard/_components/space-theme";

export type SpaceSettings = {
  theme: SpaceThemeId;
  requireApproval: boolean;
};

/**
 * Onboarding step (rep only): a couple of space defaults the rep can change
 * later. `theme` is the space colour (shared `SPACE_THEMES`, same list as the
 * dashboard manage page); `requireApproval` gates joins behind rep review (§4.4).
 */
export default function SpaceSettingsStep({
  defaultValues,
  submitLabel,
  onBack,
  onSubmit,
}: {
  defaultValues: SpaceSettings;
  submitLabel: string;
  onBack: () => void;
  onSubmit: (data: SpaceSettings) => void;
}) {
  const [theme, setTheme] = useState<SpaceThemeId>(defaultValues.theme);
  const [requireApproval, setRequireApproval] = useState(
    defaultValues.requireApproval,
  );

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ theme, requireApproval });
      }}
    >
      {/* Space theme */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-[#1b2520]">
          <HugeiconsIcon icon={PaintBoardIcon} size={16} />
          <span className="text-[13px] font-medium leading-none">
            Space theme
          </span>
        </div>
        <ul className="flex flex-wrap items-start gap-4">
          {SPACE_THEMES.map((option) => {
            const selected = theme === option.id;
            return (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => setTheme(option.id)}
                  aria-pressed={selected}
                  aria-label={`Use the ${option.label} theme`}
                  className="group flex cursor-pointer flex-col items-center gap-1.5 focus-visible:outline-none"
                >
                  <span
                    style={{
                      backgroundColor: option.swatch,
                      ...(selected && {
                        ["--tw-ring-color" as string]: option.swatch,
                      }),
                    }}
                    className={`grid h-10 w-10 place-items-center rounded-full text-white transition-all duration-300 ${
                      selected
                        ? "ring-2 ring-offset-2 ring-offset-white"
                        : "group-hover:scale-110"
                    }`}
                  >
                    {selected && (
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        size={16}
                        strokeWidth={2.5}
                      />
                    )}
                  </span>
                  <span
                    className={`text-[11px] font-semibold transition-colors duration-300 ${
                      selected
                        ? "text-[#1b2520]"
                        : "text-[#7a847f] group-hover:text-[#1b2520]"
                    }`}
                  >
                    {option.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Join approval */}
      <label className="flex items-start justify-between gap-4 rounded-2xl border border-[#e6f2ec] bg-[#fbfaf7] p-4 cursor-pointer">
        <span className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e6f2ec] text-[#0b6e4f]">
            <HugeiconsIcon icon={SecurityCheckIcon} size={18} />
          </span>
          <span className="flex flex-col gap-1">
            <span className="text-[#1b2520] text-[14px] font-semibold leading-none">
              Approve new members
            </span>
            <span className="text-[#7a847f] text-[12px] leading-snug">
              Review each join request before students can pay dues.
            </span>
          </span>
        </span>

        <button
          type="button"
          role="switch"
          aria-checked={requireApproval}
          onClick={() => setRequireApproval((value) => !value)}
          className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors duration-300 cursor-pointer ${
            requireApproval ? "bg-[#0b6e4f]" : "bg-[#d9e5df]"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-300 ${
              requireApproval ? "left-[22px]" : "left-0.5"
            }`}
          />
        </button>
      </label>

      <div className="mt-1 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="h-[52px] shrink-0 rounded-full border border-[#e6f2ec] px-6 text-[#1b2520] text-[15px] font-semibold transition-colors duration-300 hover:bg-[#f4f2ec] cursor-pointer"
        >
          Back
        </button>
        <button
          type="submit"
          className="group inline-flex h-[52px] flex-1 items-center justify-center gap-2 rounded-full bg-[#0b6e4f] text-white text-[15px] font-semibold transition-colors duration-300 hover:bg-[#0f996d] cursor-pointer"
        >
          {submitLabel}
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={16}
            className="transition-transform duration-500 group-hover:translate-x-1"
          />
        </button>
      </div>
    </form>
  );
}
