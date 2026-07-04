"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  GiftIcon,
  Copy01Icon,
  Tick02Icon,
  Share08Icon,
  UserAdd01Icon,
  AddTeamIcon,
  Coins01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import type { HugeIcon } from "../_components/nav-config";
import {
  REFERRAL_CODE,
  REWARD_PER_REFERRAL,
  referralLink,
  naira,
  REFERRALS,
  STATUS_META,
  summarizeReferrals,
  formatDate,
} from "./_components/data";
import { EmptyState } from "../_components/EmptyState";

function Stat({
  icon,
  label,
  value,
  tone,
}: {
  icon: HugeIcon;
  label: string;
  value: string;
  tone?: "brand";
}) {
  return (
    <div className="rounded-3xl border border-cloud bg-canvas p-5">
      <div className="mb-3 grid h-9 w-9 place-items-center rounded-full bg-cloud text-brand">
        <HugeiconsIcon icon={icon} size={18} />
      </div>
      <p className="text-xs font-medium text-ink-soft">{label}</p>
      <p
        className={`mt-1 text-xl font-semibold tracking-tight ${
          tone === "brand" ? "text-brand" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

const STEPS: { icon: HugeIcon; title: string; body: string }[] = [
  {
    icon: Share08Icon,
    title: "Share your link",
    body: "Send your code to coursemates and friends on other campuses.",
  },
  {
    icon: UserAdd01Icon,
    title: "They join Duevy",
    body: "They sign up with your link and set up their wallet.",
  },
  {
    icon: Coins01Icon,
    title: "You both earn",
    body: `You each get ${naira(REWARD_PER_REFERRAL)} once they pay their first due.`,
  },
];

export default function ReferralsPage() {
  const [copied, setCopied] = useState(false);
  const stats = summarizeReferrals();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Referral link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — long-press the code to copy it");
    }
  };

  const share = async () => {
    const data = {
      title: "Join me on Duevy",
      text: `Pay your campus dues the easy way. Use my code ${REFERRAL_CODE} and we both earn ${naira(
        REWARD_PER_REFERRAL,
      )}.`,
      url: referralLink,
    };
    // Native share sheet on mobile; fall back to copying the link elsewhere.
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(data);
      } catch {
        // user cancelled the share sheet — nothing to do
      }
    } else {
      await copy();
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">
          Refer &amp; earn
        </h1>
        <p className="mt-1 text-[13px] text-ink-soft">
          Invite friends to Duevy and earn together.
        </p>
      </header>

      {/* Hero — the invite card. */}
      <div className="relative mt-6 overflow-hidden rounded-3xl bg-brand p-6 sm:p-8">
        {/* Dotted texture fading from the top-right. */}
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.18) 1px, transparent 1.5px)",
            backgroundSize: "18px 18px",
            maskImage:
              "radial-gradient(130% 130% at 100% 0%, #000 0%, transparent 55%)",
            WebkitMaskImage:
              "radial-gradient(130% 130% at 100% 0%, #000 0%, transparent 55%)",
          }}
        />
        <div className="pointer-events-none absolute right-0 top-0 -translate-y-1/3 translate-x-1/3">
          <div className="relative h-72 w-72">
            <span className="absolute inset-0 rounded-full border border-white/15" />
            <span className="absolute inset-8 rounded-full border border-white/10" />
            <span className="absolute inset-16 rounded-full border border-white/[0.07]" />
          </div>
        </div>

        <div className="relative flex items-center gap-2 text-white/80">
          <HugeiconsIcon icon={GiftIcon} size={16} />
          <span className="text-xs font-medium">Referral rewards</span>
        </div>
        <p className="relative mt-3 max-w-md text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Give {naira(REWARD_PER_REFERRAL)}, get {naira(REWARD_PER_REFERRAL)}
        </p>
        <p className="relative mt-2 max-w-md text-sm text-white/80">
          Share your code. When a friend joins and pays their first due, you both
          earn {naira(REWARD_PER_REFERRAL)}.
        </p>

        {/* Code + actions. */}
        <div className="relative mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center justify-between gap-3 rounded-2xl border border-white/25 bg-white/10 px-4 py-3 backdrop-blur">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-white/70">
                Your code
              </p>
              <p className="truncate text-lg font-semibold tracking-tight text-white">
                {REFERRAL_CODE}
              </p>
            </div>
            <button
              type="button"
              onClick={copy}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-4 text-[13px] font-semibold text-white transition-colors duration-300 hover:bg-white/25 cursor-pointer"
            >
              <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={15} />
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <button
            type="button"
            onClick={share}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-brand transition-colors duration-300 hover:bg-cloud cursor-pointer"
          >
            <HugeiconsIcon icon={Share08Icon} size={16} />
            Share invite
          </button>
        </div>
      </div>

      {/* Stats. */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat icon={AddTeamIcon} label="Friends invited" value={String(stats.invited)} />
        <Stat icon={UserAdd01Icon} label="Signed up" value={String(stats.joined)} />
        <Stat
          icon={Coins01Icon}
          label="Total earned"
          value={naira(stats.earned)}
          tone="brand"
        />
      </div>

      {/* How it works. */}
      <section className="mt-6 rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
        <h2 className="text-base font-semibold tracking-tight text-ink">
          How it works
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div key={step.title} className="rounded-2xl border border-cloud bg-paper/50 p-4">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-cloud text-brand">
                  <HugeiconsIcon icon={step.icon} size={18} />
                </span>
                <span className="text-xs font-semibold text-ink-soft">
                  Step {i + 1}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-ink">{step.title}</p>
              <p className="mt-1 text-xs text-ink-soft">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Referred friends. */}
      <section className="mt-6 rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight text-ink">
            Your referrals
          </h2>
          <span className="rounded-full bg-cloud px-2.5 py-1 text-[11px] font-semibold text-brand">
            {naira(stats.earned)} earned
          </span>
        </div>

        {REFERRALS.length === 0 ? (
          <EmptyState
            icon={UserAdd01Icon}
            title="No referrals yet"
            description="Share your code with friends. Once they sign up and pay a due, they'll show up here."
          />
        ) : (
          <ul className="mt-3 flex flex-col">
            {REFERRALS.map((r) => {
              const status = STATUS_META[r.status];
              return (
                <li
                  key={r.id}
                  className="flex items-center gap-3 border-t border-cloud py-3.5 first:border-t-0 sm:gap-4"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper text-[13px] font-semibold text-ink-soft">
                    {r.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {r.name}
                    </p>
                    <p className="truncate text-xs text-ink-soft">
                      Invited {formatDate(r.date)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {r.reward > 0 ? (
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
                        <HugeiconsIcon icon={Coins01Icon} size={14} />+
                        {naira(r.reward)}
                      </span>
                    ) : (
                      <span className="text-sm font-semibold text-ink-soft">
                        —
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.className}`}
                    >
                      {r.status === "paid" && (
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={11} />
                      )}
                      {status.label}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
