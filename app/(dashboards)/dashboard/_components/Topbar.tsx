"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { useRole, type Role } from "./role-context";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationsMenu } from "./NotificationsMenu";

const ROLES: { value: Role; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "rep", label: "Rep" },
];

export default function Topbar({
  onMenu,
  onSearch,
}: {
  onMenu: () => void;
  onSearch: () => void;
}) {
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

      {/* Search trigger — opens the ⌘K command palette. */}
      <button
        type="button"
        onClick={onSearch}
        className="hidden items-center gap-2 rounded-full border border-cloud bg-paper py-2 pl-3 pr-2 text-ink-soft transition-colors duration-300 hover:bg-cloud cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:flex sm:w-64 md:w-72"
      >
        <HugeiconsIcon icon={Search01Icon} size={16} className="shrink-0" />
        <span className="flex-1 text-left text-sm">Search…</span>
        <kbd className="rounded-md border border-cloud bg-canvas px-1.5 py-0.5 text-[10px] font-semibold">
          ⌘K
        </kbd>
      </button>

      <button
        type="button"
        onClick={onSearch}
        aria-label="Search"
        className="grid h-10 w-10 place-items-center rounded-full text-ink transition-colors duration-300 hover:bg-paper cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:hidden"
      >
        <HugeiconsIcon icon={Search01Icon} size={20} />
      </button>

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

        <NotificationsMenu />

        <div className="grid h-9 w-9 place-items-center rounded-full bg-brand text-[13px] font-semibold text-white">
          AO
        </div>
      </div>
    </header>
  );
}
