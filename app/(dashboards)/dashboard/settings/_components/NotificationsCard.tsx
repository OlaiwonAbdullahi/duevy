"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification02Icon, Mail01Icon, SmartPhone01Icon } from "@hugeicons/core-free-icons";
import { SettingsCard } from "./SettingsCard";
import { ToggleRow } from "./Toggle";
import { Skeleton } from "../../_components/Skeleton";
import { ApiError } from "@/lib/api/errors";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/lib/api/me";
import type { NotificationPreferences } from "@/lib/api/types";

const FALLBACK: NotificationPreferences = {
  email: { dueReminders: true, paymentReceipts: true },
  push: { dueReminders: true, payments: true, circleActivity: true },
};

/** Channel + event preferences, backed by `/me/notification-preferences`. Every
 *  toggle sends the full object — the API doesn't support partial updates. */
export function NotificationsCard() {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    getNotificationPreferences()
      .then(setPrefs)
      .catch(() => {
        toast.error("Couldn't load your notification preferences.");
        setPrefs(FALLBACK);
      })
      .finally(() => setLoading(false));
  }, []);

  const set =
    (group: "email" | "push", key: string) => async (value: boolean) => {
      if (!prefs) return;
      const prev = prefs;
      const next: NotificationPreferences = {
        ...prefs,
        [group]: { ...prefs[group], [key]: value },
      };
      setPrefs(next);
      const rowKey = `${group}.${key}`;
      setSavingKey(rowKey);
      try {
        const saved = await updateNotificationPreferences(next);
        setPrefs(saved);
      } catch (err) {
        setPrefs(prev);
        toast.error(
          err instanceof ApiError ? err.message : "Couldn't save that change.",
        );
      } finally {
        setSavingKey((k) => (k === rowKey ? null : k));
      }
    };

  if (loading || !prefs) {
    return (
      <SettingsCard
        icon={Notification02Icon}
        title="Notifications"
        description="Choose what Duevy tells you about, and when."
      >
        <div className="flex flex-col gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="mt-2 h-3 w-56" />
              </div>
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
          ))}
        </div>
      </SettingsCard>
    );
  }

  return (
    <SettingsCard
      icon={Notification02Icon}
      title="Notifications"
      description="Choose what Duevy tells you about, and when."
    >
      <div className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
        <HugeiconsIcon icon={Mail01Icon} size={14} />
        Email
      </div>

      <div className="flex flex-col">
        <ToggleRow
          title="Due reminders"
          description="A nudge before a due's deadline so you never miss one."
          checked={prefs.email.dueReminders}
          onChange={set("email", "dueReminders")}
          disabled={savingKey === "email.dueReminders"}
        />
        <ToggleRow
          title="Payment receipts"
          description="Email a receipt each time you settle a due."
          checked={prefs.email.paymentReceipts}
          onChange={set("email", "paymentReceipts")}
          disabled={savingKey === "email.paymentReceipts"}
        />
      </div>

      <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
        <HugeiconsIcon icon={SmartPhone01Icon} size={14} />
        Push
      </div>
      <div className="flex flex-col">
        <ToggleRow
          title="Due reminders"
          description="A push alert before a due's deadline."
          checked={prefs.push.dueReminders}
          onChange={set("push", "dueReminders")}
          disabled={savingKey === "push.dueReminders"}
        />
        <ToggleRow
          title="Payments"
          description="The moment a payment clears."
          checked={prefs.push.payments}
          onChange={set("push", "payments")}
          disabled={savingKey === "push.payments"}
        />
        <ToggleRow
          title="Circle activity"
          description="New dues, polls and announcements in your spaces."
          checked={prefs.push.circleActivity}
          onChange={set("push", "circleActivity")}
          disabled={savingKey === "push.circleActivity"}
        />
      </div>
    </SettingsCard>
  );
}
