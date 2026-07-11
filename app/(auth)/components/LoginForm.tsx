"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/api/errors";
import AuthField from "./AuthField";
import { ArrowRightIcon } from "../../components/icons";

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");

    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success("Welcome back", {
        description: `Signed in as ${user.name.split(" ")[0]}.`,
      });
      router.push(user.role === "admin" ? "/admin" : "/dashboard");
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
          disabled={loading}
          className="group mt-1 inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#0b6e4f] text-white text-[15px] font-semibold transition-colors duration-300 hover:bg-[#0f996d] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          {loading ? "Signing in…" : "Sign in"}
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
