"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Logout01Icon,
  Cancel01Icon,
  ArrowDown01Icon,
  NewTwitterIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import type { NavGroup } from "./nav-config";

function isActive(pathname: string, href: string) {
  // Exact match for the section root, prefix match for its sub-routes.
  if (href === "/dashboard" || href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

type SidebarProps = {
  groups: NavGroup[];
  /** Small label under the wordmark, e.g. the current area or role. */
  subtitle?: string;
  /** Mobile drawer state. */
  open: boolean;
  onClose: () => void;
};

export default function Sidebar({
  groups,
  subtitle,
  open,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  // Which collapsible groups are folded away, keyed by title. A rep lands with
  // the Student group folded so the rep tools are front and centre.
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    Student: true,
  });
  const toggle = (title: string) =>
    setCollapsed((c) => ({ ...c, [title]: !c[title] }));

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={onClose}
        aria-hidden
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-cloud bg-canvas transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-6 h-18">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <Image
              src="/icons/logo2.svg"
              alt=""
              width={25}
              height={32}
              className="h-7 w-auto"
            />
            <span className="flex flex-col">
              <span className="text-ink text-lg tracking-tight leading-none">
                Duevy.
              </span>
              {subtitle && (
                <span className="mt-1 text-[11px] font-medium uppercase tracking-wide text-ink-soft">
                  {subtitle}
                </span>
              )}
            </span>
          </Link>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="lg:hidden grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-paper hover:text-ink transition-colors duration-300 cursor-pointer"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </button>
        </div>

        {/* Nav groups */}
        <nav data-tour="nav" className="flex-1 overflow-y-auto px-4 py-4">
          {groups.map((group, i) => {
            const isCollapsed = group.title ? collapsed[group.title] : false;
            const links = (
              <ul className="flex flex-col gap-1">
                {group.links.map((link) => {
                  const active = isActive(pathname, link.href);
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={onClose}
                        className={cn(
                          "group flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition-colors duration-300 cursor-pointer",
                          active
                            ? "bg-cloud text-brand"
                            : "text-ink-soft hover:bg-paper hover:text-ink",
                        )}
                      >
                        <HugeiconsIcon
                          icon={link.icon}
                          size={18}
                          strokeWidth={active ? 2 : 1.5}
                          className="shrink-0"
                        />
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            );

            return (
              <div key={group.title ?? i} className={cn(i > 0 && "mt-8")}>
                {group.title &&
                  (group.collapsible ? (
                    <button
                      type="button"
                      onClick={() => toggle(group.title as string)}
                      aria-expanded={!isCollapsed}
                      className="flex w-full items-center justify-between rounded-lg px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-soft transition-colors duration-300 hover:text-ink cursor-pointer"
                    >
                      {group.title}
                      <HugeiconsIcon
                        icon={ArrowDown01Icon}
                        size={14}
                        className={cn(
                          "shrink-0 transition-transform duration-300",
                          isCollapsed && "-rotate-90",
                        )}
                      />
                    </button>
                  ) : (
                    <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                      {group.title}
                    </p>
                  ))}

                {group.collapsible ? (
                  <AnimatePresence initial={false}>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          duration: 0.24,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="overflow-hidden"
                      >
                        {links}
                      </motion.div>
                    )}
                  </AnimatePresence>
                ) : (
                  links
                )}

                {/* Hint shown while a collapsible group is folded away. */}
                {group.title && group.collapsible && isCollapsed && (
                  <button
                    type="button"
                    onClick={() => toggle(group.title as string)}
                    className="w-full px-3 pt-0.5 text-left text-[11px] italic text-ink-soft transition-colors duration-300 hover:text-ink cursor-pointer"
                  >
                    Click to open your {group.title.toLowerCase()} menu
                  </button>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer: follow + sign out */}
        <div className="border-t border-cloud p-4">
          <button className="mt-1 flex w-full items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-paper hover:text-ink transition-colors duration-300 cursor-pointer">
            <HugeiconsIcon icon={Logout01Icon} size={18} className="shrink-0" />
            Sign out
          </button>
          <a
            href="https://x.com/duevyapp"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium text-ink-soft transition-colors duration-300 hover:bg-paper hover:text-ink cursor-pointer"
          >
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-ink text-canvas transition-colors duration-300 group-hover:bg-brand">
              <HugeiconsIcon icon={NewTwitterIcon} size={13} />
            </span>
            <span className="min-w-0 flex-1 truncate">Follow Duevy on X</span>
          </a>
        </div>
      </aside>
    </>
  );
}
