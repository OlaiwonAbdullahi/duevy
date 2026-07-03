"use client";

import { useState } from "react";
import { Notification02Icon } from "@hugeicons/core-free-icons";
import { SettingsCard } from "./SettingsCard";
import { ToggleRow } from "./Toggle";

type Prefs = {
  dueReminders: boolean;
  receipts: boolean;
  paymentConfirmations: boolean;
  weeklySummary: boolean;
  productUpdates: boolean;
};

/** Channel + event preferences. Toggles apply instantly, no save step. */
export function NotificationsCard() {
  const [prefs, setPrefs] = useState<Prefs>({
    dueReminders: true,
    receipts: true,
    paymentConfirmations: true,
    weeklySummary: false,
    productUpdates: false,
  });

  const set = (key: keyof Prefs) => (value: boolean) =>
    setPrefs((p) => ({ ...p, [key]: value }));

  return (
    <SettingsCard
      icon={Notification02Icon}
      title="Notifications"
      description="Choose what Duevy tells you about, and when."
    >
      <div className="flex flex-col">
        <ToggleRow
          title="Due reminders"
          description="A nudge before a due's deadline so you never miss one."
          checked={prefs.dueReminders}
          onChange={set("dueReminders")}
        />
        <ToggleRow
          title="Payment receipts"
          description="Email a receipt each time you settle a due."
          checked={prefs.receipts}
          onChange={set("receipts")}
        />
        <ToggleRow
          title="Payment confirmations"
          description="Push and in-app alerts the moment a payment clears."
          checked={prefs.paymentConfirmations}
          onChange={set("paymentConfirmations")}
        />
        <ToggleRow
          title="Weekly summary"
          description="A Monday digest of what you owe and what's cleared."
          checked={prefs.weeklySummary}
          onChange={set("weeklySummary")}
        />
        <ToggleRow
          title="Product updates"
          description="Occasional news about new Duevy features. No spam."
          checked={prefs.productUpdates}
          onChange={set("productUpdates")}
        />
      </div>
    </SettingsCard>
  );
}
