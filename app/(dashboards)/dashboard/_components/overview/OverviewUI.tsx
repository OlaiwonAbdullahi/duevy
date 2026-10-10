import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
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

/**
 * Phone hero: the headline figure on a brand card, banking-app style. Children
 * render under the amount (buttons, a progress bar).
 */
export function BalanceCard({
  label,
  value,
  hint,
  doodle,
  children,
}: {
  label: string;
  value: string;
  hint?: string;
  /** Use the Duevy doodle artwork instead of the gradient + rings. */
  doodle?: boolean;
  children?: ReactNode;
}) {
  return (
    <section
      className={`relative overflow-hidden rounded-[28px] p-5 text-white  ${
        doodle ? "doodle-card" : "bg-linear-to-br from-brand-bright via-brand to-brand-deep"
      }`}
    >
      {!doodle && (
        <>
          {/* Soft decorative rings. */}
          <span aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border-[28px] border-white/8" />
          <span aria-hidden className="pointer-events-none absolute -bottom-24 -left-10 h-48 w-48 rounded-full bg-white/6" />
        </>
      )}
      <div className="relative">
        <p className="text-xs font-medium text-white/75">{label}</p>
        <p className="mt-1.5 text-[32px] font-semibold leading-none tracking-tight tabular-nums">
          {value}
        </p>
        {hint && <p className="mt-2 text-xs text-white/75">{hint}</p>}
        {children && <div className="mt-5">{children}</div>}
      </div>
    </section>
  );
}

/** Pill button for use on a BalanceCard. */
export function BalanceCardButton({
  href,
  icon,
  label,
  variant = "solid",
}: {
  href: string;
  icon: HugeIcon;
  label: string;
  variant?: "solid" | "ghost";
}) {
  return (
    <Link
      href={href}
      className={
        variant === "solid"
          ? "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold text-brand transition-opacity active:opacity-80"
          : "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-white/15 text-sm font-semibold text-white transition-colors active:bg-white/25"
      }
    >
      <HugeiconsIcon icon={icon} size={17} />
      {label}
    </Link>
  );
}

/** Row of round icon shortcuts under the hero, like a banking app's home. */
export function ActionRow({
  actions,
}: {
  actions: { href: string; icon: HugeIcon; label: string }[];
}) {
  return (
    <div className="mt-5 grid grid-cols-4 gap-2">
      {actions.map((a) => (
        <Link
          key={a.label}
          href={a.href}
          className="group flex flex-col items-center gap-2 rounded-2xl py-1 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-cloud text-brand transition-transform duration-200 group-active:scale-95">
            <HugeiconsIcon icon={a.icon} size={22} />
          </span>
          <span className="text-[11px] font-semibold leading-tight text-ink">{a.label}</span>
        </Link>
      ))}
    </div>
  );
}

/** Compact two-up figures under the hero on phones. */
export function MiniStat({ label, value, tone }: { label: string; value: string; tone?: "danger" }) {
  return (
    <div className="rounded-2xl border border-cloud bg-canvas px-4 py-3">
      <p className="text-[11px] font-medium text-ink-soft">{label}</p>
      <p
        className={`mt-0.5 text-base font-semibold tracking-tight tabular-nums ${
          tone === "danger" ? "text-rose-600" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/**
 * Subpage headline figure on phones: plain text on the page (no card), with an
 * optional thin progress bar. Lighter than BalanceCard, which is kept for the
 * overview so subpages don't all look like the home screen.
 */
export function InlineStat({
  label,
  value,
  caption,
  rate,
  aside,
  children,
}: {
  label: string;
  value: string;
  caption?: string;
  /** 0–100; draws the progress bar with the percentage beside it. */
  rate?: number;
  /** Rendered to the right of the figure (e.g. the join code). */
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-cloud pb-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-ink-soft">{label}</p>
          <p className="mt-1 text-[34px] font-semibold leading-none tracking-tight text-ink tabular-nums">
            {value}
          </p>
          {/* Without a bar the caption sits under the figure, beside any aside. */}
          {caption && rate === undefined && <p className="mt-2 text-xs text-ink-soft">{caption}</p>}
        </div>
        {aside}
      </div>
      {rate !== undefined && (
        <div className="mt-4 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-500"
              style={{ width: `${rate}%` }}
            />
          </div>
          <span className="shrink-0 text-xs font-semibold text-brand tabular-nums">{rate}%</span>
        </div>
      )}
      {caption && rate !== undefined && <p className="mt-2 text-xs text-ink-soft">{caption}</p>}
      {children && <div className="mt-4">{children}</div>}
    </section>
  );
}
