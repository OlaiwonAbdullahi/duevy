"use client";

import { useTheme } from "next-themes";
import { HugeiconsIcon } from "@hugeicons/react";
import { Sun03Icon, Moon02Icon } from "@hugeicons/core-free-icons";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="grid h-9 w-9 place-items-center rounded-full text-ink hover:bg-paper transition-colors duration-300 cursor-pointer"
    >
      {/* Icons are both rendered; the .dark class (set pre-paint by next-themes)
          decides which is visible — so there's no hydration flash or mismatch. */}
      <HugeiconsIcon icon={Moon02Icon} size={18} className="block dark:hidden" />
      <HugeiconsIcon icon={Sun03Icon} size={18} className="hidden dark:block" />
    </button>
  );
}
