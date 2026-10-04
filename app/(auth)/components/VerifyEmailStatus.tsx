"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon } from "@hugeicons/core-free-icons";
import { verifyEmail } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import { useAuth } from "@/lib/auth/auth-context";
import { readPostAuthNext, clearPostAuthNext } from "@/lib/auth/post-auth-next";
import { ONBOARDING_PATH, isRepApplicant } from "@/lib/auth/onboarding";
import { ArrowRightIcon, CheckIcon } from "../../components/icons";

type State = "verifying" | "success" | "error";

export default function VerifyEmailStatus({ token }: { token: string | null }) {
  const { user, status, refreshUser } = useAuth();
  const router = useRouter();
  const [state, setState] = useState<State>(token ? "verifying" : "error");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const ran = useRef(false);
  // Carries `next` across the verify-email hop, which can happen in a
  // different tab/device than the one that started signup.
  const [persistedNext] = useState(() => readPostAuthNext());
  const authenticated = status === "authenticated";
  // Rep applicants onboard (KYC) before the dashboard. Signed-out applicants get
  // there via the login form, which routes them the same way.
  const onboarding = authenticated && isRepApplicant(user);
  const continueHref = onboarding
    ? ONBOARDING_PATH
    : authenticated
    ? (persistedNext ?? "/dashboard")
    : persistedNext
      ? `/login?next=${encodeURIComponent(persistedNext)}`
      : "/login";

  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true;

    (async () => {
      try {
        await verifyEmail(token);
        if (status === "authenticated") await refreshUser();
        setState("success");
      } catch (err) {
        setErrorMessage(
          err instanceof ApiError
            ? err.message
            : "Couldn't reach the server. Check your connection and try again.",
        );
        setState("error");
      }
    })();
  }, [token, status, refreshUser]);

  // Straight into onboarding once the email is confirmed.
  useEffect(() => {
    if (state !== "success" || !onboarding) return;
    clearPostAuthNext();
    const t = setTimeout(() => router.replace(ONBOARDING_PATH), 1200);
    return () => clearTimeout(t);
  }, [state, onboarding, router]);

  if (state === "verifying") {
    return (
      <div className="flex flex-col items-center text-center">
        <span className="mx-auto mb-6 h-14 w-14 animate-pulse rounded-2xl bg-[#e6f2ec]" />
        <h1 className="text-[#1b2520] font-semibold tracking-tight text-3xl leading-tight mb-2">
          Verifying your email
        </h1>
        <p className="text-[#7a847f] text-[15px] leading-relaxed">
          Hang tight, this only takes a moment.
        </p>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="flex flex-col text-center">
        <span className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-[#e6f2ec] text-[#0b6e4f]">
          <CheckIcon size={22} />
        </span>

        <h1 className="text-[#1b2520] font-semibold tracking-tight text-3xl leading-tight mb-2">
          Email verified
        </h1>
        <p className="text-[#7a847f] text-[15px] leading-relaxed mb-8">
          {onboarding
            ? "Your email address has been confirmed. Taking you to onboarding…"
            : "Your email address has been confirmed."}
        </p>

        <Link
          href={continueHref}
          onClick={() => authenticated && clearPostAuthNext()}
          className="group mt-1 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#0b6e4f] text-white text-[15px] font-semibold transition-colors duration-300 hover:bg-[#0f996d] cursor-pointer"
        >
          {onboarding ? "Continue to onboarding" : authenticated ? "Go to dashboard" : "Sign in"}
          <ArrowRightIcon
            size={16}
            className="transition-transform duration-500 group-hover:translate-x-1"
          />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col text-center">
      <span className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-[#fdeceb] text-[#c0362c]">
        <HugeiconsIcon icon={Alert01Icon} size={26} />
      </span>

      <h1 className="text-[#1b2520] font-semibold tracking-tight text-3xl leading-tight mb-2">
        Verification failed
      </h1>
      <p className="text-[#7a847f] text-[15px] leading-relaxed mb-8">
        {errorMessage ??
          "This verification link is invalid or has expired. Request a new one from your account settings."}
      </p>

      <Link
        href={continueHref}
        onClick={() => authenticated && clearPostAuthNext()}
        className="group mt-1 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#0b6e4f] text-white text-[15px] font-semibold transition-colors duration-300 hover:bg-[#0f996d] cursor-pointer"
      >
        {authenticated ? "Back to dashboard" : "Back to sign in"}
        <ArrowRightIcon
          size={16}
          className="transition-transform duration-500 group-hover:translate-x-1"
        />
      </Link>
    </div>
  );
}
