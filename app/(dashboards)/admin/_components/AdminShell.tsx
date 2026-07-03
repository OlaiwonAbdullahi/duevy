"use client";

import { useState, type ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon, Notification02Icon } from "@hugeicons/core-free-icons";
import Sidebar from "../../dashboard/_components/Sidebar";
import { ADMIN_GROUPS } from "../../dashboard/_components/nav-config";
import { ThemeToggle } from "../../dashboard/_components/ThemeToggle";

export default function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar
        groups={ADMIN_GROUPS}
        subtitle="Admin console"
        open={open}
        onClose={() => setOpen(false)}
      />

      <div className="flex min-h-screen flex-col lg:pl-72">
        <header className="sticky top-0 z-30 flex h-18 items-center gap-4 border-b border-cloud bg-canvas/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="lg:hidden grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-paper transition-colors duration-300 cursor-pointer"
          >
            <HugeiconsIcon icon={Menu01Icon} size={22} />
          </button>

          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-ink">Admin console</p>
            <p className="text-xs text-ink-soft">Platform-wide oversight</p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <button
              aria-label="Notifications"
              className="grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-paper transition-colors duration-300 cursor-pointer"
            >
              <HugeiconsIcon icon={Notification02Icon} size={20} />
            </button>
            <div className="grid h-9 w-9 place-items-center rounded-full bg-brand text-[13px] font-semibold text-white">
              AD
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
