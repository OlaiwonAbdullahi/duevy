/**
 * The demo world. One department, two signed-in-able accounts, and enough
 * surrounding data (members, dues, payments, payouts, polls, notifications) that
 * every screen has something real to show.
 *
 * Everything is built relative to "now" at first load, so the demo never looks
 * stale no matter when it is presented.
 */
import type {
  AuditEntry,
  BankAccount,
  Dispute,
  DueCategory,
  NotificationPreferences,
  NotificationTone,
  Poll,
  Referral,
  Session,
  SpaceRep,
  Transaction,
  TxnType,
  User,
} from "@/lib/api/types";
import { computeCharge } from "./money";

export const DEMO_STATE_VERSION = 1;

export const SPACE_ID = "spc_cssa_unilag";
export const REP_ID = "usr_tunde_okafor";
export const STUDENT_ID = "usr_aisha_bello";
export const CO_REP_ID = "usr_chidi_nwosu";

export type DemoUser = Omit<User, "spaces"> & {
  /** Only ever compared against, never sent anywhere. */
  password: string | null;
  membership: "member" | "guest" | "lead" | "co" | null;
  joinedAt: string;
};

export type DemoDueStatus = "draft" | "active" | "closed";

export type DemoDue = {
  id: string;
  spaceId: string;
  title: string;
  note: string | null;
  /** Face amount in kobo — what the space receives. */
  amount: number;
  dueDate: string;
  category: DueCategory;
  status: DemoDueStatus;
  allowGuests: boolean;
  assignedRepId: string | null;
  createdAt: string;
};

export type DemoPayment = {
  id: string;
  userId: string;
  dueId: string;
  reference: string;
  amountPaid: number;
  processingFee: number;
  duevyFee: number;
  netToSpace: number;
  paidAt: string;
};

export type DemoPayoutDecision = {
  repUserId: string;
  repName: string;
  decision: "approved" | "rejected";
  decidedAt: string;
};

export type DemoPayout = {
  id: string;
  dueId: string | null;
  amount: number;
  reference: string;
  status: "pending_approval" | "processing" | "completed" | "failed" | "cancelled";
  account: string;
  note: string | null;
  requestedById: string | null;
  requestedAt: string;
  cancelledAt: string | null;
  settledAt: string | null;
  failureReason: string | null;
  decisions: DemoPayoutDecision[];
};

export type DemoNotification = {
  id: string;
  userId: string;
  kind: string;
  tone: NotificationTone;
  title: string;
  detail: string;
  href: string | null;
  read: boolean;
  createdAt: string;
};

export type DemoTransaction = Transaction & { userId: string; detail?: string };

/** A payment parked at the simulated checkout, keyed by its reference. */
export type DemoCheckout = {
  reference: string;
  userId: string;
  kind: "due" | "vote";
  dueIds: string[];
  pollSlug: string | null;
  selections: Array<{ categoryId: string; nomineeId: string; quantity: number }>;
  amount: number;
  createdAt: string;
  status: "pending" | "completed" | "failed";
};

export type DemoAssistantMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent: string | null;
  confidence: number | null;
  createdAt: string;
};

export type DemoConversation = {
  id: string;
  userId: string;
  preview: string;
  createdAt: string;
  updatedAt: string;
  messages: DemoAssistantMessage[];
};

export type DemoState = {
  version: number;
  /** null = signed out. */
  currentUserId: string | null;
  users: DemoUser[];
  space: {
    id: string;
    name: string;
    short: string;
    kind: "department" | "association" | "faculty" | "club";
    hue: "emerald" | "indigo" | "amber" | "rose" | "slate";
    theme: "emerald" | "ocean" | "royal" | "crimson" | "tangerine";
    about: string;
    faculty: string;
    school: string;
    joinCode: string;
    createdAt: string;
    archived: boolean;
  };
  dues: DemoDue[];
  payments: DemoPayment[];
  reps: SpaceRep[];
  payouts: DemoPayout[];
  polls: Poll[];
  /** Vote receipts, so a voter's `remaining` count is honest across reloads. */
  votes: Array<{ userId: string; pollId: string; categoryId: string; quantity: number }>;
  transactions: DemoTransaction[];
  notifications: DemoNotification[];
  auditLog: AuditEntry[];
  bankAccount: BankAccount | null;
  notificationPrefs: Record<string, NotificationPreferences>;
  sessions: Session[];
  checkouts: DemoCheckout[];
  disputes: Dispute[];
  conversations: DemoConversation[];
  referrals: Referral[];
};

// ---------------------------------------------------------------------------
// Date helpers — everything is relative to first load.
// ---------------------------------------------------------------------------

const DAY = 24 * 60 * 60 * 1000;

function iso(offsetDays: number, hour = 10): string {
  const d = new Date(Date.now() + offsetDays * DAY);
  d.setHours(hour, Math.round(Math.abs(offsetDays) * 7) % 60, 0, 0);
  return d.toISOString();
}

// ---------------------------------------------------------------------------
// The member roster. A real-feeling cohort so collections and the circle table
// aren't three rows of filler.
// ---------------------------------------------------------------------------

const ROSTER: Array<[string, string]> = [
  ["Aisha Bello", "300"],
  ["Chidi Nwosu", "400"],
  ["Fatima Yusuf", "300"],
  ["Emeka Obi", "200"],
  ["Ngozi Adeyemi", "300"],
  ["Ibrahim Musa", "400"],
  ["Temitope Adeleke", "200"],
  ["Blessing Okonkwo", "300"],
  ["Yusuf Abdullahi", "100"],
  ["Chioma Eze", "400"],
  ["Segun Afolabi", "300"],
  ["Halima Sani", "200"],
  ["Daniel Etim", "300"],
  ["Amaka Onyeka", "100"],
  ["Kola Bamidele", "400"],
  ["Zainab Lawal", "300"],
  ["Precious Igwe", "200"],
  ["Tobiloba Ajayi", "300"],
  ["Musa Danjuma", "400"],
  ["Grace Uduak", "100"],
  ["Olamide Salami", "300"],
  ["Hauwa Bala", "200"],
  ["Kelechi Anyanwu", "400"],
  ["Damilola Ogunleye", "300"],
  ["Sadiq Aliyu", "100"],
  ["Nkechi Okafor", "300"],
  ["Bukola Adewale", "200"],
  ["Uche Nnamdi", "400"],
  ["Rukayat Balogun", "300"],
  ["Peter Akpan", "100"],
  ["Folake Oyelaran", "300"],
  ["Abubakar Garba", "200"],
  ["Adaeze Chukwu", "400"],
  ["Seyi Oladipo", "300"],
  ["Maryam Idris", "100"],
  ["Victor Ekanem", "300"],
  ["Titilayo Falade", "200"],
  ["Obinna Madu", "400"],
  ["Khadija Umar", "300"],
  ["Samuel Oyebode", "100"],
  ["Ifeoma Nwachukwu", "300"],
  ["Bashir Sule", "200"],
  ["Tunde Okafor", "400"],
  ["Eniola Sofoluwe", "300"],
  ["Gbenga Adigun", "200"],
  ["Rashida Mohammed", "400"],
  ["Chinedu Agu", "300"],
  ["Morenike Ojo", "100"],
];

function slugId(name: string): string {
  return "usr_" + name.toLowerCase().replace(/[^a-z]+/g, "_");
}

function matricFor(level: string, index: number): string {
  const year: Record<string, string> = { "100": "24", "200": "23", "300": "22", "400": "21" };
  return `${year[level] ?? "22"}0805${String(index + 11).padStart(3, "0")}`;
}

/**
 * Stable pseudo-random in [0,1) from a string. Keeps "who has paid" identical on
 * every load, so the same demo tells the same story twice.
 */
function hash01(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

// ---------------------------------------------------------------------------

function buildUsers(): DemoUser[] {
  return ROSTER.map(([name, level], i) => {
    const isRep = name === "Tunde Okafor";
    const isStudent = name === "Aisha Bello";
    const isCoRep = name === "Chidi Nwosu";
    const id = isRep ? REP_ID : isStudent ? STUDENT_ID : isCoRep ? CO_REP_ID : slugId(name);
    const handle = name.toLowerCase().replace(/[^a-z]+/g, ".");
    return {
      id,
      name,
      email: isRep
        ? "rep@duevy.demo"
        : isStudent
          ? "student@duevy.demo"
          : `${handle}@student.unilag.edu.ng`,
      emailVerified: true,
      phone: isRep ? "+2348012345678" : isStudent ? "+2348098765432" : null,
      avatarUrl: null,
      role: isRep ? ("rep" as const) : ("student" as const),
      repApplicationStatus: isRep ? ("approved" as const) : ("none" as const),
      matricNo: isRep ? "190802044" : matricFor(level, i),
      level,
      referralCode: isRep ? "TUNDEO223" : isStudent ? "AISHAB455" : null,
      createdAt: iso(-180 + i),
      password: isRep || isStudent ? "Demo1234!" : null,
      membership: isRep ? ("lead" as const) : isCoRep ? ("co" as const) : ("member" as const),
      joinedAt: iso(-120 + Math.floor(i * 2.2)),
    };
  });
}

function buildDues(): DemoDue[] {
  return [
    {
      id: "due_dept_levy",
      spaceId: SPACE_ID,
      title: "Departmental Dues 2025/26",
      note: "Covers lab maintenance, the departmental library, and student welfare for the session.",
      amount: 750_000,
      dueDate: iso(12),
      category: "levy",
      status: "active",
      allowGuests: false,
      assignedRepId: REP_ID,
      createdAt: iso(-34),
    },
    {
      id: "due_dinner",
      spaceId: SPACE_ID,
      title: "CSSA Dinner Night",
      note: "Ticket for the end-of-session dinner at the Main Auditorium. Covers meal and souvenir.",
      amount: 1_000_000,
      dueDate: iso(26),
      category: "dinner",
      status: "active",
      allowGuests: true,
      assignedRepId: CO_REP_ID,
      createdAt: iso(-19),
    },
    {
      id: "due_handout",
      spaceId: SPACE_ID,
      title: "Data Structures Handout",
      note: "CSC 301 compiled lecture notes and past questions.",
      amount: 250_000,
      dueDate: iso(4),
      category: "handout",
      status: "active",
      allowGuests: false,
      assignedRepId: REP_ID,
      createdAt: iso(-12),
    },
    {
      id: "due_welfare",
      spaceId: SPACE_ID,
      title: "Welfare Contribution",
      note: "Support fund for members facing medical or financial emergencies.",
      amount: 150_000,
      dueDate: iso(-8),
      category: "welfare",
      status: "closed",
      allowGuests: false,
      assignedRepId: REP_ID,
      createdAt: iso(-56),
    },
    {
      id: "due_sports",
      spaceId: SPACE_ID,
      title: "Inter-Faculty Sports Levy",
      note: "Kits and logistics for the faculty games.",
      amount: 300_000,
      dueDate: iso(38),
      category: "sport",
      status: "draft",
      allowGuests: false,
      assignedRepId: REP_ID,
      createdAt: iso(-2),
    },
  ];
}

/**
 * Who has paid what. Deterministic per (due, user) so collection rates are
 * stable — and hand-pinned for Aisha so the student demo opens with exactly one
 * big unpaid due to settle live, plus real history behind it.
 */
function buildPayments(users: DemoUser[], dues: DemoDue[]): DemoPayment[] {
  const PINNED: Record<string, Record<string, boolean>> = {
    [STUDENT_ID]: {
      due_dept_levy: false,
      due_dinner: false,
      due_handout: true,
      due_welfare: true,
    },
    [REP_ID]: { due_dept_levy: true, due_dinner: true, due_handout: true, due_welfare: true },
  };
  // Target collection rate per due — what the rep's dashboard should read.
  const RATE: Record<string, number> = {
    due_dept_levy: 0.62,
    due_dinner: 0.34,
    due_handout: 0.77,
    due_welfare: 0.91,
  };

  const payments: DemoPayment[] = [];
  for (const due of dues) {
    if (due.status === "draft") continue;
    for (const user of users) {
      const pinned = PINNED[user.id]?.[due.id];
      const paid = pinned ?? hash01(`${due.id}:${user.id}`) < (RATE[due.id] ?? 0.5);
      if (!paid) continue;
      const charge = computeCharge(due.amount);
      const daysAgo = -Math.round(1 + hash01(`t:${due.id}:${user.id}`) * 26);
      const a = String(Math.floor(hash01(`r:${due.id}:${user.id}`) * 9000) + 1000);
      const b = String(Math.floor(hash01(`s:${due.id}:${user.id}`) * 9000) + 1000);
      payments.push({
        id: `pay_${due.id}_${user.id}`,
        userId: user.id,
        dueId: due.id,
        reference: `DVY-${a}-${b}`,
        amountPaid: charge.totalCharged,
        processingFee: charge.processingFee,
        duevyFee: charge.duevyFee,
        netToSpace: charge.netToSpace,
        paidAt: iso(daysAgo, 9 + Math.floor(hash01(`h:${due.id}:${user.id}`) * 9)),
      });
    }
  }
  return payments;
}

function buildTransactions(payments: DemoPayment[], dues: DemoDue[]): DemoTransaction[] {
  const byId = new Map(dues.map((d) => [d.id, d]));
  const txns: DemoTransaction[] = payments
    .filter((p) => p.userId === STUDENT_ID || p.userId === REP_ID)
    .map((p) => ({
      id: `txn_${p.id}`,
      userId: p.userId,
      type: "due" as TxnType,
      method: "Bank transfer",
      title: byId.get(p.dueId)?.title ?? "Due payment",
      detail: "Computer Science Student Association",
      amount: -p.amountPaid,
      status: "completed" as const,
      reference: p.reference,
      createdAt: p.paidAt,
    }));

  txns.push({
    id: "txn_vote_aisha",
    userId: STUDENT_ID,
    type: "vote",
    method: "Card",
    title: "Best Coder Award — 2 votes",
    detail: "CSSA Awards",
    amount: -20_000,
    status: "completed",
    reference: "DVY-4410-8802",
    createdAt: iso(-15, 20),
  });

  return txns.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function buildPolls(): Poll[] {
  const nominee = (id: string, name: string, votes: number, bio: string, code: string) => ({
    id,
    name,
    votes,
    imageUrl: null,
    bio,
    code,
  });

  return [
    {
      id: "poll_awards",
      spaceId: SPACE_ID,
      title: "CSSA Awards Night 2026",
      description:
        "Vote for the people who carried Computer Science this session. ₦100 a vote — proceeds fund the awards night.",
      deadline: iso(9, 23),
      status: "active",
      membersOnly: false,
      paid: true,
      amountPerVote: 10_000,
      slug: "cssa-awards-night-2026",
      coverImageUrl: null,
      themeColor: "ocean",
      totalVotes: 412,
      revenue: 4_120_000,
      categories: [
        {
          id: "cat_personality",
          title: "Personality of the Year",
          imageUrl: null,
          nominees: [
            nominee("nom_p1", "Ngozi Adeyemi", 84, "300L · Class governor", "01"),
            nominee("nom_p2", "Emeka Obi", 61, "200L · Volunteer lead", "02"),
            nominee("nom_p3", "Zainab Lawal", 47, "300L · Debate captain", "03"),
          ],
        },
        {
          id: "cat_coder",
          title: "Best Coder",
          imageUrl: null,
          nominees: [
            nominee("nom_c1", "Chidi Nwosu", 72, "400L · Backend, 3 hackathon wins", "04"),
            nominee("nom_c2", "Fatima Yusuf", 58, "300L · ML research assistant", "05"),
            nominee("nom_c3", "Segun Afolabi", 30, "300L · Open-source maintainer", "06"),
          ],
        },
        {
          id: "cat_lecturer",
          title: "Most Supportive Lecturer",
          imageUrl: null,
          nominees: [
            nominee("nom_l1", "Dr. Adebayo", 41, "Algorithms", "07"),
            nominee("nom_l2", "Prof. Okeke", 19, "Operating Systems", "08"),
          ],
        },
      ],
    },
    {
      id: "poll_coder",
      spaceId: SPACE_ID,
      title: "Best Coder Award",
      description: "Vote for CSSA's most impressive coder this session.",
      deadline: iso(-6, 23),
      status: "closed",
      membersOnly: true,
      paid: true,
      amountPerVote: 5_000,
      slug: "best-coder-award-cssa",
      coverImageUrl: null,
      themeColor: "emerald",
      totalVotes: 96,
      revenue: 480_000,
      categories: [
        {
          id: "cat_overall",
          title: "Overall Winner",
          imageUrl: null,
          nominees: [
            nominee("nom_o1", "Aisha Bello", 54, "300L · Full-stack", "01"),
            nominee("nom_o2", "Tunde Okafor", 42, "400L · Systems", "02"),
          ],
        },
      ],
    },
    {
      id: "poll_freshers",
      spaceId: SPACE_ID,
      title: "Freshers' Welcome Theme",
      description: "Help us pick the theme for this year's freshers' welcome.",
      deadline: iso(21, 23),
      status: "draft",
      membersOnly: true,
      paid: false,
      amountPerVote: 0,
      slug: "freshers-welcome-theme",
      coverImageUrl: null,
      themeColor: "royal",
      totalVotes: 0,
      revenue: 0,
      categories: [
        {
          id: "cat_theme",
          title: "Theme",
          imageUrl: null,
          nominees: [
            nominee("nom_t1", "Neon Campus", 0, "", "01"),
            nominee("nom_t2", "Black & Gold", 0, "", "02"),
            nominee("nom_t3", "Retro Arcade", 0, "", "03"),
          ],
        },
      ],
    },
  ];
}

function buildNotifications(): DemoNotification[] {
  return [
    {
      id: "ntf_r1",
      userId: REP_ID,
      kind: "payment_received",
      tone: "brand",
      title: "Payment received",
      detail: 'Ngozi Adeyemi paid ₦7,725.00 for "Departmental Dues 2025/26".',
      href: "/dashboard/create-dues",
      read: false,
      createdAt: iso(-0.2, 14),
    },
    {
      id: "ntf_r2",
      userId: REP_ID,
      kind: "member_joined",
      tone: "brand",
      title: "3 new members",
      detail: "Morenike Ojo, Samuel Oyebode and Maryam Idris joined with your join code.",
      href: "/dashboard/circle",
      read: false,
      createdAt: iso(-1, 11),
    },
    {
      id: "ntf_r3",
      userId: REP_ID,
      kind: "payout_settled",
      tone: "brand",
      title: "Payout settled",
      detail: "₦250,000.00 landed in GTBank •••• 6789.",
      href: "/dashboard/payout",
      read: true,
      createdAt: iso(-6, 16),
    },
    {
      id: "ntf_s1",
      userId: STUDENT_ID,
      kind: "due_reminder",
      tone: "amber",
      title: "Due in 4 days",
      detail: '"Data Structures Handout" (₦2,575.00) closes on Friday.',
      href: "/dashboard/dues",
      read: false,
      createdAt: iso(-0.4, 9),
    },
    {
      id: "ntf_s2",
      userId: STUDENT_ID,
      kind: "due_published",
      tone: "brand",
      title: "New due from CSSA",
      detail: '"Departmental Dues 2025/26" — ₦7,725.00 payable.',
      href: "/dashboard/dues",
      read: false,
      createdAt: iso(-2, 12),
    },
    {
      id: "ntf_s3",
      userId: STUDENT_ID,
      kind: "payment_receipt",
      tone: "brand",
      title: "Payment confirmed",
      detail: 'Your ₦1,545.00 for "Welfare Contribution" was received.',
      href: "/dashboard/transactions",
      read: true,
      createdAt: iso(-9, 15),
    },
  ];
}

function buildAuditLog(): AuditEntry[] {
  const rows: Array<[string, string, string, "lead" | "co", number]> = [
    [
      "due.published",
      'Published "Departmental Dues 2025/26" (₦7,500.00)',
      "Tunde Okafor",
      "lead",
      -34,
    ],
    ["due.published", 'Published "CSSA Dinner Night" (₦10,000.00)', "Chidi Nwosu", "co", -19],
    ["member.removed", "Removed a duplicate member record", "Tunde Okafor", "lead", -15],
    ["payout.requested", "Requested a payout of ₦250,000.00", "Tunde Okafor", "lead", -7],
    ["payout.approved", "Approved payout PAY-2026-0001", "Chidi Nwosu", "co", -7],
    [
      "due.published",
      'Published "Data Structures Handout" (₦2,500.00)',
      "Tunde Okafor",
      "lead",
      -12,
    ],
    [
      "rep.invited",
      "Invited chidi.nwosu@student.unilag.edu.ng as a co-rep",
      "Tunde Okafor",
      "lead",
      -48,
    ],
    ["space.updated", "Updated the department profile", "Tunde Okafor", "lead", -52],
  ];
  return rows
    .map(([action, description, name, role, days], i) => ({
      id: `aud_${i}`,
      action,
      description,
      actor: { id: name === "Tunde Okafor" ? REP_ID : CO_REP_ID, name, role },
      createdAt: iso(days, 10 + i),
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

const DEFAULT_PREFS: NotificationPreferences = {
  email: { dueReminders: true, paymentReceipts: true },
  push: { dueReminders: true, payments: true, circleActivity: false },
};

export function createInitialState(): DemoState {
  const users = buildUsers();
  const dues = buildDues();
  const payments = buildPayments(users, dues);

  return {
    version: DEMO_STATE_VERSION,
    currentUserId: null,
    users,
    space: {
      id: SPACE_ID,
      name: "Computer Science Student Association",
      short: "CSSA",
      kind: "association",
      hue: "indigo",
      theme: "ocean",
      about:
        "The umbrella body for Computer Science undergraduates — dues, events, and departmental news.",
      faculty: "Physical Sciences",
      school: "University of Lagos",
      joinCode: "CSSA-7F2K",
      createdAt: iso(-400),
      archived: false,
    },
    dues,
    payments,
    reps: [
      { id: REP_ID, name: "Tunde Okafor", email: "rep@duevy.demo", role: "lead" },
      { id: CO_REP_ID, name: "Chidi Nwosu", email: "chidi.nwosu@student.unilag.edu.ng", role: "co" },
    ],
    payouts: [
      {
        id: "pyt_0001",
        dueId: null,
        amount: 250_000,
        reference: "PAY-2026-0001",
        status: "completed",
        account: "GTBank •••• 6789",
        note: "Lab equipment deposit",
        requestedById: REP_ID,
        requestedAt: iso(-7, 10),
        cancelledAt: null,
        settledAt: iso(-6, 16),
        failureReason: null,
        decisions: [
          {
            repUserId: REP_ID,
            repName: "Tunde Okafor",
            decision: "approved",
            decidedAt: iso(-7, 10),
          },
          {
            repUserId: CO_REP_ID,
            repName: "Chidi Nwosu",
            decision: "approved",
            decidedAt: iso(-7, 13),
          },
        ],
      },
      {
        id: "pyt_0002",
        dueId: "due_handout",
        amount: 80_000,
        reference: "PAY-2026-0002",
        status: "completed",
        account: "GTBank •••• 6789",
        note: "Handout printing",
        requestedById: CO_REP_ID,
        requestedAt: iso(-21, 11),
        cancelledAt: null,
        settledAt: iso(-20, 9),
        failureReason: null,
        decisions: [
          {
            repUserId: CO_REP_ID,
            repName: "Chidi Nwosu",
            decision: "approved",
            decidedAt: iso(-21, 11),
          },
          {
            repUserId: REP_ID,
            repName: "Tunde Okafor",
            decision: "approved",
            decidedAt: iso(-21, 15),
          },
        ],
      },
    ],
    polls: buildPolls(),
    votes: [{ userId: STUDENT_ID, pollId: "poll_coder", categoryId: "cat_overall", quantity: 2 }],
    transactions: buildTransactions(payments, dues),
    notifications: buildNotifications(),
    auditLog: buildAuditLog(),
    bankAccount: {
      bankCode: "058",
      bankName: "Guaranty Trust Bank",
      accountNumber: "0123456789",
      accountName: "CSSA UNILAG",
    },
    notificationPrefs: {
      [REP_ID]: DEFAULT_PREFS,
      [STUDENT_ID]: DEFAULT_PREFS,
    },
    sessions: [
      {
        id: "ses_current",
        device: "Chrome on Windows",
        ip: "102.89.34.12",
        lastSeenAt: new Date().toISOString(),
        current: true,
      },
      {
        id: "ses_phone",
        device: "Safari on iPhone",
        ip: "197.210.64.8",
        lastSeenAt: iso(-3, 21),
        current: false,
      },
    ],
    checkouts: [],
    disputes: [],
    conversations: [],
    referrals: [
      { id: "ref_1", name: "Bola Adeniyi", status: "paid", reward: 100_000, date: iso(-24) },
      { id: "ref_2", name: "Sola Martins", status: "joined", reward: 0, date: iso(-11) },
      { id: "ref_3", name: "Ijeoma Nkemdirim", status: "pending", reward: 0, date: iso(-4) },
    ],
  };
}
