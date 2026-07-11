"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Menu01Icon, Notification02Icon } from "@hugeicons/core-free-icons";
import { useAuth } from "@/lib/auth/auth-context";
import Sidebar from "../../dashboard/_components/Sidebar";
import { ADMIN_GROUPS } from "../../dashboard/_components/nav-config";
import { ThemeToggle } from "../../dashboard/_components/ThemeToggle";

export default function AdminShell({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // The admin console is admin-only — bounce everyone else.
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (status === "authenticated" && user?.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [status, user, router]);

  if (status !== "authenticated" || user?.role !== "admin") {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cloud border-t-brand" />
      </div>
    );
  }

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
