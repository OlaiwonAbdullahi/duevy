import type { Metadata } from "next";
import Link from "next/link";
import AuthField from "../components/AuthField";
import { ArrowRightIcon } from "../../components/icons";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Reset the password for your Duevy account.",
};

export default function ForgotPasswordPage() {
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
      <form className="flex flex-col gap-5">
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
          className="group mt-1 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#0b6e4f] text-white text-[15px] font-semibold transition-colors duration-300 hover:bg-[#0f996d] cursor-pointer"
        >
          Send reset link
          <ArrowRightIcon
            size={16}
            className="transition-transform duration-500 group-hover:translate-x-1"
          />
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
