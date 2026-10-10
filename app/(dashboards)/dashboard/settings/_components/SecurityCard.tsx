"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Shield01Icon,
  ArrowRight01Icon,
  Logout01Icon,
} from "@hugeicons/core-free-icons";
import { SettingsCard } from "./SettingsCard";
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
    <div className="border-t border-cloud first:border-t-0">
      {/* Phones: the whole row is the tap target, with a chevron. */}
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 py-3.5 text-left transition-colors active:bg-paper/60 cursor-pointer sm:hidden"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-ink">{title}</span>
          <span className="mt-0.5 block text-xs text-ink-soft">{description}</span>
        </span>
        <HugeiconsIcon icon={ChevronRight} size={16} className="shrink-0 text-ink-soft/70" />
      </button>

      <div className="hidden items-center justify-between gap-4 py-4 sm:flex">
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
    </div>
  );
}

type HugeIconType = typeof Shield01Icon;
const ChevronRight = ArrowRight01Icon;

export function SecurityCard() {
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(false);

  return (
    <SettingsCard
      icon={Shield01Icon}
      title="Security"
      description="Keep your account and payments protected."
    >
      <div className="-my-3.5 flex flex-col sm:-mt-4 sm:mb-0">
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
