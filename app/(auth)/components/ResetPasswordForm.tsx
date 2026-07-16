"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon } from "@hugeicons/core-free-icons";
import { resetPassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/errors";
import AuthField from "./AuthField";
import { ArrowRightIcon, CheckIcon } from "../../components/icons";

export default function ResetPasswordForm({ token }: { token: string | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;

    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    const confirmPassword = String(data.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ token, password });
      setDone(true);
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

  if (!token) {
    return (
      <div className="flex flex-col text-center">
        <span className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-[#fdeceb] text-[#c0362c]">
          <HugeiconsIcon icon={Alert01Icon} size={26} />
        </span>

        <h1 className="text-[#1b2520] font-semibold tracking-tight text-3xl leading-tight mb-2">
          Invalid reset link
        </h1>
        <p className="text-[#7a847f] text-[15px] leading-relaxed mb-8">
          This password reset link is missing or malformed. Request a new one to
          continue.
        </p>

        <Link
          href="/forgot-password"
          className="group mt-1 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#0b6e4f] text-white text-[15px] font-semibold transition-colors duration-300 hover:bg-[#0f996d] cursor-pointer"
        >
          Request a new link
          <ArrowRightIcon
            size={16}
            className="transition-transform duration-500 group-hover:translate-x-1"
          />
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col text-center">
        <span className="mx-auto mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-[#e6f2ec] text-[#0b6e4f]">
          <CheckIcon size={22} />
        </span>

        <h1 className="text-[#1b2520] font-semibold tracking-tight text-3xl leading-tight mb-2">
          Password updated
        </h1>
        <p className="text-[#7a847f] text-[15px] leading-relaxed mb-8">
          Your password has been reset. Sign in with your new password to
          continue.
        </p>

        <button
          type="button"
          onClick={() => router.push("/login")}
          className="group mt-1 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#0b6e4f] text-white text-[15px] font-semibold transition-colors duration-300 hover:bg-[#0f996d] cursor-pointer"
        >
          Back to sign in
          <ArrowRightIcon
            size={16}
            className="transition-transform duration-500 group-hover:translate-x-1"
          />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="mb-8">
        <h1 className="text-[#1b2520] font-semibold tracking-tight text-3xl leading-tight mb-2">
          Set a new password
        </h1>
        <p className="text-[#7a847f] text-[15px] leading-relaxed">
          Choose a new password for your account.
        </p>
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <AuthField
          id="password"
          label="New password"
          icon="lock"
          type="password"
          name="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          minLength={8}
          required
        />

        <AuthField
          id="confirmPassword"
          label="Confirm new password"
          icon="lock"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Re-enter your new password"
          minLength={8}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="group mt-1 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#0b6e4f] text-white text-[15px] font-semibold transition-colors duration-300 hover:bg-[#0f996d] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          {loading ? "Updating…" : "Update password"}
          {!loading && (
            <ArrowRightIcon
              size={16}
              className="transition-transform duration-500 group-hover:translate-x-1"
            />
          )}
        </button>
      </form>

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
