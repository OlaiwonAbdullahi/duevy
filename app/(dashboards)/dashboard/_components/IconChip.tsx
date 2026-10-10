import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import type { HugeIcon } from "./nav-config";

const SIZES = {
  sm: { chip: "h-9 w-9", icon: 18 },
  md: { chip: "h-11 w-11", icon: 20 },
  lg: { chip: "h-14 w-14", icon: 24 },
} as const;

const TONES = {
  brand: "bg-cloud text-brand",
  danger: "bg-rose-100 text-rose-600",
} as const;

/** The round icon plate used on card headers, stats and modals. */
export function IconChip({
  icon,
  size = "sm",
  tone = "brand",
  className,
}: {
  icon: HugeIcon;
  size?: keyof typeof SIZES;
  tone?: keyof typeof TONES;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full",
        SIZES[size].chip,
        TONES[tone],
        className,
      )}
    >
      <HugeiconsIcon icon={icon} size={SIZES[size].icon} />
    </span>
  );
}
