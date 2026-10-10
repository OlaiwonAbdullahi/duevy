export type ApiMeta = {
  page?: number;
  perPage?: number;
  total?: number;
  totalPages?: number;
  /** `GET /admin/feedback` only: how many are still `new`, for a badge. */
  unresolved?: number;
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
  /** Rep is a permission on top of the student account, set when an admin approves the application. */
  isRep: boolean;
  adminSubRole: string | null;
  institution: string | null;
  kycStatus: KycStatus | null;
  repApplicationStatus: RepApplicationStatus | null;
  matricNo: string | null;
  level: string | null;
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

export const DUE_TYPES = [
  "handout",
  "departmental_due",
  "exam_levy",
  "lab_manual",
  "association_due",
  "departmental_wear",
  "trip_fee",
  "clearance",
  "other",
] as const;

/** Must match the backend `DueType` enum (src/lib/dueTypes.ts). */
export type DueType = (typeof DUE_TYPES)[number];

/** @deprecated Use `DueType` — the backend still sends `category` as an alias of `type`. */
export type DueCategory = DueType;
export type DueStatus = "unpaid" | "paid" | "overdue";

export type Due = {
  id: string;
  spaceId: string;
  title: string;
  note?: string | null;
  /** Face amount the rep set (kobo). */
  amount: number;
  /** Processing fee (2% + ₦20) added on top for the payer (kobo). */
  processingFee?: number;
  /** What the payer is actually charged — `amount + processingFee` (kobo). */
  payableAmount?: number;
  dueDate: string;
  type: DueType;
  /** Deprecated alias of `type`. */
  category: DueType;
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
  /** e.g. "Bank transfer". */
  method?: string;
  title?: string;
  /** Context line, e.g. the space name. */
  detail?: string | null;
  /** Signed kobo: positive = credit in, negative = debit out. */
  amount: number;
  status: TxnStatus;
  reference: string;
  createdAt: string;
};

export type StudentOverview = {
  outstanding: { amount: number; count: number };
  paidThisSession: number;
  /** `status` here is the rep lifecycle value ("active"); overdue is a separate flag. */
  openDues: (Omit<Due, "status"> & { status: string; overdue?: boolean })[];
  recentTransactions: Transaction[];
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

export type RepDue = Omit<
  Due,
  "status" | "processingFee" | "payableAmount" | "paidAt" | "reference"
> & {
  /** Not returned by the current API; guest payers are refused at checkout. */
  allowGuests?: boolean;
  status: RepDueStatus;
  paidCount: number;
  memberCount: number;
  /** The rep this due's payout access is scoped to — auto-set to the creator. */
  assignedRepId: string | null;
  publishedAt: string | null;
  closedAt: string | null;
  createdAt: string;
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
  actor: { id: string; name: string; role: RepRole | null };
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

/** One line of a space's ledger (`GET /spaces/:spaceId/ledger`). Amounts in kobo. */
export type LedgerEntryType =
  | "due_payment"
  | "manual_credit"
  | "payout"
  | "payout_fee"
  | "payout_reversal"
  | "refund";

export type LedgerEntry = {
  id: string;
  type: LedgerEntryType;
  direction: "credit" | "debit";
  amount: number;
  /** Positive for credits, negative for debits. */
  signedAmount: number;
  reference: string | null;
  description: string | null;
  dueId: string | null;
  payoutId: string | null;
  createdAt: string;
};

// ---- Payouts (§10) --------------------------------------------------------

/** `pending → processing → success | failed | reversed`. Failed/reversed amounts go back to the balance. */
export type PayoutStatus = "pending" | "processing" | "success" | "failed" | "reversed";

export type Payout = {
  id: string;
  /** Gross, debited from the space (kobo). */
  amount: number;
  /** Withdrawal fee deducted from `amount` (kobo). */
  fee: number;
  /** What reaches the bank — `amount - fee` (kobo). */
  net: number;
  reference: string;
  status: PayoutStatus;
  /** Masked destination, e.g. "Guaranty Trust Bank •••• 4021". */
  account: string;
  /** The beneficiary's name, as the bank holds it. Null on older withdrawals. */
  accountName?: string | null;
  beneficiaryId?: string | null;
  note?: string | null;
  requestedById: string | null;
  requestedAt: string;
  processingAt: string | null;
  settledAt: string | null;
  failedAt: string | null;
  reversedAt: string | null;
  failureReason: string | null;
};

export type WithdrawalFeeTier = { thresholdKobo: number; feeKobo: number };

/** All amounts in kobo, derived from the space's ledger. */
export type PayoutSummary = {
  available: number;
  balance: number;
  collected: number;
  withdrawn: number;
  withdrawalFees: number;
  /** Withdrawals still pending/processing. */
  inFlight: number;
  /** The space lead's verification state. */
  kyc: KycState;
  /** How many beneficiaries the space can withdraw to. */
  beneficiaryCount: number;
  minPayout: number;
  fees: { below: WithdrawalFeeTier; atOrAbove: WithdrawalFeeTier };
};

export type PayoutQuote = {
  amount: number;
  fee: number;
  net: number;
  minPayout: number;
  belowMinimum: boolean;
};

/** A bank account the space can withdraw to (the rep's own, a lecturer's, …). */
export type Beneficiary = {
  id: string;
  /** The rep's own note, e.g. "Dr. Adeyemi (HOD)". */
  label: string | null;
  bankCode: string;
  bankName: string;
  /** Masked, e.g. "•••• 4021". */
  accountNumber: string;
  /** As the bank holds it (name enquiry). */
  accountName: string;
  createdAt: string;
};

// ---- Rep KYC ----------------------------------------------------------------
// Two checks, both required before a space can collect: Bachs verifies the
// rep's identity (NIN + date of birth), a Duevy admin verifies their student ID.

export type StudentIdStatus = "pending" | "approved" | "rejected";

export type KycState = {
  /** The Bachs identity check. */
  kycStatus: KycStatus;
  payoutsActive: boolean;
  canCollect: boolean;
  canWithdraw: boolean;
  providerReference: string | null;
  /** Field keys Bachs still asks for, e.g. "persons.per_x.bvn" or an ID document. */
  requirementsDue: string[];
  governmentIdSubmittedAt: string | null;
  /** The rep's own bank account on their Bachs account; `null` until sent. */
  payoutDestination: {
    bankCode: string;
    bankName: string;
    /** Masked, e.g. "•••• 6789". */
    accountNumber: string;
    accountName: string;
    submittedAt: string;
  } | null;
  studentId: {
    /** `null` until a card has been uploaded. */
    status: StudentIdStatus | null;
    uploadedAt: string | null;
    reviewedAt: string | null;
    reviewNote: string | null;
  };
  rejectionReason: string | null;
  retryLockedUntil: string | null;
  submittedAt: string | null;
  resolvedAt: string | null;
};

/** `GET /payout/kyc-status`: the space lead's state, plus the caller's own. */
export type SpaceKycStatus = KycState & { leadRepId: string | null; mine: KycState };

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
