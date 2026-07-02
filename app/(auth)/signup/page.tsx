import type { Metadata } from "next";
import Link from "next/link";
import AuthField from "../components/AuthField";
import { GoogleIcon, ArrowRightIcon } from "../../components/icons";

export const metadata: Metadata = {
  title: "Create account",
  description:
    "Create a Duevy account to collect dues, run approved payouts, and track every kobo.",
};

export default function SignupPage() {
  return (
    <div className="flex flex-col">
      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-[#1b2520] font-semibold tracking-tight text-3xl leading-tight mb-2">
          Create your account
        </h1>
        <p className="text-[#7a847f] text-[15px] leading-relaxed">
          Set up your department in minutes — collecting is free to start.
        </p>
      </div>

      {/* Social */}
      <button
        type="button"
        className="inline-flex h-13 w-full items-center justify-center gap-3 rounded-full border border-[#e6f2ec] bg-[#f4f2ec] text-[#1b2520] text-[15px] font-semibold transition-colors duration-300 hover:bg-[#e6f2ec] cursor-pointer"
      >
        <GoogleIcon size={18} />
        Sign up with Google
      </button>

      {/* Divider */}
      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-[#e6f2ec]" />
        <span className="text-[#7a847f] text-[12px] font-medium uppercase tracking-[0.14em]">
          or
        </span>
        <span className="h-px flex-1 bg-[#e6f2ec]" />
      </div>

      {/* Form */}
      <form className="flex flex-col gap-5">
        <AuthField
          id="name"
          label="Full name"
          icon="user"
          type="text"
          name="name"
          autoComplete="name"
          placeholder="e.g. Ada Okeke"
          required
        />

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

        <AuthField
          id="password"
          label="Password"
          icon="lock"
          type="password"
          name="password"
          autoComplete="new-password"
          placeholder="Create a password"
          minLength={8}
          required
          hint="Use at least 8 characters."
        />

        <label className="flex items-start gap-3 text-[#7a847f] text-[13px] leading-relaxed cursor-pointer">
          <input
            type="checkbox"
            name="terms"
            required
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#e6f2ec] accent-[#0b6e4f] cursor-pointer"
          />
          <span>
            I agree to Duevy&apos;s{" "}
            <Link
              href="/terms"
              className="text-[#0b6e4f] font-medium hover:text-[#08583f] transition-colors duration-300 cursor-pointer"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="text-[#0b6e4f] font-medium hover:text-[#08583f] transition-colors duration-300 cursor-pointer"
            >
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        <button
          type="submit"
          className="group mt-1 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#0b6e4f] text-white text-[15px] font-semibold transition-colors duration-300 hover:bg-[#0f996d] cursor-pointer"
        >
          Create account
          <ArrowRightIcon
            size={16}
            className="transition-transform duration-500 group-hover:translate-x-1"
          />
        </button>
      </form>

      {/* Footer */}
      <p className="mt-8 text-center text-[#7a847f] text-[14px]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-[#0b6e4f] font-semibold hover:text-[#08583f] transition-colors duration-300 cursor-pointer"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
