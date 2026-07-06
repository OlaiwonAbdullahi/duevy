"use client";

import { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification02Icon } from "@hugeicons/core-free-icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { EmptyState } from "./EmptyState";
import {
  INITIAL_NOTIFICATIONS,
  TONE_CLASS,
  type AppNotification,
} from "./notifications-data";

export function NotificationsMenu() {
  const [items, setItems] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const unread = items.filter((n) => !n.read).length;

  const markAllRead = () =>
    setItems((list) => list.map((n) => ({ ...n, read: true })));
  const markRead = (id: string) =>
    setItems((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          data-tour="notifications"
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
          className="relative grid h-10 w-10 place-items-center rounded-full text-ink transition-colors duration-300 hover:bg-paper cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <HugeiconsIcon icon={Notification02Icon} size={20} />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[9px] font-bold text-white">
              {unread}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[22rem] max-w-[calc(100vw-2rem)] p-0"
      >
        <div className="flex items-center justify-between border-b border-cloud px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-ink">Notifications</h3>
            {unread > 0 && (
              <span className="rounded-full bg-cloud px-2 py-0.5 text-[10px] font-semibold text-brand">
                {unread} new
              </span>
            )}
          </div>
          {unread > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs font-semibold text-brand transition-colors hover:text-brand-bright cursor-pointer"
            >
              Mark all read
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyState
            size="sm"
            icon={Notification02Icon}
            title="You're all caught up"
            description="New reminders, payments and approvals will show up here."
          />
        ) : (
          <ul className="max-h-[22rem] divide-y divide-cloud overflow-y-auto">
            {items.map((n) => {
              const body = (
                <div className="flex gap-3">
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${TONE_CLASS[n.tone]}`}
                  >
                    <HugeiconsIcon icon={n.icon} size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                      <span className="truncate">{n.title}</span>
                      {!n.read && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                      )}
                    </p>
                    <p className="mt-0.5 text-xs leading-5 text-ink-soft">
                      {n.detail}
                    </p>
                    <p className="mt-1 text-[11px] text-ink-soft">{n.time}</p>
                  </div>
                </div>
              );

              const className = `block px-4 py-3 text-left transition-colors hover:bg-paper ${
                n.read ? "" : "bg-cloud/25"
              }`;

              return (
                <li key={n.id}>
                  {n.href ? (
                    <Link
                      href={n.href}
                      onClick={() => markRead(n.id)}
                      className={`${className} cursor-pointer`}
                    >
                      {body}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => markRead(n.id)}
                      className={`${className} w-full cursor-pointer`}
                    >
                      {body}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
