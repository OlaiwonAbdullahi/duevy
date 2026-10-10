"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon, Notification02Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { useRole, type Role } from "./role-context";
import { ThemeToggle } from "./ThemeToggle";

const ROLES: { value: Role; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "rep", label: "Rep" },
];

export default function Topbar({ onMenu }: { onMenu: () => void }) {
  const { role, setRole } = useRole();

  return (
    <header className="sticky top-0 z-30 flex h-18 items-center gap-4 border-b border-cloud bg-canvas/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      {/* Mobile menu */}
      <button
        onClick={onMenu}
        aria-label="Open menu"
        className="lg:hidden grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-paper transition-colors duration-300 cursor-pointer"
      >
        <HugeiconsIcon icon={Menu01Icon} size={22} />
      </button>

      <div className="hidden sm:block">
        <p className="text-sm font-semibold text-ink">Good afternoon, Amara</p>
        <p className="text-xs text-ink-soft">Computer Science · 300 level</p>
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Role switch — demo only. Lets you see how one route renders per role.
            Replace with the real signed-in role once auth is wired up. */}
        <div className="flex items-center rounded-full border border-cloud bg-paper p-1">
          <span className="hidden px-2 text-[11px] font-medium text-ink-soft md:inline">
            View as
          </span>
          {ROLES.map((r) => (
            <button
              key={r.value}
              onClick={() => setRole(r.value)}
              className={cn(
                "rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors duration-300 cursor-pointer",
                role === r.value
                  ? "bg-brand text-white"
                  : "text-ink-soft hover:text-ink"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>

        <ThemeToggle />

        <button
          aria-label="Notifications"
          className="relative grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-paper transition-colors duration-300 cursor-pointer"
        >
          <HugeiconsIcon icon={Notification02Icon} size={20} />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-brand" />
        </button>

        <div className="grid h-9 w-9 place-items-center rounded-full bg-brand text-[13px] font-semibold text-white">
          AO
        </div>
      </div>
    </header>
  );
}
