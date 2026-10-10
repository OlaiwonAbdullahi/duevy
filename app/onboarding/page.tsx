"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useKycStatus } from "@/lib/api/queries";
import { ONBOARDING_PATH, isRepApplicant, kycOutstanding } from "@/lib/auth/onboarding";
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

  return (
    <div className="min-h-screen bg-[#fbfaf7]">
      <header className="flex items-center justify-between px-6 pt-6 sm:px-10">
        <Link href="/" className="flex items-center gap-2 text-xl tracking-tight text-[#1b2520]">
          <Image src="/icons/logo2.svg" alt="" width={25} height={32} className="h-6 w-auto" />
          Duevy.
        </Link>
        <button
          type="button"
          onClick={signOut}
          className="text-[13px] font-medium text-[#7a847f] transition-colors hover:text-[#1b2520] cursor-pointer"
        >
          Sign out
        </button>
      </header>

      <main className="mx-auto max-w-xl px-6 py-10 sm:py-14">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0b6e4f]">
          Onboarding · Step 2 of 3
        </p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-[#1b2520]">
          Hi {user.name.split(" ")[0]}, let&apos;s verify you
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[#7a847f]">
          We need your NIN, student ID and a payout bank account in your name before you can use
          your dashboard and an admin can approve your department. It takes about three minutes.
        </p>

        <div className="mt-8">
          {/* Applicants have no space yet, so this uses /me/kyc*. */}
          <KycCard isLead />
        </div>
      </main>
    </div>
  );
}
