"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { MailAtSign01Icon } from "@hugeicons/core-free-icons";
import { resendVerification } from "@/lib/api/auth";

/** Rep applicants see what comes after the email link. */
const REP_NEXT_STEPS = [
  "Open the link in your email to verify your address.",
  "Sign in and complete verification (your NIN and student ID).",
  "We review your application — you'll get an email once you're approved.",
];

/** Shown right after signup — the account exists but still needs email confirmation. */
export function CheckEmailNotice({
  email,
  loginHref = "/login",
  isRep = false,
}: {
  email: string;
  loginHref?: string;
  isRep?: boolean;
}) {
  const [resending, setResending] = useState(false);

  const resend = async () => {
    setResending(true);
    try {
      await resendVerification(email);
      toast.success("Verification email sent", { description: `Check ${email}.` });
    } catch {
      toast.error("Couldn't resend the email. Please try again in a moment.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex flex-col text-center">
      <span className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-[#e6f2ec] text-[#0b6e4f]">
        <HugeiconsIcon icon={MailAtSign01Icon} size={26} />
      </span>

      <h1 className="text-[#1b2520] font-semibold tracking-tight text-3xl leading-tight mb-2">
        {isRep ? "Your account has been created" : "Check your email"}
      </h1>
      <p className="text-[#7a847f] text-[15px] leading-relaxed mb-8">
        We sent a verification link to{" "}
        <span className="font-semibold text-[#1b2520]">{email}</span>. Open it
        to confirm your address, then sign in to Duevy.
      </p>

      {isRep && (
        <ol className="mb-4 flex flex-col gap-3 rounded-2xl border border-[#e6f2ec] bg-white p-5 text-left">
          {REP_NEXT_STEPS.map((step, i) => (
            <li key={step} className="flex items-start gap-3 text-[13px] leading-relaxed text-[#1b2520]">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#e6f2ec] text-[11px] font-semibold text-[#0b6e4f]">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      )}

      <div className="rounded-2xl border border-[#e6f2ec] bg-[#fbfaf7] p-5 text-left">
        <p className="text-[#1b2520] text-[13px] font-semibold mb-3">
          Don&apos;t see it?
        </p>
        <ul className="flex flex-col gap-3">
          {[
            "Check your spam or promotions folder.",
            "Make sure you typed your email correctly when signing up.",
            "You can sign in once your email is verified.",
          ].map((item) => (
            <li
              key={item}
              className="flex items-start gap-3 text-[#7a847f] text-[13px] leading-relaxed"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0b6e4f]" />
              {item}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={resend}
          disabled={resending}
          className="mt-4 text-[13px] font-semibold text-[#0b6e4f] hover:text-[#08583f] transition-colors duration-300 cursor-pointer disabled:opacity-60"
        >
          {resending ? "Sending…" : "Resend verification email"}
        </button>
      </div>

      <p className="mt-8 text-center text-[#7a847f] text-[14px]">
        <Link
          href={loginHref}
          className="text-[#0b6e4f] font-semibold hover:text-[#08583f] transition-colors duration-300 cursor-pointer"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
