"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  Invoice01Icon,
  ReceiptDollarIcon,
  AddInvoiceIcon,
  UserGroup03Icon,
  MoneySend01Icon,
  GridViewIcon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { HugeIcon } from "./nav-config";

type Tab = { label: string; href: string; icon: HugeIcon };

const STUDENT_TABS: Tab[] = [
  { label: "Dues", href: "/dashboard/dues", icon: Invoice01Icon },
  { label: "Settings", href: "/dashboard/settings", icon: Settings01Icon },
  { label: "Home", href: "/dashboard", icon: Home01Icon },
  { label: "Transactions", href: "/dashboard/transactions", icon: ReceiptDollarIcon },
];

const REP_TABS: Tab[] = [
  { label: "Dues", href: "/dashboard/create-dues", icon: AddInvoiceIcon },
  { label: "Circle", href: "/dashboard/circle", icon: UserGroup03Icon },
  { label: "Home", href: "/dashboard", icon: Home01Icon },
  { label: "Payout", href: "/dashboard/payout", icon: MoneySend01Icon },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

const EASE = "cubic-bezier(0.34,1.3,0.64,1)";

/** Cuts a circle (r ≈ 32.75px) out of the pill's top edge at --notch-x. */
const NOTCH_MASK = "radial-gradient(circle at var(--notch-x) 0, transparent 32px, #000 33.5px)";

const tabClass =
  "relative z-10 flex h-16 flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold tracking-wide transition-colors duration-300 cursor-pointer select-none focus-visible:outline-none active:[&>svg]:scale-90 [&>svg]:transition-all [&>svg]:duration-300";

/**
 * App-style floating tab bar for phones and tablets: a white glass pill. The
 * active tab's icon lifts out into a raised brand circle, sitting in a notch
 * cut into the pill; both slide to whichever tab is active. The last slot
 * ("More") opens the full menu sheet.
 */
export default function BottomNav({ isRep, onMore }: { isRep: boolean; onMore: () => void }) {
  const pathname = usePathname();
  const tabs = isRep ? REP_TABS : STUDENT_TABS;
  const activeIndex = tabs.findIndex((tab) => isActive(pathname, tab.href));
  const activeTab = activeIndex === -1 ? null : tabs[activeIndex];
  // Tabs plus "More" share the width equally; the notch and the circle sit
  // over the middle of the active slot.
  const slots = tabs.length + 1;
  const x = activeIndex === -1 ? 50 : ((activeIndex + 0.5) / slots) * 100;

  return (
    <nav
      aria-label="Primary"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden"
    >
      <div className="pointer-events-auto relative mx-auto max-w-md">
        {/* Shadow on its own unmasked layer — a mask would clip it. Box
            shadows only paint outside the box, so the notch stays clear. */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-[28px] shadow-[0_16px_40px_-14px_rgba(16,40,30,0.3)] dark:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.6)]"
        />

        {/* Glass pill, with a round notch masked out above the active tab. */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-[28px] border border-black/[0.06] bg-linear-to-b from-white/75 to-white/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-2xl backdrop-saturate-[1.8] dark:border-white/15 dark:from-white/14 dark:to-white/6 dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.18)]"
          style={
            {
              "--notch-x": `${x}%`,
              transition: `--notch-x 500ms ${EASE}`,
              maskImage: activeTab ? NOTCH_MASK : undefined,
              WebkitMaskImage: activeTab ? NOTCH_MASK : undefined,
            } as React.CSSProperties
          }
        />

        {/* The notch's own edge: a ring on the cut-out, clipped to the pill so
            only the curve inside the bar shows. Slides with the notch. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px]">
          <span
            className="absolute top-0 h-[66px] w-[66px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/[0.08] shadow-[0_2px_6px_rgba(16,40,30,0.08)] dark:border-white/15 dark:shadow-none"
            style={{
              left: `${x}%`,
              opacity: activeTab ? 1 : 0,
              transition: `left 500ms ${EASE}, opacity 200ms ease`,
            }}
          />
        </div>

        {/* The floating active icon. */}
        <span
          aria-hidden
          className="absolute top-0 z-20 grid h-[52px] w-[52px] -translate-x-1/2 -translate-y-[22px] place-items-center rounded-full bg-linear-to-b from-brand-bright to-brand text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25)]"
          style={{
            left: `${x}%`,
            opacity: activeTab ? 1 : 0,
            transform: activeTab ? undefined : "translate(-50%, 0) scale(0.6)",
            transition: `left 500ms ${EASE}, opacity 200ms ease, transform 300ms ${EASE}`,
          }}
        >
          {activeTab && <HugeiconsIcon key={activeTab.href} icon={activeTab.icon} size={22} strokeWidth={2} className="animate-in fade-in zoom-in-75 duration-300" />}
        </span>

        <ul className="relative flex items-stretch px-1.5">
          {tabs.map((tab) => {
            const active = isActive(pathname, tab.href);
            return (
              <li key={tab.href} className="flex flex-1">
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(tabClass, active ? "justify-end pb-2.5 text-brand" : "text-ink-soft hover:text-ink")}
                >
                  {/* The active icon lives in the floating circle instead. */}
                  <HugeiconsIcon
                    icon={tab.icon}
                    size={21}
                    strokeWidth={1.7}
                    className={active ? "h-0 opacity-0" : undefined}
                  />
                  {tab.label}
                </Link>
              </li>
            );
          })}
          <li className="flex flex-1">
            <button
              type="button"
              onClick={onMore}
              data-tour="menu"
              aria-label="Open menu"
              className={cn(tabClass, "text-ink-soft hover:text-ink")}
            >
              <HugeiconsIcon icon={GridViewIcon} size={21} strokeWidth={1.7} />
              More
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
