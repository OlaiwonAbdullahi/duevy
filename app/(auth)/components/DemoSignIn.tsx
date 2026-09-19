"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Loading03Icon,
  MortarboardIcon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import { useAuth } from "@/lib/auth/auth-context";
import { DEMO_ACCOUNTS, DEMO_MODE, DEMO_PASSWORD, type DemoRole } from "@/lib/demo/config";
import { resetDemo } from "@/lib/demo/store";

const ICONS: Record<DemoRole, typeof MortarboardIcon> = {
  student: MortarboardIcon,
  rep: UserMultipleIcon,
};

/**
 * One-tap sign-in for the two demo accounts. Goes through the same
 * `login()` the form uses, so the session, role cookie and post-login redirect
 * all behave exactly as they would for a real account — the only difference is
 * where the data comes from.
 */
export default function DemoSignIn({
  label = "Or explore the demo",
}: {
  /** The divider copy — signup reads better as "skip ahead" than "explore". */
  label?: string;
}) {
  const router = useRouter();
  const { login } = useAuth();
  const [busy, setBusy] = useState<DemoRole | null>(null);

  if (!DEMO_MODE) return null;

  const signIn = async (role: DemoRole) => {
    setBusy(role);
    try {
      const user = await login(DEMO_ACCOUNTS[role].email, DEMO_PASSWORD);
      toast.success(`Signed in as ${user.name.split(" ")[0]}`, {
        description:
          role === "rep"
            ? "You're the lead rep for CSSA — raise dues, chase collections, withdraw."
            : "You're a CSSA member — settle your dues and keep your receipts.",
      });
      router.push("/dashboard");
    } catch {
      toast.error("Couldn't start the demo session. Try again.");
      setBusy(null);
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-[#e6e9e8]" />
        <span className="text-[12px] font-medium uppercase tracking-wider text-[#9aa4a0]">
          {label}
        </span>
        <span className="h-px flex-1 bg-[#e6e9e8]" />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {(["student", "rep"] as const).map((role) => {
          const account = DEMO_ACCOUNTS[role];
          const loading = busy === role;
          return (
            <button
              key={role}
              type="button"
              onClick={() => signIn(role)}
              disabled={busy !== null}
              className="group flex items-center gap-3 rounded-2xl border border-[#e6e9e8] bg-white p-4 text-left transition-all duration-300 hover:border-[#0b6e4f]/40 hover:bg-[#f7faf9] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0b6e4f]/8 text-[#0b6e4f]">
                <HugeiconsIcon
                  icon={loading ? Loading03Icon : ICONS[role]}
                  size={18}
                  className={loading ? "animate-spin" : undefined}
                />
              </span>
              <span className="min-w-0">
                <span className="block text-[14px] font-semibold text-[#1b2520]">
                  {account.label}
                </span>
                <span className="block truncate text-[12px] text-[#7a847f]">{account.blurb}</span>
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-center text-[12px] leading-5 text-[#9aa4a0]">
        Both accounts share one department, so what one does the other sees.{" "}
        <button
          type="button"
          onClick={() => {
            resetDemo();
            toast.success("Demo data reset", {
              description: "Every account is back to its starting state.",
            });
          }}
          className="font-medium text-[#0b6e4f] underline-offset-2 hover:underline cursor-pointer"
        >
          Reset demo data
        </button>
      </p>
    </div>
  );
}
