import type { EditorCategory, EditorNominee, Poll, PollStatus } from "./types";

export { naira } from "../../create-dues/_components/data";

export const POLL_STATUS_META: Record<
  PollStatus,
  { label: string; className: string }
> = {
  active: { label: "Live", className: "bg-cloud text-brand" },
  draft: { label: "Draft", className: "bg-paper text-ink-soft" },
  closed: { label: "Closed", className: "bg-amber-100 text-amber-700" },
};

/** Base for every voting link. Students open this to cast their vote. */
export const VOTE_BASE_URL = "https://duevy.app/vote";

export function voteLink(slug: string) {
  return `${VOTE_BASE_URL}/${slug}`;
}

export type LeaderboardEntry = {
  name: string;
  votes: number;
  /** How many award categories this person is nominated in. */
  awards: number;
};

/**
 * Overall ranking across the whole poll: total votes each nominee has pulled in,
 * summed across every award they appear in. Highest first. Not provided
 * directly by the API (which only rolls up per-category tallies), so this is
 * derived client-side.
 */
export function pollLeaderboard(poll: Poll): LeaderboardEntry[] {
  const tally = new Map<string, LeaderboardEntry>();
  for (const category of poll.categories) {
    for (const nominee of category.nominees) {
      const key = nominee.name.trim();
      if (!key) continue;
      const entry = tally.get(key) ?? { name: key, votes: 0, awards: 0 };
      entry.votes += nominee.votes ?? 0;
      entry.awards += 1;
      tally.set(key, entry);
    }
  }
  return [...tally.values()].sort((a, b) => b.votes - a.votes);
}

/* ---- Builder factories: fresh rows for the form's dynamic sections. ---- */

export function newNominee(name = ""): EditorNominee {
  return { id: crypto.randomUUID(), name };
}

export function newCategory(): EditorCategory {
  return {
    id: crypto.randomUUID(),
    title: "",
    nominees: [newNominee(), newNominee()],
  };
}
