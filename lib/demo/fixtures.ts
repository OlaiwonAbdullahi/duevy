import type {
  AuditEntry,
  Beneficiary,
  KycState,
  NotificationItem,
  NotificationPreferences,
  Payout,
  Poll,
  ReferralsResponse,
  RepDue,
  Session,
  Space,
  SpaceMember,
  SpaceRep,
  Transaction,
  User,
} from "@/lib/api/types";
import { DEMO_USER_ID } from "./mode";

/**
 * Sample data for demo mode: one lead rep running a Computer Science
 * department of 48 students. Built once per page load and mutated in place,
 * so actions taken during a demo (creating a due, adding a beneficiary, …)
 * show up until the tab reloads. All money is in kobo.
 */

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number, hour = 10) => {
  const d = new Date(Date.now() - n * DAY);
  d.setHours(hour, (n * 17) % 60, 0, 0);
  return d.toISOString();
};
const daysFromNow = (n: number) => daysAgo(-n, 23);

export const SPACE_ID = "demo-space-csc";
const CO_REP_A = "demo-user-chidinma";
const CO_REP_B = "demo-user-ibrahim";

const FIRST = [
  "Adaeze", "Babatunde", "Chiamaka", "Damilola", "Emeka", "Fatima", "Gbenga", "Halima",
  "Ifeoma", "Jide", "Kemi", "Lanre", "Maryam", "Nnamdi", "Oluwaseun", "Precious",
  "Rukayat", "Segun", "Temitope", "Uchenna", "Victoria", "Yusuf", "Zainab", "Abiodun",
  "Blessing", "Chukwudi", "Deborah", "Ebuka", "Folake", "Godwin", "Hauwa", "Ikenna",
  "Joy", "Kayode", "Lilian", "Mubarak", "Ngozi", "Obinna", "Peace", "Rotimi",
  "Sade", "Tunde", "Ugochi", "Wale", "Yetunde", "Aisha", "Bolaji", "Chisom",
];
const LAST = [
  "Okonkwo", "Adeyemi", "Bello", "Eze", "Ogunleye", "Abubakar", "Nwosu", "Balogun",
  "Okafor", "Lawal", "Obi", "Afolabi", "Danjuma", "Uche", "Akinola", "Ibe",
];

const LEVELS = ["300", "300", "300", "200", "400"];

function emailFor(name: string) {
  return `${name.toLowerCase().replace(/\s+/g, ".")}@student.unilag.edu.ng`;
}

const members: SpaceMember[] = FIRST.map((first, i) => {
  const name = `${first} ${LAST[(i * 5) % LAST.length]}`;
  return {
    id: `demo-member-${i + 1}`,
    name,
    matricNo: `1908050${String(i + 11).padStart(2, "0")}`,
    level: LEVELS[i % LEVELS.length],
    email: emailFor(name),
    joinedAt: daysAgo(70 - i, 9 + (i % 8)),
  };
});

export const DEMO_USER: User = {
  id: DEMO_USER_ID,
  name: "Tolu Adebayo",
  email: "tolu.adebayo@student.unilag.edu.ng",
  emailVerified: true,
  phone: "+2348031234567",
  avatarUrl: null,
  role: "rep",
  isRep: true,
  adminSubRole: null,
  institution: "University of Lagos",
  kycStatus: "verified",
  repApplicationStatus: "approved",
  matricNo: "190805010",
  level: "300",
  referralCode: "TOLU-CSC",
  spaces: [
    {
      id: SPACE_ID,
      name: "Department of Computer Science",
      short: "CSC",
      kind: "department",
      hue: "emerald",
      joinCode: "CSC7Q2",
      membership: "rep",
    },
  ],
  createdAt: daysAgo(90),
};

const space: Space = {
  id: SPACE_ID,
  name: "Department of Computer Science",
  short: "CSC",
  kind: "department",
  hue: "emerald",
  theme: "emerald",
  about: "Official dues and levies for CSC students, collected and tracked in one place.",
  faculty: "Faculty of Science",
  school: "University of Lagos",
  memberCount: members.length,
  membership: "rep",
  createdAt: daysAgo(90),
};

type DemoDue = RepDue & {
  /** Member ids who've paid, in payment order. */
  paidBy: string[];
  guests: { id: string; name: string; email: string; matricNo: string | null; paidAt: string; reference: string }[];
};

function due(
  i: number,
  partial: Pick<RepDue, "title" | "amount" | "type" | "status" | "dueDate"> &
    Partial<RepDue> & { paid: number; guestCount?: number; ageDays: number },
): DemoDue {
  const { paid, guestCount = 0, ageDays, ...rest } = partial;
  // A deterministic but scattered set of payers, so rosters don't look sorted.
  const order = members
    .map((m, j) => ({ id: m.id, rank: (j * 7 + i * 13) % members.length }))
    .sort((a, b) => a.rank - b.rank);
  const guests = Array.from({ length: guestCount }, (_, g) => {
    const name = `${FIRST[(g * 11 + 3) % FIRST.length]} ${LAST[(g * 3 + 7) % LAST.length]}`;
    return {
      id: `demo-guest-${i}-${g}`,
      name,
      email: emailFor(name).replace("student.unilag", "gmail").replace(".edu.ng", ".com"),
      matricNo: null,
      paidAt: daysAgo(Math.max(1, ageDays - 3 - g * 2), 14),
      reference: `DVY-G${i}${g}${(48213 + g * 977).toString(36).toUpperCase()}`,
    };
  });
  return {
    id: `demo-due-${i}`,
    spaceId: SPACE_ID,
    note: null,
    category: rest.type,
    paidCount: paid,
    memberCount: members.length,
    assignedRepId: DEMO_USER_ID,
    allowGuests: guestCount > 0,
    guestPaidCount: guestCount,
    publishedAt: rest.status === "draft" ? null : daysAgo(ageDays),
    closedAt: null,
    createdAt: daysAgo(ageDays + 1),
    paidBy: order.slice(0, paid).map((o) => o.id),
    guests,
    ...rest,
  };
}

const dues: DemoDue[] = [
  due(1, {
    title: "Departmental dues 2026/27",
    note: "Covers the dept. week, welfare and the end-of-year dinner.",
    amount: 500000,
    type: "departmental_due",
    status: "active",
    dueDate: daysFromNow(14),
    paid: 39,
    ageDays: 30,
  }),
  due(2, {
    title: "CSC 301 handout",
    note: "Data Structures & Algorithms — collect your copy from the class rep.",
    amount: 250000,
    type: "handout",
    status: "active",
    dueDate: daysFromNow(5),
    paid: 31,
    guestCount: 4,
    ageDays: 18,
  }),
  due(3, {
    title: "Networking lab manual",
    amount: 300000,
    type: "lab_manual",
    status: "active",
    dueDate: daysFromNow(21),
    paid: 22,
    ageDays: 9,
    assignedRepId: CO_REP_A,
  }),
  due(4, {
    title: "Departmental week T-shirt",
    amount: 750000,
    type: "departmental_wear",
    status: "closed",
    dueDate: daysAgo(20),
    paid: 45,
    ageDays: 60,
    closedAt: daysAgo(19),
  }),
  due(5, {
    title: "Excursion to Yaba tech hub",
    note: "Transport and lunch. Details on the class group.",
    amount: 1500000,
    type: "trip_fee",
    status: "draft",
    dueDate: daysFromNow(35),
    paid: 0,
    ageDays: 1,
  }),
];

const reps: SpaceRep[] = [
  {
    id: DEMO_USER_ID,
    name: DEMO_USER.name,
    email: DEMO_USER.email,
    role: "lead",
    isSignatory: true,
    kycVerified: true,
    assignedDues: 4,
    addedAt: daysAgo(90),
  },
  {
    id: CO_REP_A,
    name: "Chidinma Okafor",
    email: "chidinma.okafor@student.unilag.edu.ng",
    role: "co",
    isSignatory: true,
    kycVerified: true,
    assignedDues: 1,
    addedAt: daysAgo(80),
  },
  {
    id: CO_REP_B,
    name: "Ibrahim Musa",
    email: "ibrahim.musa@student.unilag.edu.ng",
    role: "co",
    isSignatory: true,
    kycVerified: true,
    assignedDues: 0,
    addedAt: daysAgo(45),
  },
];

const beneficiaries: Beneficiary[] = [
  {
    id: "demo-ben-1",
    label: "My account",
    bankCode: "058",
    bankName: "Guaranty Trust Bank",
    accountNumber: "•••• 4021",
    accountName: "ADEBAYO TOLUWALASE",
    createdAt: daysAgo(85),
  },
  {
    id: "demo-ben-2",
    label: "Dr. Folasade Adeyemi (HOD)",
    bankCode: "044",
    bankName: "Access Bank",
    accountNumber: "•••• 7713",
    accountName: "ADEYEMI FOLASADE O",
    createdAt: daysAgo(40),
  },
];

function payout(
  id: string,
  amount: number,
  fee: number,
  ageDays: number,
  benIndex: number,
  note: string,
  status: Payout["status"] = "success",
): Payout {
  const b = beneficiaries[benIndex];
  return {
    id,
    amount,
    fee,
    net: amount - fee,
    reference: `DVY-PO-${id.slice(-3).toUpperCase()}${ageDays}`,
    status,
    account: `${b.bankName} ${b.accountNumber}`,
    accountName: b.accountName,
    beneficiaryId: b.id,
    dueId: null,
    note,
    requestedById: DEMO_USER_ID,
    requestedAt: daysAgo(ageDays, 11),
    processingAt: daysAgo(ageDays, 11),
    settledAt: status === "success" ? daysAgo(ageDays, 12) : null,
    failedAt: status === "failed" ? daysAgo(ageDays, 12) : null,
    reversedAt: null,
    failureReason: status === "failed" ? "The receiving bank was unavailable. The amount is back in your balance." : null,
    feeDiscount: 0,
    approval: null,
  };
}

const payouts: Payout[] = [
  payout("demo-po-3", 12000000, 5000, 6, 1, "T-shirt vendor — balance"),
  payout("demo-po-2", 5000000, 5000, 15, 1, "Retry: T-shirt vendor", "failed"),
  payout("demo-po-1", 30000000, 5000, 22, 0, "T-shirt vendor deposit"),
];

const transactions: Transaction[] = [
  { id: "demo-txn-1", type: "due", method: "Bank transfer", title: "Departmental dues 2026/27", detail: "Department of Computer Science", amount: -512000, status: "completed", reference: "DVY-8K2M4Q", createdAt: daysAgo(28, 13) },
  { id: "demo-txn-2", type: "due", method: "Bank transfer", title: "Departmental week T-shirt", detail: "Department of Computer Science", amount: -767000, status: "completed", reference: "DVY-7H1P9Z", createdAt: daysAgo(55, 16) },
  { id: "demo-txn-3", type: "due", method: "Bank transfer", title: "CSC 301 handout", detail: "Department of Computer Science", amount: -257000, status: "completed", reference: "DVY-3T6B2W", createdAt: daysAgo(16, 9) },
  { id: "demo-txn-4", type: "due", method: "Bank transfer", title: "Faculty of Science levy", detail: "Faculty of Science", amount: -1022000, status: "completed", reference: "DVY-5R8C1N", createdAt: daysAgo(64, 15) },
];

const notifications: NotificationItem[] = [
  { id: "demo-n-1", kind: "payment", tone: "brand", title: "Adaeze Okonkwo paid", detail: "Departmental dues 2026/27 · ₦5,000", href: "/dashboard/collections", read: false, createdAt: daysAgo(0, 9) },
  { id: "demo-n-2", kind: "payout", tone: "brand", title: "Withdrawal paid out", detail: "₦119,950 sent to Access Bank •••• 7713", href: "/dashboard/payout", read: false, createdAt: daysAgo(6, 12) },
  { id: "demo-n-3", kind: "member", tone: "brand", title: "3 new students joined", detail: "Department of Computer Science", href: "/dashboard/circle", read: false, createdAt: daysAgo(2, 18) },
  { id: "demo-n-4", kind: "due", tone: "amber", title: "CSC 301 handout closes in 5 days", detail: "17 students haven't paid yet", href: "/dashboard/collections", read: true, createdAt: daysAgo(3, 8) },
  { id: "demo-n-5", kind: "payout", tone: "rose", title: "Withdrawal failed", detail: "₦50,000 is back in your balance", href: "/dashboard/payout", read: true, createdAt: daysAgo(15, 12) },
];

const audit: AuditEntry[] = [
  { id: "demo-a-1", action: "due.created", description: "Created the draft “Excursion to Yaba tech hub”", actor: { id: DEMO_USER_ID, name: DEMO_USER.name, role: "lead" }, createdAt: daysAgo(1, 17) },
  { id: "demo-a-2", action: "payout.requested", description: "Withdrew ₦120,000 to Access Bank •••• 7713", actor: { id: DEMO_USER_ID, name: DEMO_USER.name, role: "lead" }, createdAt: daysAgo(6, 11) },
  { id: "demo-a-3", action: "due.published", description: "Published “Networking lab manual”", actor: { id: CO_REP_A, name: "Chidinma Okafor", role: "co" }, createdAt: daysAgo(9, 10) },
  { id: "demo-a-4", action: "due.reminded", description: "Reminded 17 unpaid students about “CSC 301 handout”", actor: { id: DEMO_USER_ID, name: DEMO_USER.name, role: "lead" }, createdAt: daysAgo(10, 19) },
  { id: "demo-a-5", action: "due.closed", description: "Closed “Departmental week T-shirt”", actor: { id: DEMO_USER_ID, name: DEMO_USER.name, role: "lead" }, createdAt: daysAgo(19, 9) },
  { id: "demo-a-6", action: "rep.added", description: "Added Ibrahim Musa as a co-rep", actor: { id: DEMO_USER_ID, name: DEMO_USER.name, role: "lead" }, createdAt: daysAgo(45, 14) },
];

const verifiedKyc: KycState = {
  kycStatus: "verified",
  payoutsActive: true,
  canCollect: true,
  canWithdraw: true,
  providerReference: "bachs_acct_demo",
  requirementsDue: [],
  governmentIdSubmittedAt: null,
  payoutDestination: {
    bankCode: "058",
    bankName: "Guaranty Trust Bank",
    accountNumber: "•••• 4021",
    accountName: "ADEBAYO TOLUWALASE",
    submittedAt: daysAgo(86),
  },
  studentId: { status: "approved", uploadedAt: daysAgo(87), reviewedAt: daysAgo(86), reviewNote: null },
  rejectionReason: null,
  retryLockedUntil: null,
  submittedAt: daysAgo(87),
  resolvedAt: daysAgo(86),
};

const sessions: Session[] = [
  { id: "demo-s-1", device: "Chrome on macOS", ip: "102.89.34.12", lastSeenAt: daysAgo(0, 9), current: true },
  { id: "demo-s-2", device: "Safari on iPhone", ip: "102.89.40.7", lastSeenAt: daysAgo(1, 21), current: false },
];

const notificationPreferences: NotificationPreferences = {
  email: { dueReminders: true, paymentReceipts: true },
  push: { dueReminders: true, payments: true, circleActivity: false },
};

const polls: Poll[] = [
  {
    id: "demo-poll-1",
    spaceId: SPACE_ID,
    title: "CSC Departmental Awards 2026",
    description: "Vote for the standouts of the session. ₦100 per vote.",
    deadline: daysFromNow(9),
    status: "active",
    membersOnly: false,
    paid: true,
    amountPerVote: 10000,
    slug: "csc-awards-2026",
    totalVotes: 412,
    revenue: 4120000,
    themeColor: "emerald",
    coverImageUrl: null,
    categories: [
      {
        id: "demo-cat-1",
        title: "Most Brilliant",
        nominees: [
          { id: "demo-nom-1", name: "Oluwaseun Akinola", votes: 128, code: "01", bio: "300L · 4.9 CGPA" },
          { id: "demo-nom-2", name: "Ifeoma Okafor", votes: 97, code: "02", bio: "300L · Hackathon winner" },
          { id: "demo-nom-3", name: "Mubarak Bello", votes: 41, code: "03", bio: "200L" },
        ],
      },
      {
        id: "demo-cat-2",
        title: "Best Dressed",
        nominees: [
          { id: "demo-nom-4", name: "Kemi Lawal", votes: 88, code: "04" },
          { id: "demo-nom-5", name: "Tunde Eze", votes: 58, code: "05" },
        ],
      },
    ],
  },
  {
    id: "demo-poll-2",
    spaceId: SPACE_ID,
    title: "Class governor election",
    description: "One vote per verified member.",
    deadline: daysAgo(30),
    status: "closed",
    membersOnly: true,
    paid: false,
    amountPerVote: 0,
    slug: "csc-governor-2026",
    totalVotes: 44,
    revenue: 0,
    categories: [
      {
        id: "demo-cat-3",
        title: "Class governor",
        nominees: [
          { id: "demo-nom-6", name: "Tolu Adebayo", votes: 27 },
          { id: "demo-nom-7", name: "Emeka Nwosu", votes: 17 },
        ],
      },
    ],
  },
];

const referrals: ReferralsResponse = {
  code: "TOLU-CSC",
  link: "https://duevy.app/signup?ref=TOLU-CSC",
  rewardPerReferral: 200000,
  summary: { invited: 6, joined: 3, earned: 400000 },
  referrals: [
    { id: "demo-r-1", name: "Department of Physics", status: "paid", reward: 200000, date: daysAgo(40) },
    { id: "demo-r-2", name: "Mechanical Engineering", status: "paid", reward: 200000, date: daysAgo(25) },
    { id: "demo-r-3", name: "Mass Communication", status: "joined", reward: 0, date: daysAgo(6) },
    { id: "demo-r-4", name: "Economics", status: "pending", reward: 0, date: daysAgo(2) },
  ],
};

export const BANKS = [
  { code: "044", name: "Access Bank" },
  { code: "023", name: "Citibank Nigeria" },
  { code: "050", name: "Ecobank Nigeria" },
  { code: "070", name: "Fidelity Bank" },
  { code: "011", name: "First Bank of Nigeria" },
  { code: "214", name: "First City Monument Bank" },
  { code: "058", name: "Guaranty Trust Bank" },
  { code: "50211", name: "Kuda Microfinance Bank" },
  { code: "50515", name: "Moniepoint Microfinance Bank" },
  { code: "999992", name: "OPay" },
  { code: "999991", name: "PalmPay" },
  { code: "076", name: "Polaris Bank" },
  { code: "221", name: "Stanbic IBTC Bank" },
  { code: "232", name: "Sterling Bank" },
  { code: "032", name: "Union Bank of Nigeria" },
  { code: "033", name: "United Bank for Africa" },
  { code: "035", name: "Wema Bank" },
  { code: "057", name: "Zenith Bank" },
];

export const store = {
  user: DEMO_USER,
  space,
  joinCode: "CSC7Q2",
  members,
  dues,
  reps,
  beneficiaries,
  payouts,
  transactions,
  notifications,
  audit,
  kyc: verifiedKyc,
  sessions,
  notificationPreferences,
  polls,
  referrals,
};

export type { DemoDue };
