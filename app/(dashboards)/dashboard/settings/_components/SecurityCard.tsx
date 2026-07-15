"use client";

import { useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Shield01Icon,
  ArrowRight01Icon,
  Logout01Icon,
} from "@hugeicons/core-free-icons";
import { SettingsCard } from "./SettingsCard";
import { Toggle } from "./Toggle";
import { ChangePasswordModal } from "./ChangePasswordModal";
import { SessionsModal } from "./SessionsModal";

/** A tappable row that runs an action — change password, sign out everywhere. */
function ActionRow({
  title,
  description,
  cta,
  onClick,
  icon,
}: {
  title: string;
  description: string;
  cta: string;
  onClick: () => void;
  icon: HugeIconType;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-cloud py-4 first:border-t-0 first:pt-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="mt-0.5 text-xs text-ink-soft">{description}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-paper px-4 py-2 text-xs font-semibold text-ink transition-colors duration-300 hover:bg-cloud cursor-pointer"
      >
        <HugeiconsIcon icon={icon} size={14} />
        {cta}
      </button>
    </div>
  );
}

type HugeIconType = typeof Shield01Icon;

export function SecurityCard() {
  const [twoFactor, setTwoFactor] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(false);

  return (
    <SettingsCard
      icon={Shield01Icon}
      title="Security"
      description="Keep your account and payments protected."
    >
      <div className="flex flex-col">
        {/* Two-factor is a preference, so it lives inline with a toggle. */}
        <div className="flex items-center justify-between gap-4 border-t border-cloud py-4 first:border-t-0 first:pt-0">
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">
              Two-factor authentication
            </p>
            <p className="mt-0.5 text-xs text-ink-soft">
              Require a one-time code at sign-in for extra protection.
            </p>
          </div>
          <Toggle
            checked={twoFactor}
            onChange={(next) => {
              setTwoFactor(next);
              toast.success(
                next ? "Two-factor enabled" : "Two-factor disabled",
              );
            }}
            label="Two-factor authentication"
          />
        </div>

        <ActionRow
          title="Password"
          description="Change the password you use to sign in."
          cta="Change"
          icon={ArrowRight01Icon}
          onClick={() => setPasswordOpen(true)}
        />

        <ActionRow
          title="Active sessions"
          description="See where you're signed in and sign out other devices."
          cta="Manage"
          icon={Logout01Icon}
          onClick={() => setSessionsOpen(true)}
        />
      </div>

      {passwordOpen && (
        <ChangePasswordModal onClose={() => setPasswordOpen(false)} />
      )}
      {sessionsOpen && <SessionsModal onClose={() => setSessionsOpen(false)} />}
    </SettingsCard>
  );
}
