"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  AddInvoiceIcon,
  Award01Icon,
  CheckmarkSquare01Icon,
  CreditCardIcon,
  Download01Icon,
  GiftIcon,
  InformationCircleIcon,
  Invoice01Icon,
  MoneySend01Icon,
  Notification02Icon,
  Notification03Icon,
  Search01Icon,
  Settings02Icon,
  SquareLock02Icon,
  UserGroup03Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { HugeIcon } from "./nav-config";
import { REP_LINKS, STUDENT_LINKS } from "./nav-config";
import { useRepSpace } from "./use-rep-space";
import { listRepDues, listMembers } from "@/lib/api/rep";
import { listPolls } from "@/lib/api/polls";
import type { RepDue, SpaceMember, Poll } from "@/lib/api/types";

type CommandItem = {
  id: string;
  group: string;
  icon: HugeIcon;
  label: string;
  sublabel?: string;
  href: string;
  keywords: string;
};

/** One-line descriptions so pages read as more than a bare link. */
const PAGE_DESC: Record<string, string> = {
  "/dashboard": "Your dues and recent activity",
  "/dashboard/dues": "Dues you owe across your spaces",
  "/dashboard/transactions": "Your full money history and receipts",
  "/dashboard/referrals": "Invite friends and earn bonuses",
  "/dashboard/settings": "Profile, theme and preferences",
  "/dashboard/create-dues": "Raise and manage department dues",
  "/dashboard/circle": "Members and join requests",
  "/dashboard/polls": "Award votes, results and links",
  "/dashboard/payout": "Withdraw collected funds",
  "/dashboard/manage": "Department profile, reps and settings",
};

/** Verb-first shortcuts every student is likely to search for. */
const STUDENT_ACTIONS: Omit<CommandItem, "id">[] = [
  {
    group: "Quick actions",
    icon: Invoice01Icon,
    label: "Pay a due",
    sublabel: "Settle an outstanding due",
    href: "/dashboard/dues",
    keywords: "pay due settle outstanding bill levy",
  },
  {
    group: "Quick actions",
    icon: CreditCardIcon,
    label: "Add a card",
    sublabel: "Save a debit card for payments",
    href: "/dashboard/settings#payment-methods",
    keywords: "add card debit payment method visa mastercard",
  },
  {
    group: "Quick actions",
    icon: Download01Icon,
    label: "Download a receipt",
    sublabel: "Export a payment as PDF",
    href: "/dashboard/transactions",
    keywords: "receipt export pdf download transaction history proof",
  },
  {
    group: "Quick actions",
    icon: GiftIcon,
    label: "Invite friends",
    sublabel: "Share your referral code",
    href: "/dashboard/referrals",
    keywords: "invite refer referral code earn bonus friends share",
  },
  {
    group: "Quick actions",
    icon: Settings02Icon,
    label: "Change theme",
    sublabel: "Switch light or dark mode",
    href: "/dashboard/settings",
    keywords: "theme dark light mode appearance display",
  },
  {
    group: "Quick actions",
    icon: UserIcon,
    label: "Edit profile",
    sublabel: "Update your name, email or phone",
    href: "/dashboard/settings",
    keywords: "profile name email phone edit account details",
  },
  {
    group: "Quick actions",
    icon: Notification02Icon,
    label: "Notification settings",
    sublabel: "Choose what Duevy tells you",
    href: "/dashboard/settings",
    keywords: "notifications reminders preferences alerts email",
  },
];

/** Rep-only shortcuts. */
const REP_ACTIONS: Omit<CommandItem, "id">[] = [
  {
    group: "Quick actions",
    icon: AddInvoiceIcon,
    label: "Create a due",
    sublabel: "Raise a new due for your department",
    href: "/dashboard/create-dues",
    keywords: "create raise new due levy handout collect",
  },
  {
    group: "Quick actions",
    icon: CheckmarkSquare01Icon,
    label: "Create a vote poll",
    sublabel: "Set up award voting",
    href: "/dashboard/polls",
    keywords: "create poll vote award dinner nominee ballot election",
  },
  {
    group: "Quick actions",
    icon: Notification03Icon,
    label: "Send reminders",
    sublabel: "Nudge students who haven't paid",
    href: "/dashboard/create-dues",
    keywords: "send reminders nudge unpaid follow up chase",
  },
  {
    group: "Quick actions",
    icon: MoneySend01Icon,
    label: "Request a payout",
    sublabel: "Withdraw collected funds to your bank",
    href: "/dashboard/payout",
    keywords: "payout withdraw money bank collected funds cash out",
  },
  {
    group: "Quick actions",
    icon: Add01Icon,
    label: "Invite a co-rep",
    sublabel: "Add someone to help manage",
    href: "/dashboard/manage",
    keywords: "invite co-rep add manager department team",
  },
];

const HELP_ITEMS: Omit<CommandItem, "id">[] = [
  {
    group: "Help",
    icon: SquareLock02Icon,
    label: "Privacy policy",
    sublabel: "How your data is handled",
    href: "/privacy",
    keywords: "privacy policy data security",
  },
  {
    group: "Help",
    icon: InformationCircleIcon,
    label: "Terms of service",
    sublabel: "The rules for using Duevy",
    href: "/terms",
    keywords: "terms service conditions legal agreement",
  },
];

function withIds(items: Omit<CommandItem, "id">[], prefix: string): CommandItem[] {
  return items.map((item, i) => ({ ...item, id: `${prefix}-${i}` }));
}

function buildIndex(
  isRep: boolean,
  repData: { dues: RepDue[]; students: SpaceMember[]; polls: Poll[] },
): CommandItem[] {
  const pages = (isRep ? [...STUDENT_LINKS, ...REP_LINKS] : STUDENT_LINKS)
    // De-dupe the shared Overview link.
    .filter(
      (link, i, arr) => arr.findIndex((l) => l.href === link.href) === i,
    )
    .map((link) => ({
      id: `page-${link.href}`,
      group: "Pages",
      icon: link.icon,
      label: link.label,
      sublabel: PAGE_DESC[link.href],
      href: link.href,
      keywords: `${link.label} ${PAGE_DESC[link.href] ?? ""}`.toLowerCase(),
    }));

  const actions = withIds(
    isRep ? [...STUDENT_ACTIONS, ...REP_ACTIONS] : STUDENT_ACTIONS,
    "action",
  );
  const help = withIds(HELP_ITEMS, "help");

  if (!isRep) return [...actions, ...pages, ...help];

  const dues: CommandItem[] = repData.dues.map((due) => ({
    id: `due-${due.id}`,
    group: "Dues",
    icon: Invoice01Icon,
    label: due.title,
    sublabel: `₦${(due.amount / 100).toLocaleString("en-NG")}`,
    href: "/dashboard/create-dues",
    keywords: `${due.title} ${due.category}`.toLowerCase(),
  }));

  const students: CommandItem[] = repData.students.map((student) => ({
    id: `student-${student.id}`,
    group: "Students",
    icon: UserGroup03Icon,
    label: student.name,
    sublabel: `${student.matricNo} · ${student.level ?? ""}`,
    href: "/dashboard/circle",
    keywords: `${student.name} ${student.matricNo} ${student.email}`.toLowerCase(),
  }));

  const polls: CommandItem[] = repData.polls.map((poll) => ({
    id: `poll-${poll.id}`,
    group: "Polls",
    icon: Award01Icon,
    label: poll.title,
    sublabel: `${poll.categories.length} award${poll.categories.length === 1 ? "" : "s"}`,
    href: "/dashboard/polls",
    keywords: poll.title.toLowerCase(),
  }));

  return [...actions, ...pages, ...dues, ...students, ...polls, ...help];
}

export function CommandPalette({
  open,
  onOpenChange,
  isRep,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isRep: boolean;
}) {
  const router = useRouter();
  const repSpace = useRepSpace();
  const spaceId = repSpace?.id;
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [repData, setRepData] = useState<{
    dues: RepDue[];
    students: SpaceMember[];
    polls: Poll[];
  }>({ dues: [], students: [], polls: [] });
  const listRef = useRef<HTMLUListElement>(null);

  const index = useMemo(() => buildIndex(isRep, repData), [isRep, repData]);

  // Reset query + selection whenever the palette opens, and refresh the rep's
  // dues/students/polls so search results aren't stale from last time it was open.
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setQuery("");
      setActive(0);
      if (isRep && spaceId) {
        Promise.all([
          listRepDues(spaceId),
          listMembers(spaceId, { perPage: 50 }),
          listPolls(spaceId),
        ])
          .then(([dues, students, polls]) =>
            setRepData({ dues, students: students.data, polls }),
          )
          .catch(() => {
            // Non-fatal — the palette still works with pages/actions only.
          });
      }
    }
    onOpenChange(next);
  };

  // ⌘K / Ctrl+K toggles the palette from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        handleOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // handleOpenChange is stable enough for this listener's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onOpenChange]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Landing view: the things people reach for most, then pages.
      return index
        .filter(
          (item) => item.group === "Quick actions" || item.group === "Pages",
        )
        .slice(0, 18);
    }
    return index.filter((item) => item.keywords.includes(q)).slice(0, 12);
  }, [index, query]);

  // Ids that start a new group, so we know where to render a group header.
  const groupStarts = useMemo(() => {
    const ids = new Set<string>();
    let seen = "";
    for (const item of results) {
      if (item.group !== seen) {
        ids.add(item.id);
        seen = item.group;
      }
    }
    return ids;
  }, [results]);

  const go = (item: CommandItem) => {
    onOpenChange(false);
    router.push(item.href);
  };

  const onInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      go(results[active]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-[12%] translate-y-0 gap-0 overflow-hidden rounded-3xl border border-cloud bg-canvas p-0 sm:max-w-xl"
      >
        <DialogTitle className="sr-only">Search Duevy</DialogTitle>

        <div className="flex items-center gap-3 border-b border-cloud px-4">
          <HugeiconsIcon icon={Search01Icon} size={18} className="shrink-0 text-ink-soft" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKeyDown}
            placeholder="Search dues, students, polls, pages…"
            className="h-14 w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft"
          />
          <kbd className="hidden shrink-0 rounded-md border border-cloud bg-paper px-1.5 py-0.5 text-[10px] font-semibold text-ink-soft sm:block">
            ESC
          </kbd>
        </div>

        {results.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-sm font-semibold text-ink">No matches</p>
            <p className="mt-1 text-xs text-ink-soft">
              Try a due title, student name, matric number, or poll.
            </p>
          </div>
        ) : (
          <ul ref={listRef} className="max-h-[22rem] overflow-y-auto p-2">
            {results.map((item, i) => {
              const header = groupStarts.has(item.id) ? item.group : null;
              const isActive = i === active;
              return (
                <li key={item.id}>
                  {header && (
                    <p className="px-2 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-ink-soft first:pt-1">
                      {header}
                    </p>
                  )}
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(item)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-left transition-colors cursor-pointer ${
                      isActive ? "bg-cloud" : "hover:bg-paper"
                    }`}
                  >
                    <span
                      className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
                        isActive ? "bg-canvas text-brand" : "bg-paper text-brand"
                      }`}
                    >
                      <HugeiconsIcon icon={item.icon} size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">
                        {item.label}
                      </span>
                      {item.sublabel && (
                        <span className="block truncate text-xs text-ink-soft">
                          {item.sublabel}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
