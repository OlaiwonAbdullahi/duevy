"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  Invoice01Icon,
  ReceiptDollarIcon,
  AiChat01Icon,
  AddInvoiceIcon,
  MoneySend01Icon,
  Menu01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { FEATURES } from "@/lib/features";
import type { HugeIcon } from "./nav-config";

type Tab = { label: string; href: string; icon: HugeIcon };

const STUDENT_TABS: Tab[] = [
  { label: "Home", href: "/dashboard", icon: Home01Icon },
  { label: "Dues", href: "/dashboard/dues", icon: Invoice01Icon },
  { label: "Activity", href: "/dashboard/transactions", icon: ReceiptDollarIcon },
  ...(FEATURES.assistant
    ? [{ label: "Duey", href: "/dashboard/assistant", icon: AiChat01Icon }]
    : []),
];

const REP_TABS: Tab[] = [
  { label: "Home", href: "/dashboard", icon: Home01Icon },
  { label: "Dues", href: "/dashboard/dues", icon: Invoice01Icon },
  { label: "Create", href: "/dashboard/create-dues", icon: AddInvoiceIcon },
  { label: "Payout", href: "/dashboard/payout", icon: MoneySend01Icon },
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

export function MobileTabBar({
  isRep,
  onMore,
}: {
  isRep: boolean;
  onMore: () => void;
}) {
  const pathname = usePathname();
  const tabs = isRep ? REP_TABS : STUDENT_TABS;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-cloud bg-canvas/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <ul
        className="mx-auto grid max-w-md px-2 pt-2 pb-2"
        style={{ gridTemplateColumns: `repeat(${tabs.length + 1}, minmax(0, 1fr))` }}
      >
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center gap-1 py-1 cursor-pointer"
              >
                <span
                  className={cn(
                    "grid h-8 w-14 place-items-center rounded-full transition-colors duration-300",
                    active ? "bg-cloud text-brand" : "text-ink-soft",
                  )}
                >
                  <HugeiconsIcon
                    icon={tab.icon}
                    size={20}
                    strokeWidth={active ? 2 : 1.5}
                  />
                </span>
                <span
                  className={cn(
                    "text-[11px] font-medium leading-none",
                    active ? "text-brand" : "text-ink-soft",
                  )}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={onMore}
            className="flex w-full flex-col items-center gap-1 py-1 cursor-pointer"
          >
            <span className="grid h-8 w-14 place-items-center rounded-full text-ink-soft transition-colors duration-300">
              <HugeiconsIcon icon={Menu01Icon} size={20} strokeWidth={1.5} />
            </span>
            <span className="text-[11px] font-medium leading-none text-ink-soft">
              More
            </span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
