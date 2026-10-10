"use client";

import { useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Dialog as DialogPrimitive } from "radix-ui";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BubbleChatEditIcon,
  Logout01Icon,
  NewTwitterIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/auth-context";
import { ConfirmDialog } from "./ConfirmDialog";
import { FeedbackModal } from "./FeedbackModal";
import { UserAvatar } from "./UserAvatar";
import type { HugeIcon, NavGroup } from "./nav-config";

/** How far (px) the sheet has to be dragged down before letting go closes it. */
const DISMISS_DISTANCE = 110;

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

/**
 * The tab bar's "More": a bottom sheet with every dashboard page as an icon
 * tile, plus feedback and sign out. Drag the top down (or tap outside) to close.
 */
export default function MoreSheet({
  open,
  onOpenChange,
  groups,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: NavGroup[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [confirmingLogout, setConfirmingLogout] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Swipe-to-dismiss: follow the finger downwards, close past the threshold.
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startY = useRef<number | null>(null);

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    startY.current = e.clientY;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (startY.current === null) return;
    setDragY(Math.max(0, e.clientY - startY.current));
  }
  function onPointerUp() {
    if (startY.current === null) return;
    startY.current = null;
    setDragging(false);
    if (dragY > DISMISS_DISTANCE) onOpenChange(false);
    setDragY(0);
  }

  async function handleLogout() {
    setConfirmingLogout(false);
    await logout();
    router.push("/login");
  }

  // Reps get "Student" + "Rep tools"; students pass no groups (no tiles).
  const sections = groups.map((g) => ({
    title: g.title ?? "Menu",
    links: g.links.filter((l) => l.href !== "/dashboard"),
  }));

  return (
    <>
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 lg:hidden" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            style={{
              transform: dragY ? `translateY(${dragY}px)` : undefined,
              transition: dragging ? "none" : "transform 300ms cubic-bezier(0.22,1,0.36,1)",
            }}
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col rounded-t-[32px] border-t border-white/60 bg-canvas pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.35)] outline-none duration-300 data-open:animate-in data-open:slide-in-from-bottom data-closed:animate-out data-closed:slide-out-to-bottom dark:border-white/10 lg:hidden"
          >
            {/* Drag handle + account header — the swipe-down target. */}
            <div
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className="shrink-0 touch-none cursor-grab px-5 pt-3 active:cursor-grabbing"
            >
              <span aria-hidden className="mx-auto block h-1.5 w-10 rounded-full bg-ink-soft/30" />
              <div className="mt-4 flex items-center gap-3">
                <UserAvatar name={user?.name ?? ""} src={user?.avatarUrl} size={44} />
                <div className="min-w-0 flex-1">
                  <DialogPrimitive.Title className="truncate text-base font-semibold text-ink">
                    {user?.name}
                  </DialogPrimitive.Title>
                  <p className="truncate text-xs text-ink-soft">{user?.email}</p>
                </div>
                <Link
                  href="/dashboard/settings"
                  onClick={() => onOpenChange(false)}
                  className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full bg-cloud px-3.5 text-xs font-semibold text-brand"
                >
                  Profile
                  <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                </Link>
              </div>
            </div>

            <div className="mt-5 min-h-0 flex-1 overflow-y-auto overscroll-contain px-5">
              {sections.map((section) => (
                <section key={section.title} className="mb-6">
                  <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                    {section.title}
                  </h3>
                  <ul className="grid grid-cols-4 gap-x-2 gap-y-4">
                    {section.links.map((link) => (
                      <li key={link.href}>
                        <Tile
                          href={link.href}
                          icon={link.icon}
                          label={link.label}
                          active={isActive(pathname, link.href)}
                          onNavigate={() => onOpenChange(false)}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}

              <div className="overflow-hidden rounded-3xl border border-cloud bg-paper/50">
                <Row
                  icon={BubbleChatEditIcon}
                  label="Send feedback"
                  onClick={() => {
                    onOpenChange(false);
                    setFeedbackOpen(true);
                  }}
                />
                <a
                  href="https://x.com/duevyapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 border-t border-cloud px-4 py-3.5 text-sm font-medium text-ink"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-ink text-canvas">
                    <HugeiconsIcon icon={NewTwitterIcon} size={14} />
                  </span>
                  Follow Duevy on X
                </a>
                <Row
                  icon={Logout01Icon}
                  label="Sign out"
                  danger
                  onClick={() => {
                    onOpenChange(false);
                    setConfirmingLogout(true);
                  }}
                />
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <ConfirmDialog
        open={confirmingLogout}
        icon={Logout01Icon}
        title="Sign out?"
        sheetOnMobile={false}
        description="You'll need to sign in again to access your dashboard."
        confirmLabel="Sign out"
        tone="danger"
        onConfirm={handleLogout}
        onClose={() => setConfirmingLogout(false)}
      />
      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}
    </>
  );
}

function Tile({
  href,
  icon,
  label,
  active,
  onNavigate,
}: {
  href: string;
  icon: HugeIcon;
  label: string;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className="group flex flex-col items-center gap-2 text-center focus-visible:outline-none"
    >
      <span
        className={cn(
          "grid h-14 w-14 place-items-center rounded-2xl transition-transform duration-200 group-active:scale-95 group-focus-visible:ring-2 group-focus-visible:ring-brand/40",
          active ? "bg-brand text-white shadow-[0_8px_20px_-8px_var(--p-primary)]" : "bg-cloud text-brand",
        )}
      >
        <HugeiconsIcon icon={icon} size={22} strokeWidth={active ? 2 : 1.6} />
      </span>
      <span className="text-[11px] font-semibold leading-tight text-ink">{label}</span>
    </Link>
  );
}

function Row({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: HugeIcon;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-medium transition-colors active:bg-cloud/60 [&:not(:first-child)]:border-t [&:not(:first-child)]:border-cloud cursor-pointer",
        danger ? "text-rose-600" : "text-ink",
      )}
    >
      <span
        className={cn(
          "grid h-8 w-8 place-items-center rounded-full",
          danger ? "bg-rose-500/10" : "bg-cloud text-brand",
        )}
      >
        <HugeiconsIcon icon={icon} size={16} />
      </span>
      {label}
    </button>
  );
}
