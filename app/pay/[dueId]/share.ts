import { API_BASE_URL } from "@/lib/api/config";
import type { GuestDue } from "@/lib/api/guest";
import type { DueType } from "@/lib/api/types";
import { store } from "@/lib/demo/fixtures";

/** What a pay link's preview shows. Amount in kobo, before the service fee. */
export type ShareDue = {
  title: string;
  type: DueType;
  amount: number;
  dueDate: string;
  spaceName: string;
};

/**
 * The due behind a pay link, for its title and share card when the link is
 * pasted into WhatsApp and the like. Read on the server, cached for a few
 * minutes; null when the link isn't open (or the API can't be reached), so
 * the preview falls back to a plain Duevy one. Demo links read the sample data.
 */
export async function loadShareDue(dueId: string): Promise<ShareDue | null> {
  if (dueId.startsWith("demo-")) {
    const d = store.dues.find(
      (x) => x.id === dueId && x.allowGuests && x.status === "active",
    );
    return d
      ? {
          title: d.title,
          type: d.type,
          amount: d.amount,
          dueDate: d.dueDate.slice(0, 10),
          spaceName: store.space.name,
        }
      : null;
  }
  try {
    const res = await fetch(
      `${API_BASE_URL}/public/dues/${encodeURIComponent(dueId)}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return null;
    const d = ((await res.json()) as { data?: GuestDue }).data;
    if (!d) return null;
    return {
      title: d.title,
      type: d.type,
      amount: d.amount,
      dueDate: d.dueDate,
      spaceName: d.space.name,
    };
  } catch {
    return null;
  }
}

/** "₦2,500" — whole naira unless there are kobo. */
export function shareNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: kobo % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

/** "Fri 14 Nov" from yyyy-mm-dd. */
export function shareDate(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y!, m! - 1, d!).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
