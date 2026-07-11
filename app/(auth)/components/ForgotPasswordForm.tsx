"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { MailSend01Icon } from "@hugeicons/core-free-icons";
import { forgotPassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import AuthField from "./AuthField";
import { ArrowRightIcon } from "../../components/icons";

export default function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();

    setLoading(true);
    try {
      await forgotPassword(email);
      setSentTo(email);
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Couldn't reach the server. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (sentTo) {
    return (
      <div className="flex flex-col text-center">
        <span className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-[#e6f2ec] text-[#0b6e4f]">
          <HugeiconsIcon icon={MailSend01Icon} size={26} />
        </span>

        <h1 className="text-[#1b2520] font-semibold tracking-tight text-3xl leading-tight mb-2">
          Check your inbox
        </h1>
        <p className="text-[#7a847f] text-[15px] leading-relaxed mb-8">
          If an account exists for <span className="font-medium text-[#1b2520]">{sentTo}</span>,
          we&apos;ve sent a link to reset the password. It expires shortly, so use it soon.
        </p>

        <p className="text-center text-[#7a847f] text-[14px]">
          <Link
            href="/login"
            className="text-[#0b6e4f] font-semibold hover:text-[#08583f] transition-colors duration-300 cursor-pointer"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-[#1b2520] font-semibold tracking-tight text-3xl leading-tight mb-2">
          Reset your password
        </h1>
        <p className="text-[#7a847f] text-[15px] leading-relaxed">
          Enter the email on your account and we&apos;ll send you a link to set
          a new password.
        </p>
      </div>

      {/* Form */}
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <AuthField
          id="email"
          label="Email address"
          icon="mail"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@school.edu.ng"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="group mt-1 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#0b6e4f] text-white text-[15px] font-semibold transition-colors duration-300 hover:bg-[#0f996d] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          {loading ? "Sending…" : "Send reset link"}
          {!loading && (
            <ArrowRightIcon
              size={16}
              className="transition-transform duration-500 group-hover:translate-x-1"
            />
          )}
        </button>
      </form>

      {/* Footer */}
      <p className="mt-8 text-center text-[#7a847f] text-[14px]">
        Remembered it?{" "}
        <Link
          href="/login"
          className="text-[#0b6e4f] font-semibold hover:text-[#08583f] transition-colors duration-300 cursor-pointer"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
