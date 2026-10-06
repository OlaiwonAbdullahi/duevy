"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Logout01Icon, NewTwitterIcon } from "@hugeicons/core-free-icons";
import { useAuth } from "@/lib/auth/auth-context";
import { ConfirmDialog } from "./ConfirmDialog";
import type { NavGroup } from "./nav-config";

export function MobileMoreSheet({
  open,
  onClose,
  groups,
}: {
  open: boolean;
  onClose: () => void;
  groups: NavGroup[];
}) {
  const { logout } = useAuth();
  const router = useRouter();
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  async function handleLogout() {
    setConfirmingLogout(false);
    onClose();
    await logout();
    router.push("/login");
  }

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="More"
        className={`fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-canvas px-5 pt-3 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:hidden ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-cloud" />

        {groups.map((group, i) => (
          <div key={group.title ?? i} className={i > 0 ? "mt-6" : ""}>
            {group.title && (
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                {group.title}
              </p>
            )}
            <ul className="flex flex-col gap-1">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-ink transition-colors duration-300 hover:bg-paper cursor-pointer"
                  >
                    <HugeiconsIcon icon={link.icon} size={18} strokeWidth={1.5} className="shrink-0 text-ink-soft" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="mt-6 border-t border-cloud pt-4">
          <button
            type="button"
            onClick={() => setConfirmingLogout(true)}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-ink-soft transition-colors duration-300 hover:bg-paper hover:text-ink cursor-pointer"
          >
            <HugeiconsIcon icon={Logout01Icon} size={18} strokeWidth={1.5} className="shrink-0" />
            Sign out
          </button>
          <a
            href="https://x.com/duevyapp"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-ink-soft transition-colors duration-300 hover:bg-paper hover:text-ink cursor-pointer"
          >
            <HugeiconsIcon icon={NewTwitterIcon} size={16} strokeWidth={1.5} className="shrink-0" />
            Follow Duevy on X
          </a>
        </div>
      </div>

      <ConfirmDialog
        open={confirmingLogout}
        icon={Logout01Icon}
        title="Sign out?"
        description="You'll need to sign in again to access your dashboard."
        confirmLabel="Sign out"
        tone="danger"
        onConfirm={handleLogout}
        onClose={() => setConfirmingLogout(false)}
      />
    </>
  );
}
