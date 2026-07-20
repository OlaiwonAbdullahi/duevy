/** What kind of body a space represents — drives the emblem glyph + label. */
export type SpaceKind = "department" | "association" | "faculty" | "club";

/**
 * How the viewer relates to a space. `member` is the student's own department
 * (they were enrolled into it); `guest` is a body they chose to pay at — e.g. a
 * sister association's dinner — without being a full member.
 */
export type SpaceMembership = "member" | "guest";

export type Space = {
  id: string;
  name: string; // "Computer Science Students' Association"
  short: string; // "CSSA" — monogram shown on the emblem
  kind: SpaceKind;
  membership: SpaceMembership;
  /** Slug for the emblem palette (see EMBLEM_PALETTES in data.ts). */
  hue: EmblemHue;
  memberCount: number;
};

export type DueStatus = "unpaid" | "paid" | "overdue";

export type DueCategory = "levy" | "dinner" | "handout" | "welfare" | "sport";

export type Due = {
  id: string;
  spaceId: string;
  title: string;
  note: string;
  amount: number;
  /** ISO date the due is expected by. */
  dueDate: string;
  status: DueStatus;
  category: DueCategory;
};

export type EmblemHue = "emerald" | "indigo" | "amber" | "rose" | "slate";

/**
 * A department a student can join by code — surfaced only after they enter the
 * matching code on the "Join a department" search. Carries the code, a short
 * blurb for the preview, and any starter dues that follow the student in once
 * they join.
 */
export type JoinableDepartment = Space & {
  code: string;
  about: string;
  faculty: string;
  dues: Due[];
};

/** How a due gets settled from the pay modal. */
export type PayMethod = "card" | "online";
