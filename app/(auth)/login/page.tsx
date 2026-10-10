import type { Metadata } from "next";
import Link from "next/link";
import AuthField from "../components/AuthField";
import { GoogleIcon, ArrowRightIcon } from "../../components/icons";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to your Duevy account to collect dues and track payments.",
};

export default function LoginPage() {
  return (
    <div className="flex flex-col">
      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-[#1b2520] font-semibold tracking-tight text-3xl leading-tight mb-2">
          Welcome back
        </h1>
        <p className="text-[#7a847f] text-[15px] leading-relaxed">
          Sign in to keep your department&apos;s money moving cleanly.
        </p>
      </div>

      {/* Social */}
      <button
        type="button"
        className="inline-flex h-[52px] w-full items-center justify-center gap-3 rounded-full border border-[#e6f2ec] bg-[#f4f2ec] text-[#1b2520] text-[15px] font-semibold transition-colors duration-300 hover:bg-[#e6f2ec] cursor-pointer"
      >
        <GoogleIcon size={18} />
        Continue with Google
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
          autoComplete="current-password"
          placeholder="Enter your password"
          required
          labelAccessory={
            <Link
              href="/forgot-password"
              className="text-[#0b6e4f] text-[13px] font-medium hover:text-[#08583f] transition-colors duration-300 cursor-pointer"
            >
              Forgot password?
            </Link>
          }
        />

        <button
          type="submit"
          className="group mt-1 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#0b6e4f] text-white text-[15px] font-semibold transition-colors duration-300 hover:bg-[#0f996d] cursor-pointer"
        >
          Sign in
          <ArrowRightIcon
            size={16}
            className="transition-transform duration-500 group-hover:translate-x-1"
          />
        </button>
      </form>

      {/* Footer */}
      <p className="mt-8 text-center text-[#7a847f] text-[14px]">
        New to Duevy?{" "}
        <Link
          href="/signup"
          className="text-[#0b6e4f] font-semibold hover:text-[#08583f] transition-colors duration-300 cursor-pointer"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
