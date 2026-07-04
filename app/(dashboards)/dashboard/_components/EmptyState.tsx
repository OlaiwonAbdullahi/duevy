import type { ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import type { HugeIcon } from "./nav-config";

/**
 * Shared empty state — every empty list, table, or panel uses this so they all
 * read the same: an icon, a short title, and one line of guidance. Pass an
 * optional `action` for a recovery button (e.g. "Clear filters").
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  size = "md",
  className = "",
}: {
  icon: HugeIcon;
  title: string;
  description: string;
  action?: ReactNode;
  size?: "sm" | "md";
  className?: string;
}) {
  const sm = size === "sm";

  return (
    <div
      className={`flex flex-col items-center text-center ${
        sm ? "px-4 py-6" : "px-6 py-12"
      } ${className}`}
    >
      <span
        className={`grid place-items-center rounded-full bg-cloud text-brand ${
          sm ? "h-9 w-9" : "h-11 w-11"
        }`}
      >
        <HugeiconsIcon icon={icon} size={sm ? 17 : 20} />
      </span>
      <p className="mt-3 text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-5 text-ink-soft">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
