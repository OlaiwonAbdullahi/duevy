import { apiClient, type Page } from "./client";
import type { ApiMeta, NotificationItem } from "./types";

/** The bell dropdown feed. `meta.unreadCount` carries the badge total. */
export function listNotifications(
  query: { page?: number; perPage?: number } = {},
): Promise<Page<NotificationItem[]>> {
  const search = new URLSearchParams();
  if (query.page) search.set("page", String(query.page));
  if (query.perPage) search.set("perPage", String(query.perPage));
  const qs = search.toString();
  return apiClient.getPage<NotificationItem[]>(`/notifications${qs ? `?${qs}` : ""}`);
}

/** Convenience: the unread badge count from the list `meta`. */
export function unreadCount(meta?: ApiMeta): number {
  return (meta as (ApiMeta & { unreadCount?: number }) | undefined)?.unreadCount ?? 0;
}

export function markRead(notificationId: string) {
  return apiClient.post<NotificationItem>(`/notifications/${notificationId}/read`);
}

export function markAllRead() {
  return apiClient.post<void>("/notifications/read-all");
}
