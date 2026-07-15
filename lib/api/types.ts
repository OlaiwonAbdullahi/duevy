export type ApiMeta = {
  page?: number;
  perPage?: number;
  total?: number;
  totalPages?: number;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: ApiMeta;
};

export type ApiErrorDetail = {
  field: string;
  issue: string;
};

export type ApiErrorBody = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorBody;

export type RepApplicationStatus = "none" | "pending" | "approved" | "rejected";

export type UserRole = "student" | "rep" | "admin";

export type KycStatus = "unverified" | "pending" | "verified" | "rejected";

export type SpaceMembershipSummary = {
  id: string;
  name: string;
  short?: string;
  kind?: SpaceKind;
  hue?: EmblemHue;
  /** Present on the rep membership entry — the department's join code. */
  joinCode?: string | null;
  /** Viewer-relative. Reps see a rep-ish role on the department they manage. */
  membership: "member" | "guest" | "rep" | "lead" | "co";
};

export type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  repApplicationStatus: RepApplicationStatus | null;
  matricNo: string | null;
  level: string | null;
  walletBalance: number;
  referralCode: string | null;
  spaces: SpaceMembershipSummary[];
  createdAt: string;
};

// ---------------------------------------------------------------------------
// Resource types. All monetary amounts are integers in kobo (₦1 = 100 kobo).
// ---------------------------------------------------------------------------

export type SpaceKind = "department" | "association" | "faculty" | "club";
export type SpaceThemeId = "emerald" | "ocean" | "royal" | "crimson" | "tangerine";
export type EmblemHue = "emerald" | "indigo" | "amber" | "rose" | "slate";

export type Space = {
  id: string;
  name: string;
  short: string;
  kind: SpaceKind;
  hue?: EmblemHue;
  theme?: SpaceThemeId | null;
  about?: string | null;
  faculty?: string | null;
  school?: string;
  memberCount: number;
  /** Viewer-relative; omitted on admin reads. */
  membership?: "member" | "guest" | "rep";
  createdAt?: string;
};

export type DueCategory = "levy" | "dinner" | "handout" | "welfare" | "sport";
export type DueStatus = "unpaid" | "paid" | "overdue";
export type PayMethod = "wallet" | "card" | "online";

export type Due = {
  id: string;
  spaceId: string;
  title: string;
  note?: string | null;
  /** Face amount the rep set (kobo). */
  amount: number;
  /** 3% processing fee added on top for the payer (kobo). */
  processingFee?: number;
  /** What the payer is actually charged — `amount + processingFee` (kobo). */
  payableAmount?: number;
  dueDate: string;
  category: DueCategory;
  status: DueStatus;
  paidAt: string | null;
  reference: string | null;
};

/** A space resolved from a join code, with the dues that attach on joining. */
export type JoinableDepartment = Space & {
  code: string;
  dues?: Due[];
};

export type TxnType = "due" | "topup" | "referral" | "withdrawal" | "refund" | "vote";
export type TxnStatus = "completed" | "pending" | "failed";

export type Transaction = {
  id: string;
  type: TxnType;
  /** e.g. "Wallet" · "Visa •••• 4242" · "Monnify". */
  method?: string;
  title?: string;
  /** Signed kobo: positive = credit in, negative = debit out. */
  amount: number;
  status: TxnStatus;
  reference: string;
  createdAt: string;
};

export type StudentOverview = {
  walletBalance: number;
  outstanding: { amount: number; count: number };
  paidThisSession: number;
  openDues: Due[];
  recentTransactions: Transaction[];
};

export type Wallet = {
  balance: number;
  pendingBalance: number;
};

export type Card = {
  id: string;
  brand: string;
  last4: string;
  expiry: string;
  isDefault: boolean;
};

/** Returned by `POST /wallet/cards` — a hosted checkout to verify + tokenize the card. */
export type SaveCardResult = {
  checkoutUrl: string;
  reference: string;
};

export type NotificationPreferences = {
  email: { dueReminders: boolean; paymentReceipts: boolean };
  push: { dueReminders: boolean; payments: boolean; circleActivity: boolean };
};

/** A signed-in device/browser session, for the "manage devices" screen. */
export type Session = {
  id: string;
  device: string;
  ip: string;
  lastSeenAt: string;
  /** The session tied to the cookie on the request that fetched this list. */
  current: boolean;
};

export type NotificationTone = "brand" | "amber" | "rose";

export type NotificationItem = {
  id: string;
  kind: string;
  tone: NotificationTone;
  title: string;
  detail: string;
  href: string | null;
  read: boolean;
  createdAt: string;
};

// ---- Rep: dues management & collections (§7) ------------------------------

export type RepDueStatus = "draft" | "active" | "closed";

export type RepDue = Omit<Due, "status"> & {
  allowGuests: boolean;
  status: RepDueStatus;
  paidCount: number;
  memberCount: number;
};

export type CollectionTotals = {
  paid: number;
  unpaid: number;
  collected: number;
  fees: number;
  net: number;
  expected: number;
  rate: number;
};

export type CollectionStudent = {
  id: string;
  name: string;
  matricNo: string;
  level: string | null;
  email: string;
  status: "paid" | "unpaid";
  paidAt: string | null;
  reference: string | null;
};

export type SpaceMember = {
  id: string;
  name: string;
  matricNo: string;
  level: string;
  email: string;
  joinedAt: string;
};

export type RepRole = "lead" | "co";
export type SpaceRep = { id: string; name: string; email: string; role: RepRole };

export type AuditEntry = {
  id: string;
  action: string;
  description: string;
  actor: { id: string; name: string };
  createdAt: string;
};

export type RepOverview = {
  space: Space;
  joinCode: string;
  stats: {
    collected: number;
    outstanding: number;
    unpaidCount: number;
    collectionRate: number;
  };
  activeDues: RepDue[];
  newMembers: Array<{
    id: string;
    name: string;
    matricNo: string;
    level: string | null;
    email: string;
    joinedAt: string;
  }>;
};

// ---- Payouts (§10) --------------------------------------------------------

export type PayoutStatus = "processing" | "completed" | "failed";

export type Payout = {
  id: string;
  amount: number;
  reference: string;
  status: PayoutStatus;
  account: string;
  requestedAt: string;
  settledAt: string | null;
  failureReason: string | null;
};

export type PayoutSummary = {
  available: number;
  pending: number;
  lifetime: number;
};

export type BankAccount = {
  bankCode: string;
  bankName?: string;
  accountNumber: string;
  accountName?: string;
};

// ---- Polls (§11) ----------------------------------------------------------

export type PollStatus = "draft" | "active" | "closed";

export type PollNominee = {
  id: string;
  name: string;
  votes?: number;
  imageUrl?: string | null;
  /** Short one-line tagline, e.g. "300L Computer Science". Proposed — not yet backed by the API. */
  bio?: string | null;
  /** Short memorable vote code, e.g. "04". Proposed — not yet backed by the API. */
  code?: string | null;
};
export type PollCategory = {
  id: string;
  title: string;
  nominees: PollNominee[];
  imageUrl?: string | null;
  /** Public voter view only: votes left in this category for the caller (1/0, or null if uncapped). */
  remaining?: number | null;
};

export type Poll = {
  id: string;
  spaceId: string;
  title: string;
  description: string;
  deadline: string;
  status: PollStatus;
  /** `true` → verified members only, one vote per category. */
  membersOnly: boolean;
  paid: boolean;
  /** Kobo; meaningful only when `paid`. */
  amountPerVote: number;
  slug: string;
  categories: PollCategory[];
  /** Denormalized rollup. */
  totalVotes: number;
  /** Kobo collected (paid polls). */
  revenue: number;
  /** Hero banner for the public voting page. Proposed — not yet backed by the API. */
  coverImageUrl?: string | null;
  /**
   * One of the space's `SpaceThemeId`s ("emerald" | "ocean" | "royal" | "crimson" |
   * "tangerine") — re-tints the public voting page. Proposed — not yet backed by the API.
   */
  themeColor?: string | null;
};

// ---- Disputes (§13) -------------------------------------------------------

export type DisputeType =
  | "payment_not_reflecting"
  | "non_remittance"
  | "refund_request";

export type DisputeStatus = "open" | "under_review" | "resolved";

export type Dispute = {
  id: string;
  type: DisputeType;
  openedBy: string;
  status: DisputeStatus;
  slaDays: number;
  ageDays: number;
  breached: boolean;
  description: string;
  resolution: string | null;
  createdAt: string;
  // Present on the live backend but outside the guide interface.
  email?: string;
  department?: string | null;
  txnReference?: string | null;
};

// ---- Referrals (rep-only, §12) --------------------------------------------

export type ReferralStatus = "pending" | "joined" | "paid";

export type Referral = {
  id: string;
  name: string;
  status: ReferralStatus;
  reward: number;
  date: string;
};

export type ReferralsResponse = {
  code: string;
  link: string;
  rewardPerReferral: number;
  summary: { invited: number; joined: number; earned: number };
  referrals: Referral[];
};
