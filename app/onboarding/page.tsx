"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { getKycStatus } from "@/lib/api/payouts";
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
  const [checked, setChecked] = useState(false);
  const applicant = isRepApplicant(user);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?next=${encodeURIComponent(ONBOARDING_PATH)}`);
    } else if (status === "authenticated" && user && !applicant) {
      // Only rep applicants onboard here; everyone else belongs on the dashboard.
      router.replace(user.role === "admin" ? "/admin" : "/dashboard");
    }
  }, [status, user, applicant, router]);

  // Already submitted everything (e.g. came back via a bookmark) — straight through.
  useEffect(() => {
    if (status !== "authenticated" || !applicant) return;
    let cancelled = false;
    getKycStatus()
      .then((s) => {
        if (cancelled) return;
        if (kycOutstanding(s.mine)) setChecked(true);
        else router.replace("/dashboard");
      })
      .catch(() => !cancelled && setChecked(true));
    return () => {
      cancelled = true;
    };
  }, [status, applicant, router]);

  if (status !== "authenticated" || !user || !applicant || !checked) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cloud border-t-brand" />
      </div>
    );
  }

  // Move on only once nothing is left for the applicant to do.
  const handleChanged = async () => {
    try {
      if (!kycOutstanding((await getKycStatus()).mine)) router.push("/dashboard");
    } catch {
      // The card already shows what was submitted; they can refresh to retry.
    }
  };

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
          <KycCard isLead onChanged={handleChanged} />
        </div>
      </main>
    </div>
  );
}
