"use client";

import { useTheme } from "next-themes";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PaintBoardIcon,
  Sun03Icon,
  Moon02Icon,
  ComputerIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { HugeIcon } from "../../_components/nav-config";
import { SettingsCard } from "./SettingsCard";

const OPTIONS: { value: string; label: string; icon: HugeIcon }[] = [
  { value: "light", label: "Light", icon: Sun03Icon },
  { value: "dark", label: "Dark", icon: Moon02Icon },
  { value: "system", label: "System", icon: ComputerIcon },
];

export function AppearanceCard() {
  // next-themes returns `undefined` during SSR and the first client render, so
  // no button is highlighted until it resolves post-mount — no hydration flash.
  const { theme, setTheme } = useTheme();
  const active = theme;

  return (
    <SettingsCard
      icon={PaintBoardIcon}
      title="Appearance"
      description="Pick a theme, or follow your device."
    >
      <div className="grid grid-cols-3 gap-3">
        {OPTIONS.map((opt) => {
          const on = active === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setTheme(opt.value)}
              aria-pressed={on}
              className={cn(
                "flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 transition-colors duration-300 cursor-pointer",
                on
                  ? "border-brand bg-cloud text-brand"
                  : "border-cloud bg-paper text-ink-soft hover:text-ink",
              )}
            >
              <HugeiconsIcon icon={opt.icon} size={22} />
              <span className="text-[13px] font-semibold">{opt.label}</span>
            </button>
          );
        })}
      </div>
    </SettingsCard>
  );
}
