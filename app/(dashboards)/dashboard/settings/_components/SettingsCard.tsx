import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import type { HugeIcon } from "../../_components/nav-config";

/**
 * The standard settings container: an icon-chipped header with a title and
 * short description, then the section body. Flat card, matching the dashboard.
 */
export function SettingsCard({
  icon,
  title,
  description,
  action,
  children,
}: {
  icon: HugeIcon;
  title: string;
  description?: string;
  /** Optional control pinned to the top-right of the header (e.g. a Save button). */
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cloud text-brand">
          <HugeiconsIcon icon={icon} size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight text-ink">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-[13px] text-ink-soft">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
