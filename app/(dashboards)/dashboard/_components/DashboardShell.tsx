"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Clock01Icon, MailAtSign01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { OverviewSkeleton, ShellSkeleton } from "./Skeleton";
import { useKycStatus } from "@/lib/api/queries";
import { ONBOARDING_PATH, isRepApplicant, kycOutstanding } from "@/lib/auth/onboarding";
import { RoleProvider, useRole } from "./role-context";
import { SpaceThemeProvider } from "./space-theme";
import { TourProvider } from "./DashboardTour";
import { getDashboardGroups, isRepOnlyPath, isFeatureGatedPath } from "./nav-config";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import BottomNav from "./BottomNav";
import MoreSheet from "./MoreSheet";
import { RepOnlyNotice } from "./RepOnlyNotice";
import { FeatureUnavailableNotice } from "./FeatureUnavailableNotice";

// Split out of the shell bundle; it mounts after hydration to listen for ⌘K.
const CommandPalette = dynamic(() => import("./CommandPalette").then((mod) => mod.CommandPalette), { ssr: false });

/**
 * Shown across the dashboard while a rep application is open. KYC comes first
 * (NIN via Bachs + student ID), then an admin gives final approval.
 */
function PendingRepBanner() {
  const pathname = usePathname();
  // Shared with the onboarding gate below and the KYC page, so it's one request.
  const kyc = useKycStatus().data?.mine ?? null;

  const notStarted = !!kyc && kycOutstanding(kyc);
  const kycPassed = !!kyc && kyc.kycStatus === "verified" && kyc.studentId.status !== null;

  const title = !kyc
    ? "Your rep application is under review"
    : notStarted
      ? "Complete verification to continue your application"
      : kycPassed
        ? "Your application is with an admin for final approval"
        : "Your verification is pending";
  const body = notStarted
    ? kyc?.kycStatus === "rejected"
      ? "Your NIN couldn't be verified. Check your details and try again."
      : kyc?.studentId.status === "rejected"
        ? "Your student ID wasn't accepted. Upload a clearer photo."
        : kyc?.providerReference && kyc.studentId.status !== null
          ? "Add a payout bank account in your name so an admin can approve your department."
          : "Verify your NIN, upload your student ID and add a payout account so an admin can approve your department."
    : kycPassed
      ? "Your identity is verified. We'll email you once your department is approved — then your rep tools unlock."
      : "We're checking your NIN and student ID. You can use Duevy as a student in the meantime; we'll email you once you're approved.";

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:flex-row sm:items-center">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber-500/15 text-amber-700">
        <HugeiconsIcon icon={Clock01Icon} size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-xs text-ink-soft">{body}</p>
      </div>
      {notStarted && pathname !== "/dashboard/kyc" && (
        <Link
          href="/dashboard/kyc"
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-brand px-4 text-xs font-semibold text-white transition-colors duration-300 hover:bg-brand-bright"
        >
          Complete verification
        </Link>
      )}
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
  const [moreOpen, setMoreOpen] = useState(false);

  // Students who reach a rep-only route by URL get a graceful notice, not the tool.
  // Rep applicants still need the KYC page — it's part of their application.
  const repBlocked =
    !isRep && isRepOnlyPath(pathname) && !(isPendingRep && pathname.startsWith("/dashboard/kyc"));
  // Anyone who reaches a pilot-cut route by URL gets the same treatment.
  const featureBlocked = isFeatureGatedPath(pathname);

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar
        groups={getDashboardGroups(isRep)}
        subtitle={role === "rep" ? "Rep dashboard" : "Student dashboard"}
        open={open}
        onClose={() => setOpen(false)}
      />

      <div className="flex min-h-screen flex-col lg:pl-72">
        <Topbar onSearch={() => setSearchOpen(true)} />
        {/* Bottom padding clears the mobile tab bar (and the home indicator). */}
        <main className="flex-1 p-4 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:p-6 sm:pb-[calc(7rem+env(safe-area-inset-bottom))] lg:p-8">
          {isPendingRep && <PendingRepBanner />}
          {!isPendingRep && user && !user.emailVerified && <VerifyEmailBanner />}
          {featureBlocked ? (
            <FeatureUnavailableNotice />
          ) : repBlocked ? (
            <RepOnlyNotice />
          ) : (
            children
          )}
        </main>
      </div>

      <BottomNav isRep={isRep} onMore={() => setMoreOpen(true)} />
      {/* Students already have every page in the tab bar (Settings via the
          sheet's Profile button), so their sheet is account actions only. */}
      <MoreSheet open={moreOpen} onOpenChange={setMoreOpen} groups={isRep ? getDashboardGroups(true) : []} />

      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} isRep={isRep} />
    </div>
  );
}

export default function DashboardShell({ children }: { children: ReactNode }) {
  const { user, status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const applicant = isRepApplicant(user);
  // Rep applicants finish onboarding (KYC) before they see the dashboard.
  const kycQuery = useKycStatus(undefined, { enabled: status === "authenticated" && applicant });
  const outstanding = kycQuery.data ? kycOutstanding(kycQuery.data.mine) : null;
  // Don't lock them out of the dashboard over a failed status check.
  const onboarded = kycQuery.isError || outstanding === false;

  useEffect(() => {
    if (status === "unauthenticated") {
      const next = pathname + (typeof window === "undefined" ? "" : window.location.search);
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    } else if (status === "authenticated" && user?.role === "admin") {
      router.replace("/admin");
    }
  }, [status, user, router, pathname]);

  useEffect(() => {
    if (applicant && outstanding) router.replace(ONBOARDING_PATH);
  }, [applicant, outstanding, router]);

  if (status !== "authenticated" || !user || user.role === "admin" || (applicant && !onboarded)) {
    return (
      <ShellSkeleton>{pathname === "/dashboard" ? <OverviewSkeleton /> : undefined}</ShellSkeleton>
    );
  }

  // Rep is a permission on the student account (`isRep`); co-reps keep
  // `role: "student"` and are only visible through a `rep` space membership.
  const isRepUser =
    user.isRep ||
    user.role === "rep" ||
    (user.spaces ?? []).some((s) => s.membership === "rep");

  return (
    <RoleProvider
      initialRole={isRepUser ? "rep" : "student"}
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
