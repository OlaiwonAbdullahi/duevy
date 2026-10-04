"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { KycCard } from "@/app/(dashboards)/dashboard/kyc/_components/KycCard";

/**
 * Shown straight after a rep applicant signs in: verify NIN + student ID, then
 * on to the dashboard (where a banner tracks the review). Skippable — the
 * dashboard keeps prompting until it's done.
 */
export default function OnboardingKycPage() {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?next=${encodeURIComponent("/onboarding/kyc")}`);
    } else if (status === "authenticated" && user && user.repApplicationStatus !== "pending") {
      // Only rep applicants onboard here; everyone else belongs on the dashboard.
      router.replace(user.role === "admin" ? "/admin" : "/dashboard");
    }
  }, [status, user, router]);

  if (status !== "authenticated" || !user || user.repApplicationStatus !== "pending") {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cloud border-t-brand" />
      </div>
    );
  }

  const goToDashboard = () => router.push("/dashboard");

  return (
    <div className="min-h-screen bg-[#fbfaf7]">
      <header className="flex items-center justify-between px-6 pt-6 sm:px-10">
        <Link href="/" className="flex items-center gap-2 text-xl tracking-tight text-[#1b2520]">
          <Image src="/icons/logo2.svg" alt="" width={25} height={32} className="h-6 w-auto" />
          Duevy.
        </Link>
        <button
          type="button"
          onClick={goToDashboard}
          className="text-[13px] font-medium text-[#7a847f] transition-colors hover:text-[#1b2520] cursor-pointer"
        >
          I&apos;ll do this later
        </button>
      </header>

      <main className="mx-auto max-w-xl px-6 py-10 sm:py-14">
        <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#0b6e4f]">
          Rep application · Step 2 of 3
        </p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-[#1b2520]">
          Hi {user.name.split(" ")[0]}, let&apos;s verify you
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-[#7a847f]">
          We need your NIN and student ID before an admin can approve your department. It takes
          about two minutes.
        </p>

        <div className="mt-8">
          {/* Applicants have no space yet, so this uses /me/kyc*. Submitting moves them on. */}
          <KycCard isLead onChanged={goToDashboard} />
        </div>
      </main>
    </div>
  );
}
