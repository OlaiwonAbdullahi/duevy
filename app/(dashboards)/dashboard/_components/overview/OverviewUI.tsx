import Link from "next/link";
import type { ComponentProps } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import type { HugeIcon } from "../nav-config";
import { StatCard as BaseStatCard } from "../StatCard";
import { IconChip } from "../IconChip";

/** Overview stats are the shared StatCard with a touch more padding. */
export function StatCard(props: ComponentProps<typeof BaseStatCard>) {
  return <BaseStatCard {...props} className="p-6" />;
}

export function QuickAction({
  href,
  icon,
  label,
  hint,
}: {
  href: string;
  icon: HugeIcon;
  label: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-cloud bg-canvas p-4 transition-colors duration-300 hover:bg-paper cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
    >
      <IconChip icon={icon} className="h-10 w-10" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="truncate text-xs text-ink-soft">{hint}</p>
      </div>
      <HugeiconsIcon
        icon={ArrowRight01Icon}
        size={16}
        className="shrink-0 text-ink-soft transition-transform duration-300 group-hover:translate-x-0.5"
      />
    </Link>
  );
}

/** Section header with a "View all" link, used across both overviews. */
export function PanelHeader({
  title,
  href,
  cta = "View all",
}: {
  title: string;
  href: string;
  cta?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-base font-semibold tracking-tight text-ink">
        {title}
      </h2>
      <Link
        href={href}
        className="rounded-full text-xs font-semibold text-brand transition-colors hover:text-brand-bright cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        {cta}
      </Link>
    </div>
  );
}
