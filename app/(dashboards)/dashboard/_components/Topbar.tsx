"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon, Search01Icon, Logout01Icon } from "@hugeicons/core-free-icons";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationsMenu } from "./NotificationsMenu";
import { UserAvatar } from "./UserAvatar";

export default function Topbar({
  onMenu,
  onSearch,
}: {
  onMenu: () => void;
  onSearch: () => void;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-18 items-center gap-2.5 border-b border-cloud bg-canvas/80 px-4 backdrop-blur-md sm:gap-4 sm:px-6 lg:px-8">
      {/* Mobile menu */}
      <button
        onClick={onMenu}
        data-tour="menu"
        aria-label="Open menu"
        className="lg:hidden grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-paper transition-colors duration-300 cursor-pointer"
      >
        <HugeiconsIcon icon={Menu01Icon} size={22} />
      </button>

      {/* Search trigger — opens the ⌘K command palette. */}
      <button
        type="button"
        onClick={onSearch}
        data-tour="search"
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
        data-tour="search"
        aria-label="Search"
        className="grid h-10 w-10 place-items-center rounded-full text-ink transition-colors duration-300 hover:bg-paper cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:hidden"
      >
        <HugeiconsIcon icon={Search01Icon} size={20} />
      </button>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <ThemeToggle />

        <NotificationsMenu />

        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Account menu"
              className="grid place-items-center rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <UserAvatar name={user?.name ?? ""} src={user?.avatarUrl} size={36} />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-1.5">
            <div className="px-2.5 py-2">
              <p className="truncate text-sm font-semibold text-ink">{user?.name}</p>
              <p className="truncate text-xs text-ink-soft">{user?.email}</p>
            </div>
            <div className="my-1 h-px bg-cloud" />
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-ink transition-colors duration-300 hover:bg-paper cursor-pointer"
            >
              <HugeiconsIcon icon={Logout01Icon} size={16} />
              Log out
            </button>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}
