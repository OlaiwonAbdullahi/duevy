export type PollStatus = "active" | "draft" | "closed";

export type Nominee = {
  id: string;
  name: string;
  votes: number;
};

/** One award being voted on, e.g. "Best Dressed", with its nominees. */
export type PollCategory = {
  id: string;
  title: string;
  nominees: Nominee[];
};

export type Poll = {
  id: string;
  title: string;
  description: string;
  /** yyyy-mm-dd voting deadline. */
  deadline: string;
  status: PollStatus;
  /** When true, only verified department members can vote (one vote each). */
  membersOnly: boolean;
  /** When true, each vote must be paid for before it counts. */
  paid: boolean;
  /** Price of a single vote, in naira. Only meaningful when `paid` is true. */
  amountPerVote: number;
  categories: PollCategory[];
  /** Slug used in the shareable voting link. */
  slug: string;
};

/** The editable slice a rep fills in when building or editing a poll. */
export type PollDraft = Pick<
  Poll,
  | "title"
  | "description"
  | "deadline"
  | "membersOnly"
  | "paid"
  | "amountPerVote"
  | "categories"
>;
