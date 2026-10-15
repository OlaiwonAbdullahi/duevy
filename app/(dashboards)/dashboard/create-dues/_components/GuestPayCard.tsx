import { useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon, Link01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import type { CollectionGuest } from "@/lib/api/types";
import { guestPayPath } from "@/lib/api/guest";
import { siteOrigin } from "@/lib/site-url";
import { UserAvatar } from "../../_components/UserAvatar";
import { timeAgo } from "../../_components/notifications-data";
import type { RepDue } from "./types";

/**
 * For a guest-enabled due: the public pay link to share, and everyone outside
 * the department who has paid through it. Guests aren't members, so they sit
 * here rather than in the paid / unpaid roster.
 */
export function GuestPayCard({ due, guests }: { due: RepDue; guests: CollectionGuest[] }) {
  const [copied, setCopied] = useState(false);
  const link = `${siteOrigin()}${guestPayPath(due.id)}`;
  const live = due.status === "active";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Guest pay link copied", { description: "Share it anywhere — no account needed to pay." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — select the link and copy it manually.");
    }
  };

  return (
    <section className="mt-4 rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cloud text-brand">
          <HugeiconsIcon icon={Link01Icon} size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-ink">Guest pay link</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
            {live
              ? "Anyone with this link can pay with just their name and email. Guests don't count toward your class's paid / unpaid."
              : "The link opens once this due is published."}
          </p>
        </div>
      </div>

      {live && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-cloud bg-paper/50 p-1.5 pl-4">
          <p className="min-w-0 flex-1 truncate font-mono text-xs text-ink">{link}</p>
          <button
            type="button"
            onClick={() => void copy()}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-brand px-3.5 text-xs font-semibold text-white transition-colors hover:bg-brand-bright cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={14} />
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}

      <div className="mt-5">
        <p className="text-xs font-medium text-ink-soft">
          Paid as guests · <span className="text-ink">{guests.length}</span>
        </p>
        {guests.length === 0 ? (
          <p className="mt-2 text-xs text-ink-soft">No guest payments yet.</p>
        ) : (
          <ul className="mt-2 flex flex-col">
            {guests.map((g) => (
              <li key={g.reference} className="flex items-center gap-3 border-t border-cloud py-3 first:border-t-0">
                <UserAvatar name={g.name} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{g.name}</p>
                  <p className="truncate text-[11px] text-ink-soft">
                    {g.email}
                    {g.matricNo ? ` · ${g.matricNo}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-ink-soft">{timeAgo(g.paidAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
