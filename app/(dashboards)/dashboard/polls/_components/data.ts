import type { Nominee, Poll, PollCategory, PollStatus } from "./types";

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

export function slugify(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "poll"
  );
}

export function totalVotes(poll: Poll) {
  return poll.categories.reduce(
    (sum, category) =>
      sum + category.nominees.reduce((s, nominee) => s + nominee.votes, 0),
    0,
  );
}

/** Money raised by a paid poll — votes × price. Zero for free polls. */
export function pollRevenue(poll: Poll) {
  return poll.paid ? totalVotes(poll) * poll.amountPerVote : 0;
}

export type LeaderboardEntry = {
  name: string;
  votes: number;
  /** How many award categories this person is nominated in. */
  awards: number;
};

/**
 * Overall ranking across the whole poll: total votes each nominee has pulled in,
 * summed across every award they appear in. Highest first.
 */
export function pollLeaderboard(poll: Poll): LeaderboardEntry[] {
  const tally = new Map<string, LeaderboardEntry>();
  for (const category of poll.categories) {
    for (const nominee of category.nominees) {
      const key = nominee.name.trim();
      if (!key) continue;
      const entry = tally.get(key) ?? { name: key, votes: 0, awards: 0 };
      entry.votes += nominee.votes;
      entry.awards += 1;
      tally.set(key, entry);
    }
  }
  return [...tally.values()].sort((a, b) => b.votes - a.votes);
}

/* ---- Builder factories: fresh rows for the form's dynamic sections. ---- */

export function newNominee(name = ""): Nominee {
  return { id: crypto.randomUUID(), name, votes: 0 };
}

export function newCategory(): PollCategory {
  return {
    id: crypto.randomUUID(),
    title: "",
    nominees: [newNominee(), newNominee()],
  };
}

/* ---- Seed polls. Mock until the API lands. ---- */

export const INITIAL_POLLS: Poll[] = [
  {
    id: "poll-1",
    title: "CSSA Dinner & Awards 2026",
    description:
      "Vote for this session's standout students across every award category. Winners are announced at the dinner night.",
    deadline: "2026-08-01",
    status: "active",
    membersOnly: true,
    paid: true,
    amountPerVote: 100,
    slug: "cssa-dinner-awards-2026",
    categories: [
      {
        id: "cat-1",
        title: "Most Influential Student",
        nominees: [
          { id: "n1", name: "Amina Bello", votes: 82 },
          { id: "n2", name: "Daniel Okafor", votes: 64 },
          { id: "n3", name: "Rukayat Yusuf", votes: 45 },
        ],
      },
      {
        id: "cat-2",
        title: "Best Dressed",
        nominees: [
          { id: "n4", name: "Ifeoma Nwosu", votes: 71 },
          { id: "n5", name: "Malik Hassan", votes: 58 },
        ],
      },
      {
        id: "cat-3",
        title: "Most Likely to Succeed",
        nominees: [
          { id: "n6", name: "Tobi Adebayo", votes: 39 },
          { id: "n7", name: "Grace Etim", votes: 66 },
          { id: "n8", name: "Samuel Udo", votes: 22 },
        ],
      },
    ],
  },
  {
    id: "poll-2",
    title: "Course Rep of the Year",
    description: "A quick single-award vote for the hardest-working course rep.",
    deadline: "2026-07-20",
    status: "draft",
    membersOnly: true,
    paid: false,
    amountPerVote: 0,
    slug: "course-rep-of-the-year",
    categories: [
      {
        id: "cat-4",
        title: "Course Rep of the Year",
        nominees: [
          { id: "n9", name: "Chidi Okwu", votes: 0 },
          { id: "n10", name: "Zainab Musa", votes: 0 },
        ],
      },
    ],
  },
];
