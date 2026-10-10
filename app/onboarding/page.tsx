"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useKycStatus } from "@/lib/api/queries";
import { ONBOARDING_PATH, isRepApplicant, kycOutstanding } from "@/lib/auth/onboarding";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon, Logout01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { KycCard } from "@/app/(dashboards)/dashboard/kyc/_components/KycCard";

/**
 * Where a rep applicant lands once their email is verified: verify NIN +
 * student ID and add a payout account before anything else. Not skippable — the dashboard sends them
 * back here until all three are submitted.
 */
export default function OnboardingPage() {
  const { user, status, logout } = useAuth();
  const router = useRouter();
  const applicant = isRepApplicant(user);
  const kycQuery = useKycStatus(undefined, { enabled: status === "authenticated" && applicant });
  const outstanding = kycQuery.data ? kycOutstanding(kycQuery.data.mine) : null;
  // A failed check still shows the form rather than a dead end.
  const checked = outstanding === true || kycQuery.isError;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?next=${encodeURIComponent(ONBOARDING_PATH)}`);
    } else if (status === "authenticated" && user && !applicant) {
      // Only rep applicants onboard here; everyone else belongs on the dashboard.
      router.replace(user.role === "admin" ? "/admin" : "/dashboard");
    }
  }, [status, user, applicant, router]);

  // Nothing left to submit — either they came back via a bookmark, or KycCard
  // just wrote the final step's state into the shared cache. Straight through.
  useEffect(() => {
    if (applicant && outstanding === false) router.replace("/dashboard");
  }, [applicant, outstanding, router]);

  if (status !== "authenticated" || !user || !applicant || !checked) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cloud border-t-brand" />
      </div>
    );
  }

  const signOut = async () => {
    await logout();
    router.replace("/login");
  };

  const steps = [
    { label: "Account", state: "done" as const },
    { label: "Verify", state: "current" as const },
    { label: "Approval", state: "next" as const },
  ];

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-cloud bg-canvas/85 px-4 backdrop-blur-md sm:h-16 sm:border-0 sm:bg-transparent sm:px-10 sm:backdrop-blur-none">
        <Link href="/" className="flex items-center gap-2 text-lg tracking-tight text-ink sm:text-xl">
          <Image src="/logos/duevy-mark.svg" alt="" width={28} height={28} className="h-6 w-auto" />
          Duevy.
        </Link>
        <button
          type="button"
          onClick={signOut}
          className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-ink-soft transition-colors hover:bg-paper hover:text-ink cursor-pointer"
        >
          <HugeiconsIcon icon={Logout01Icon} size={15} />
          Sign out
        </button>
      </header>

      <main className="mx-auto max-w-xl px-4 pb-[calc(2.5rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:py-14">
        {/* Intro on the doodle artwork, with where they are in the flow. */}
        <section className="doodle-card relative overflow-hidden rounded-[28px] p-5 text-white  sm:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/75">
            Step 2 of 3
          </p>
          <h1 className="mt-2 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
            Hi {user.name.split(" ")[0]}, let&apos;s verify you
          </h1>
          <p className="mt-2 text-[13px] leading-relaxed text-white/80 sm:text-sm">
            Your NIN, student ID and a payout account in your name. It takes about three minutes,
            then an admin approves your department.
          </p>

          <ol className="mt-5 grid grid-cols-3 gap-2">
            {steps.map((step, i) => (
              <li key={step.label}>
                <div
                  className={cn(
                    "h-1.5 rounded-full",
                    step.state === "done" ? "bg-white" : step.state === "current" ? "bg-white/70" : "bg-white/20",
                  )}
                />
                <p
                  className={cn(
                    "mt-2 flex items-center gap-1 text-[11px] font-semibold",
                    step.state === "next" ? "text-white/55" : "text-white",
                  )}
                >
                  {step.state === "done" ? (
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} />
                  ) : (
                    <span className="tabular-nums">{i + 1}.</span>
                  )}
                  {step.label}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-5 sm:mt-8">
          {/* Applicants have no space yet, so this uses /me/kyc*. */}
          <KycCard isLead />
        </div>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-ink-soft">
          Your details go straight to our payment partner for checks. Need help?{" "}
          <a href="mailto:support@duevy.app" className="font-semibold text-brand">
            support@duevy.app
          </a>
        </p>
      </main>
    </div>
  );
}
