"use client";

import type { ReactNode } from "react";
import { Alert01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import type { HugeIcon } from "../../dashboard/_components/nav-config";
import { AdminModal } from "./AdminModal";

/**
 * "Are you sure?" dialog for consequential admin actions — replaces
 * window.confirm. Locked while `busy` so the result can't be hidden.
 */
export function ConfirmDialog({
  title,
  description,
  icon = Alert01Icon,
  confirmLabel,
  busyLabel,
  tone = "danger",
  busy,
  onConfirm,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  icon?: HugeIcon;
  confirmLabel: string;
  busyLabel: string;
  tone?: "danger" | "brand";
  busy: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <AdminModal
      icon={icon}
      title={title}
      description={description}
      onClose={() => !busy && onClose()}
      footer={
        <>
          <Button variant="brand-outline" size="pill" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "brand"}
            size="pill"
            disabled={busy}
            aria-busy={busy || undefined}
            onClick={onConfirm}
          >
            {busy && (
              <span
                aria-hidden
                className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current/30 border-t-current"
              />
            )}
            {busy ? busyLabel : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-sm text-ink-soft">{children}</div>
    </AdminModal>
  );
}
