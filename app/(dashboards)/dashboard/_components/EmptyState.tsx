import type { ReactNode } from "react";
import type { HugeIcon } from "./nav-config";
import { IconChip } from "./IconChip";

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
      <IconChip icon={icon} size={sm ? "sm" : "md"} />
      <p className="mt-3 text-sm font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-5 text-ink-soft">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
