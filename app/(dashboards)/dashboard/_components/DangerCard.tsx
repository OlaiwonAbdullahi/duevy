import type { ReactNode } from "react";
import { Alert01Icon } from "@hugeicons/core-free-icons";
import type { HugeIcon } from "./nav-config";
import { IconChip } from "./IconChip";

/**
 * The rose-tinted shell for destructive actions, walled off so they read as
 * separate from everyday settings. Mirrors SettingsCard's header layout.
 */
export function DangerCard({
  icon = Alert01Icon,
  title,
  description,
  children,
}: {
  icon?: HugeIcon;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-rose-200 bg-rose-50/50 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <IconChip icon={icon} tone="danger" />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight text-ink">
            {title}
          </h2>
          <p className="mt-0.5 text-[13px] text-ink-soft">{description}</p>
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
