import { cn } from "@/lib/utils";
import type { HugeIcon } from "./nav-config";
import { IconChip } from "./IconChip";

/** A single dashboard stat: icon chip, label, value, optional hint line. */
export function StatCard({
  icon,
  label,
  value,
  hint,
  tone,
  className,
}: {
  icon: HugeIcon;
  label: string;
  value: string;
  hint?: string;
  tone?: "brand";
  className?: string;
}) {
  return (
    <div className={cn("rounded-3xl border border-cloud bg-canvas p-5", className)}>
      <IconChip icon={icon} className="mb-3" />
      <p className="text-xs font-medium text-ink-soft">{label}</p>
      <p
        className={cn(
          "mt-1 text-xl font-semibold tracking-tight",
          tone === "brand" ? "text-brand" : "text-ink",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}
