"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Clock01Icon, MailAtSign01Icon } from "@hugeicons/core-free-icons";
import { useAuth } from "@/lib/auth/auth-context";
import { RoleProvider, useRole } from "./role-context";
import { SpaceThemeProvider } from "./space-theme";
import { TourProvider } from "./DashboardTour";
import { getDashboardGroups, isRepOnlyPath } from "./nav-config";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { RepOnlyNotice } from "./RepOnlyNotice";
import { CommandPalette } from "./CommandPalette";

/** Shown across the dashboard while a rep application is under admin review. */
function PendingRepBanner() {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-500/15 text-amber-700">
        <HugeiconsIcon icon={Clock01Icon} size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">Your rep application is under review</p>
        <p className="mt-0.5 text-xs text-ink-soft">
          You&apos;re signed in as a student for now. We&apos;ll email you once an admin
          approves your department — then your rep tools unlock. Some actions are paused
          until then.
        </p>
      </div>
    </div>
  );
}

/** Shown across the dashboard until the account's email address is confirmed. */
function VerifyEmailBanner() {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-500/15 text-amber-700">
        <HugeiconsIcon icon={MailAtSign01Icon} size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">Verify your email address</p>
        <p className="mt-0.5 text-xs text-ink-soft">
          We sent a confirmation link to your inbox when you signed up. Open it to verify your
          account — some actions may be limited until then.
        </p>
      </div>
    </div>
  );
}

function ShellInner({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { role, isRep, isPendingRep } = useRole();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Students who reach a rep-only route by URL get a graceful notice, not the tool.
  const blocked = !isRep && isRepOnlyPath(pathname);

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar
        groups={getDashboardGroups(isRep)}
        subtitle={role === "rep" ? "Rep dashboard" : "Student dashboard"}
        open={open}
        onClose={() => setOpen(false)}
      />

      <div className="flex min-h-screen flex-col lg:pl-72">
        <Topbar onMenu={() => setOpen(true)} onSearch={() => setSearchOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {isPendingRep && <PendingRepBanner />}
          {!isPendingRep && user && !user.emailVerified && <VerifyEmailBanner />}
          {blocked ? <RepOnlyNotice /> : children}
        </main>
      </div>

      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} isRep={isRep} />
    </div>
  );
}

export default function DashboardShell({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      const next = pathname + (typeof window === "undefined" ? "" : window.location.search);
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    } else if (status === "authenticated" && user?.role === "admin") {
      router.replace("/admin");
    }
  }, [status, user, router, pathname]);

  if (status !== "authenticated" || !user || user.role === "admin") {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cloud border-t-brand" />
      </div>
    );
  }

  return (
    <RoleProvider
      initialRole={user.role === "rep" ? "rep" : "student"}
      isPendingRep={user.repApplicationStatus === "pending"}
    >
      <SpaceThemeProvider>
        <TourProvider>
          <ShellInner>{children}</ShellInner>
        </TourProvider>
      </SpaceThemeProvider>
    </RoleProvider>
  );
}
