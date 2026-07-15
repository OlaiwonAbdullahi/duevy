"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Logout01Icon,
  ComputerIcon,
  SmartPhone01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Modal } from "../../_components/Modal";
import { Skeleton } from "../../_components/Skeleton";
import { EmptyState } from "../../_components/EmptyState";
import { listSessions, revokeSession } from "@/lib/api/me";
import { ApiError } from "@/lib/api/errors";
import type { Session } from "@/lib/api/types";

function deviceIcon(device: string) {
  return /ios|android|phone/i.test(device) ? SmartPhone01Icon : ComputerIcon;
}

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function SessionsModal({ onClose }: { onClose: () => void }) {
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    listSessions()
      .then(setSessions)
      .catch(() => {
        toast.error("Couldn't load your active sessions.");
        setSessions([]);
      });
  }, []);

  const revoke = async (session: Session) => {
    setRevokingId(session.id);
    try {
      await revokeSession(session.id);
      setSessions((list) => (list ?? []).filter((s) => s.id !== session.id));
      toast.success("Signed out of that device");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Couldn't sign out that device.",
      );
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <Modal title="Active sessions" icon={Logout01Icon} onClose={onClose}>
      {sessions === null ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-2xl border border-cloud p-3.5">
              <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="mt-2 h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          size="sm"
          icon={Logout01Icon}
          title="No active sessions"
          description="Sign in again to see devices here."
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center gap-3 rounded-2xl border border-cloud bg-paper p-3.5"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-canvas text-ink-soft">
                <HugeiconsIcon icon={deviceIcon(session.device)} size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate text-sm font-medium text-ink">
                  {session.device}
                  {session.current && (
                    <span className="rounded-full bg-cloud px-2 py-0.5 text-[10px] font-semibold text-brand">
                      This device
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-ink-soft">
                  {session.ip} · Active {timeAgo(session.lastSeenAt)}
                </p>
              </div>
              {!session.current && (
                <Button
                  onClick={() => revoke(session)}
                  disabled={revokingId === session.id}
                  variant="ghost"
                  size="sm"
                  className="shrink-0 rounded-full text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                >
                  {revokingId === session.id ? "Signing out…" : "Sign out"}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
