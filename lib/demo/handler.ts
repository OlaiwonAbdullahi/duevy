import type { Page } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type {
  CollectionStudent,
  Due,
  LedgerEntry,
  Payout,
  PayoutSummary,
  Poll,
  RepDue,
  SpaceKycStatus,
} from "@/lib/api/types";
import { DEMO_USER_ID } from "./mode";
import { MAX_SIGNATURES, type ReceiptDesign, type ReceiptDesignSettings } from "@/lib/api/receipt-design";
import type { Checkout } from "@/lib/api/dues";
import type { GuestAnswer, GuestField } from "@/lib/api/types";
import { BANKS, SPACE_ID, store, type DemoDue } from "./fixtures";

/**
 * Answers API requests from the demo store instead of the network. Reads are
 * derived from the store so totals stay consistent after demo actions; writes
 * update it in place. Anything the demo can't sensibly fake (real payments,
 * destructive account changes) fails with a friendly `DEMO_UNAVAILABLE`.
 */

type Body = Record<string, unknown> | FormData | undefined;
type Ctx = { params: string[]; query: URLSearchParams; body: Body };
type Handler = (ctx: Ctx) => unknown;

const MIN_PAYOUT = 100000;
const FEE_THRESHOLD = 500000;
const fees = { below: { thresholdKobo: FEE_THRESHOLD, feeKobo: 1000 }, atOrAbove: { thresholdKobo: FEE_THRESHOLD, feeKobo: 5000 } };
const withdrawalFee = (amount: number) => (amount >= FEE_THRESHOLD ? fees.atOrAbove.feeKobo : fees.below.feeKobo);
/** What a student pays on top of a due: 2% + ₦20. */
const processingFee = (amount: number) => Math.round(amount * 0.02) + 2000;

const now = () => new Date().toISOString();
const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
const ref = () => `DVY-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

function unavailable(message = "That isn't available in the demo."): never {
  throw new ApiError(message, { code: "DEMO_UNAVAILABLE", status: 403 });
}

function notFound(): never {
  throw new ApiError("Not found.", { code: "NOT_FOUND", status: 404 });
}

function json(body: Body): Record<string, unknown> {
  return body && !(body instanceof FormData) ? body : {};
}

function findDue(id: string) {
  return store.dues.find((d) => d.id === id) ?? notFound();
}

function toRepDue(d: DemoDue): RepDue {
  const { paidBy, guests, ...rest } = d;
  return { ...rest, paidCount: paidBy.length, guestPaidCount: guests.length, memberCount: store.members.length };
}

const collectedFor = (d: DemoDue) => (d.paidBy.length + d.guests.length) * d.amount;
const totalCollected = () => store.dues.reduce((sum, d) => sum + collectedFor(d), 0);

/** When a member paid a due: spread evenly from publishing until now, in `paidBy` order. */
function paidAtFor(d: DemoDue, index: number) {
  const start = new Date(d.publishedAt ?? d.createdAt).getTime();
  const end = d.closedAt ? new Date(d.closedAt).getTime() : Date.now() - 60 * 60 * 1000;
  const step = (end - start) / Math.max(1, d.paidBy.length);
  return new Date(start + step * (index + 0.5)).toISOString();
}

function paymentRef(d: DemoDue, memberId: string) {
  return `DVY-${(d.id + memberId).split("").reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7).toString(36).toUpperCase().slice(0, 6)}`;
}

const SETTLED: Payout["status"][] = ["success"];
const IN_FLIGHT: Payout["status"][] = ["awaiting_approval", "pending", "processing"];

function payoutSummary(): PayoutSummary {
  const collected = totalCollected();
  const settled = store.payouts.filter((p) => SETTLED.includes(p.status));
  const inFlight = store.payouts.filter((p) => IN_FLIGHT.includes(p.status)).reduce((s, p) => s + p.amount, 0);
  const withdrawn = settled.reduce((s, p) => s + p.amount, 0);
  const balance = collected - withdrawn;
  const signatories = store.reps.filter((r) => r.isSignatory).map(({ id, name, email, role }) => ({ id, name, email, role }));
  return {
    available: balance - inFlight,
    balance,
    collected,
    withdrawn,
    withdrawalFees: settled.reduce((s, p) => s + p.fee, 0),
    inFlight,
    kyc: store.kyc,
    beneficiaryCount: store.beneficiaries.length,
    withdrawalPinSet: true,
    withdrawalPinLockedUntil: null,
    withdrawalPinHoldUntil: null,
    withdrawalAuthMode: "pin",
    signatories,
    signatoriesComplete: signatories.length >= 3,
    awaitingApprovalPayoutId: null,
    minPayout: MIN_PAYOUT,
    fees,
    partner: null,
  };
}

function ledger(): LedgerEntry[] {
  const entries: LedgerEntry[] = [];
  for (const d of store.dues) {
    d.paidBy.forEach((memberId, i) => {
      const name = store.members.find((m) => m.id === memberId)?.name ?? "A student";
      entries.push({
        id: `demo-l-${d.id}-${memberId}`,
        type: "due_payment",
        direction: "credit",
        amount: d.amount,
        signedAmount: d.amount,
        reference: paymentRef(d, memberId),
        description: `${name} · ${d.title}`,
        dueId: d.id,
        payoutId: null,
        createdAt: paidAtFor(d, i),
      });
    });
    for (const g of d.guests) {
      entries.push({
        id: `demo-l-${g.id}`,
        type: "due_payment",
        direction: "credit",
        amount: d.amount,
        signedAmount: d.amount,
        reference: g.reference,
        description: `${g.name} (guest) · ${d.title}`,
        dueId: d.id,
        payoutId: null,
        createdAt: g.paidAt,
      });
    }
  }
  for (const p of store.payouts) {
    if (p.status === "cancelled") continue;
    const base = { reference: p.reference, dueId: p.dueId ?? null, payoutId: p.id };
    entries.push({ ...base, id: `${p.id}-net`, type: "payout", direction: "debit", amount: p.net, signedAmount: -p.net, description: `Withdrawal to ${p.account}`, createdAt: p.requestedAt });
    entries.push({ ...base, id: `${p.id}-fee`, type: "payout_fee", direction: "debit", amount: p.fee, signedAmount: -p.fee, description: "Withdrawal fee", createdAt: p.requestedAt });
    if (p.status === "failed") {
      entries.push({ ...base, id: `${p.id}-rev`, type: "payout_reversal", direction: "credit", amount: p.amount, signedAmount: p.amount, description: p.failureReason, createdAt: p.failedAt ?? p.requestedAt });
    }
  }
  return entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** The demo rep's own view of their department's dues, as a student. */
function myDues(): Due[] {
  const paid: Record<string, string> = { "demo-due-1": "DVY-8K2M4Q", "demo-due-2": "DVY-3T6B2W", "demo-due-4": "DVY-7H1P9Z" };
  return store.dues
    .filter((d) => d.status !== "draft")
    .map((d) => {
      const fee = processingFee(d.amount);
      const reference = paid[d.id] ?? null;
      const overdue = !reference && new Date(d.dueDate).getTime() < Date.now();
      return {
        id: d.id,
        spaceId: d.spaceId,
        title: d.title,
        note: d.note,
        amount: d.amount,
        processingFee: fee,
        payableAmount: d.amount + fee,
        dueDate: d.dueDate,
        type: d.type,
        category: d.type,
        status: reference ? "paid" : overdue ? "overdue" : "unpaid",
        paidAt: reference ? store.transactions.find((t) => t.reference === reference)?.createdAt ?? null : null,
        reference,
      };
    });
}

function paginate<T>(items: T[], query: URLSearchParams, defaultPerPage = 20): Page<T[]> {
  const perPage = Number(query.get("perPage")) || defaultPerPage;
  const page = Number(query.get("page")) || 1;
  const total = items.length;
  return {
    data: items.slice((page - 1) * perPage, page * perPage),
    meta: { page, perPage, total, totalPages: Math.max(1, Math.ceil(total / perPage)) },
  };
}

function matches(q: string | null, ...fields: (string | null | undefined)[]) {
  if (!q) return true;
  const needle = q.toLowerCase();
  return fields.some((f) => f?.toLowerCase().includes(needle));
}

function createPayout(body: Record<string, unknown>): Payout {
  const amount = Number(body.amount);
  const summary = payoutSummary();
  if (!amount || amount < MIN_PAYOUT) {
    throw new ApiError("The minimum withdrawal is ₦1,000.", { code: "BELOW_MINIMUM", status: 422 });
  }
  if (amount > summary.available) {
    throw new ApiError("That's more than the available balance.", { code: "INSUFFICIENT_BALANCE", status: 422 });
  }
  const ben = store.beneficiaries.find((b) => b.id === body.beneficiaryId);
  const bank = ben ?? {
    bankName: BANKS.find((b) => b.code === body.bankCode)?.name ?? "Bank",
    accountNumber: `•••• ${String(body.accountNumber ?? "0000").slice(-4)}`,
    accountName: "DEMO ACCOUNT HOLDER",
  };
  const fee = withdrawalFee(amount);
  const at = now();
  const payout: Payout = {
    id: uid("demo-po"),
    amount,
    fee,
    net: amount - fee,
    reference: ref(),
    status: "success",
    account: `${bank.bankName} ${bank.accountNumber}`,
    accountName: bank.accountName,
    beneficiaryId: ben?.id ?? null,
    dueId: (body.dueId as string | undefined) ?? null,
    note: (body.note as string | undefined) ?? null,
    requestedById: DEMO_USER_ID,
    requestedAt: at,
    processingAt: at,
    settledAt: at,
    failedAt: null,
    reversedAt: null,
    failureReason: null,
    feeDiscount: 0,
    approval: null,
  };
  store.payouts.unshift(payout);
  return payout;
}

function audit(action: string, description: string) {
  store.audit.unshift({
    id: uid("demo-a"),
    action,
    description,
    actor: { id: DEMO_USER_ID, name: store.user.name, role: "lead" },
    createdAt: now(),
  });
}

function pollResults(p: Poll) {
  return { poll: { id: p.id, title: p.title, status: p.status }, totalVotes: p.totalVotes, revenue: p.revenue, categories: p.categories };
}

const kycStatus = (): SpaceKycStatus => ({ ...store.kyc, leadRepId: DEMO_USER_ID, mine: store.kyc });

const S = "/spaces/([^/]+)";

/** The demo space's receipt design (starts as the standard one). */
const receiptDesign: ReceiptDesign = {
  accent: null,
  headerStyle: "artwork",
  title: null,
  showStamp: true,
  stampText: null,
  stampStyle: "round",
  stampColor: null,
  stampImage: null,
  thankYou: null,
  note: null,
  showAnswers: true,
  logo: null,
  signatures: [],
  updatedAt: null,
};

/**
 * Guest checkouts opened from a demo pay link. Nothing is charged: each one
 * "receives" its transfer a few seconds after it opens, so the whole flow —
 * account details, waiting, confirmation — can be shown.
 */
type DemoGuestCheckout = {
  checkout: Checkout;
  dueId: string;
  payer: { name: string; email: string; matricNo: string | null };
  answers: GuestAnswer[];
  receiptNumber: string | null;
  openedAt: number;
  /** "Create a Duevy account for me" — the activation link "goes out" once it's paid, as the API does. */
  accountRequested: boolean;
  inviteSentAt: string | null;
};
const guestCheckouts = new Map<string, DemoGuestCheckout>();
const GUEST_PAYS_AFTER_MS = 12_000;

/** A due as its public pay link shows it, or 404 when it isn't open to guests. */
function publicDue(id: string) {
  const d = store.dues.find((x) => x.id === id);
  if (!d || !d.allowGuests || d.status !== "active") notFound();
  return d;
}

/** A due's own questions — matric number is always asked, so an older form's matric question is dropped (as the API does). */
const guestQuestions = (fields: GuestField[] | null | undefined) => (fields ?? []).filter((f) => f.id !== "matric");

/** Check answers against the due's questions, as the API does (lib/guestForm.ts). */
function checkAnswers(fields: GuestField[], input: Record<string, string> = {}): GuestAnswer[] {
  const issues: { field: string; issue: string }[] = [];
  const answers: GuestAnswer[] = [];
  for (const f of fields) {
    const value = (input[f.id] ?? "").trim();
    const field = `answers.${f.id}`;
    if (!value) {
      if (f.required) issues.push({ field, issue: `${f.label} is required` });
      continue;
    }
    if (f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) issues.push({ field, issue: "must be a valid email" });
    else if (f.type === "phone" && !/^\+?[0-9 ()-]{7,20}$/.test(value)) issues.push({ field, issue: "must be a valid phone number" });
    else if (f.type === "number" && !/^-?\d+(\.\d+)?$/.test(value)) issues.push({ field, issue: "must be a number" });
    else if (f.type === "select" && !f.options?.includes(value)) issues.push({ field, issue: "must be one of the options" });
    else answers.push({ fieldId: f.id, label: f.label, value });
  }
  if (issues.length) {
    throw new ApiError("Request validation failed", { code: "VALIDATION_ERROR", status: 400, details: issues });
  }
  return answers;
}

/** A demo guest checkout in the shape GET /public/checkouts/:reference returns. */
function guestStatus(g: DemoGuestCheckout) {
  return {
    ...g.checkout,
    receiptNumber: g.receiptNumber,
    spaceName: store.space.name,
    payer: { name: g.payer.name, email: g.payer.email, matricNo: g.payer.matricNo },
    answers: g.answers,
    account: { exists: false, requested: g.accountRequested, inviteSentAt: g.inviteSentAt },
  };
}

/** Settle a demo guest checkout once its time is up: the guest joins the due's guest list. */
function settleGuestCheckout(g: DemoGuestCheckout) {
  if (g.checkout.status !== "pending" || Date.now() - g.openedAt < GUEST_PAYS_AFTER_MS) return;
  const paidAt = now();
  Object.assign(g.checkout, { status: "paid", paidAt, receivedKobo: g.checkout.breakdown.total, bankTransfer: null });
  g.receiptNumber = `R-DEMO${Math.floor(Math.random() * 9000 + 1000)}`;
  if (g.accountRequested) g.inviteSentAt = paidAt;
  const d = store.dues.find((x) => x.id === g.dueId);
  if (d && !d.guests.some((x) => x.email === g.payer.email)) {
    d.guests.unshift({ id: uid("demo-guest"), ...g.payer, paidAt, reference: g.checkout.reference, answers: g.answers });
  }
}

const readDataUrl = (file: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const routes: [string, string, Handler][] = [
  // ---- Auth & account ------------------------------------------------------
  ["POST", "/auth/refresh", () => ({ accessToken: "demo", user: store.user })],
  ["GET", "/auth/me", () => store.user],
  ["POST", "/auth/logout", () => undefined],
  ["GET", "/me/overview", () => {
    const dues = myDues();
    const open = dues.filter((d) => d.status !== "paid");
    return {
      outstanding: { amount: open.reduce((s, d) => s + (d.payableAmount ?? d.amount), 0), count: open.length },
      paidThisSession: store.transactions.filter((t) => t.type === "due").reduce((s, t) => s - t.amount, 0),
      openDues: open.map((d) => ({ ...d, status: "active", overdue: d.status === "overdue" })),
      recentTransactions: store.transactions.slice(0, 5),
    };
  }],
  ["PATCH", "/me", ({ body }) => (store.user = { ...store.user, ...json(body) })],
  ["POST", "/me/avatar", ({ body }) => {
    const file = body instanceof FormData ? body.get("file") : null;
    const avatarUrl = file instanceof Blob ? URL.createObjectURL(file) : null;
    store.user = { ...store.user, avatarUrl };
    return { avatarUrl };
  }],
  ["PUT", "/me/password", () => ({ success: true })],
  ["DELETE", "/me", () => unavailable("Deleting the account is disabled in the demo.")],
  ["GET", "/me/notification-preferences", () => store.notificationPreferences],
  ["PUT", "/me/notification-preferences", ({ body }) => (store.notificationPreferences = json(body) as typeof store.notificationPreferences)],
  ["GET", "/me/sessions", () => store.sessions],
  ["DELETE", "/me/sessions/([^/]+)", ({ params: [id] }) => {
    store.sessions = store.sessions.filter((s) => s.id !== id);
  }],
  ["GET", "/me/kyc-status", () => store.kyc],

  // ---- Student side ----------------------------------------------------------
  ["GET", "/dues", ({ query }) => {
    const status = query.get("status");
    return paginate(myDues().filter((d) => !status || d.status === status), query);
  }],
  ["GET", "/dues/([^/]+)", ({ params: [id] }) => myDues().find((d) => d.id === id) ?? notFound()],
  ["POST", "/dues/pay", () => unavailable("Payments are disabled in the demo.")],
  ["POST", "/dues/([^/]+)/pay", () => unavailable("Payments are disabled in the demo.")],
  ["GET", "/transactions", ({ query }) => {
    const type = query.get("type");
    const status = query.get("status");
    return paginate(store.transactions.filter((t) => (!type || t.type === type) && (!status || t.status === status)), query);
  }],
  ["GET", "/transactions/([^/]+)", ({ params: [id] }) => store.transactions.find((t) => t.id === id) ?? notFound()],
  ["GET", "/notifications", ({ query }) => {
    const page = paginate(store.notifications, query);
    return { ...page, meta: { ...page.meta, unreadCount: store.notifications.filter((n) => !n.read).length } };
  }],
  ["POST", "/notifications/read-all", () => {
    store.notifications = store.notifications.map((n) => ({ ...n, read: true }));
  }],
  ["POST", "/notifications/([^/]+)/read", ({ params: [id] }) => {
    store.notifications = store.notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    return store.notifications.find((n) => n.id === id);
  }],
  ["GET", "/spaces", () => [store.space]],
  ["POST", "/spaces/lookup", () => unavailable("Joining other departments is disabled in the demo.")],
  ["GET", "/banks", () => BANKS],
  ["GET", "/referrals", () => store.referrals],
  ["POST", "/referrals/invites", ({ body }) => ({ sent: ((json(body).emails as string[]) ?? []).length })],
  ["GET", "/disputes", () => ({ data: [], meta: { page: 1, perPage: 20, total: 0, totalPages: 1 } })],
  ["POST", "/feedback", () => ({ id: uid("demo-fb") })],

  // ---- Space & department ----------------------------------------------------
  ["GET", `${S}`, () => store.space],
  ["PATCH", `${S}`, ({ body }) => {
    store.space = { ...store.space, ...json(body) };
    audit("space.updated", "Updated the department profile");
    return store.space;
  }],
  ["GET", `${S}/overview`, () => {
    const active = store.dues.filter((d) => d.status === "active");
    const n = store.members.length;
    const paid = active.reduce((s, d) => s + d.paidBy.length, 0);
    return {
      space: store.space,
      joinCode: store.joinCode,
      stats: {
        collected: active.reduce((s, d) => s + collectedFor(d), 0),
        totalCollected: totalCollected(),
        outstanding: active.reduce((s, d) => s + (n - d.paidBy.length) * d.amount, 0),
        unpaidCount: active.reduce((s, d) => s + (n - d.paidBy.length), 0),
        collectionRate: active.length ? paid / (n * active.length) : 0,
      },
      activeDues: active.map(toRepDue),
      newMembers: [...store.members].sort((a, b) => b.joinedAt.localeCompare(a.joinedAt)).slice(0, 5),
    };
  }],
  ["GET", `${S}/members`, ({ query }) => {
    const q = query.get("q");
    const list = [...store.members]
      .sort((a, b) => b.joinedAt.localeCompare(a.joinedAt))
      .filter((m) => matches(q, m.name, m.matricNo, m.email));
    return paginate(list, query);
  }],
  ["DELETE", `${S}/members/([^/]+)`, ({ params: [, id] }) => {
    store.members = store.members.filter((m) => m.id !== id);
    store.space = { ...store.space, memberCount: store.members.length };
  }],
  ["POST", `${S}/join-code/regenerate`, () => {
    store.joinCode = `CSC${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    store.user = { ...store.user, spaces: store.user.spaces.map((s) => ({ ...s, joinCode: store.joinCode })) };
    audit("join_code.regenerated", "Regenerated the join code");
    return { code: store.joinCode };
  }],
  ["GET", `${S}/reps`, () => store.reps],
  ["POST", `${S}/reps`, ({ body }) => {
    const member = store.members.find((m) => m.id === json(body).userId) ?? notFound();
    const rep = { id: member.id, name: member.name, email: member.email, role: "co" as const, isSignatory: false, kycVerified: false, assignedDues: 0, addedAt: now() };
    store.reps.push(rep);
    audit("rep.added", `Added ${member.name} as a co-rep`);
    return rep;
  }],
  ["DELETE", `${S}/reps/([^/]+)`, ({ params: [, id] }) => {
    store.reps = store.reps.filter((r) => r.id !== id || r.role === "lead");
  }],
  ["GET", `${S}/audit-log`, ({ query }) => paginate(store.audit, query)],
  ["POST", `${S}/transfer-lead`, () => unavailable("Handing over the lead role is disabled in the demo.")],
  ["POST", `${S}/archive`, () => unavailable("Archiving the department is disabled in the demo.")],
  ["GET", `${S}/partner`, () => null],
  ["POST", `${S}/partner`, () => unavailable("Partner codes can't be applied in the demo.")],

  // ---- Dues & collections ----------------------------------------------------
  ["GET", `${S}/dues`, ({ query }) => {
    const status = query.get("status");
    return store.dues.filter((d) => !status || d.status === status).map(toRepDue);
  }],
  ["POST", `${S}/dues`, ({ body }) => {
    const b = json(body);
    const publish = !!b.publish;
    const at = now();
    const d: DemoDue = {
      id: uid("demo-due"),
      spaceId: SPACE_ID,
      title: String(b.title ?? "New due"),
      note: (b.note as string) ?? null,
      amount: Number(b.amount) || 0,
      dueDate: String(b.dueDate ?? at),
      type: (b.type as DemoDue["type"]) ?? "other",
      category: (b.type as DemoDue["type"]) ?? "other",
      status: publish ? "active" : "draft",
      paidCount: 0,
      memberCount: store.members.length,
      assignedRepId: (b.assignedRepId as string) ?? DEMO_USER_ID,
      allowGuests: !!b.allowGuests,
      guestFields: (b.guestFields as DemoDue["guestFields"]) ?? null,
      guestPaidCount: 0,
      publishedAt: publish ? at : null,
      closedAt: null,
      createdAt: at,
      paidBy: [],
      guests: [],
    };
    store.dues.unshift(d);
    audit("due.created", `Created ${publish ? "and published " : "the draft "}“${d.title}”`);
    return toRepDue(d);
  }],
  ["PATCH", `${S}/dues/([^/]+)`, ({ params: [, id], body }) => {
    const d = findDue(id);
    const b = json(body);
    Object.assign(d, b, b.type ? { category: b.type } : {});
    if (b.publish && d.status === "draft") Object.assign(d, { status: "active", publishedAt: now() });
    return toRepDue(d);
  }],
  ["DELETE", `${S}/dues/([^/]+)`, ({ params: [, id] }) => {
    store.dues = store.dues.filter((d) => d.id !== id);
  }],
  ["POST", `${S}/dues/([^/]+)/publish`, ({ params: [, id] }) => {
    const d = Object.assign(findDue(id), { status: "active", publishedAt: now() });
    audit("due.published", `Published “${d.title}”`);
    return toRepDue(d);
  }],
  ["POST", `${S}/dues/([^/]+)/close`, ({ params: [, id] }) => {
    const d = Object.assign(findDue(id), { status: "closed", closedAt: now() });
    audit("due.closed", `Closed “${d.title}”`);
    return toRepDue(d);
  }],
  ["POST", `${S}/dues/([^/]+)/reassign`, ({ params: [, id], body }) => toRepDue(Object.assign(findDue(id), { assignedRepId: json(body).userId as string }))],
  ["POST", `${S}/dues/([^/]+)/remind`, ({ params: [, id] }) => {
    const d = findDue(id);
    audit("due.reminded", `Reminded ${store.members.length - d.paidBy.length} unpaid students about “${d.title}”`);
  }],
  ["GET", `${S}/dues/([^/]+)/collections`, ({ params: [, id], query }) => {
    const d = findDue(id);
    const paidIndex = new Map(d.paidBy.map((m, i) => [m, i]));
    const status = query.get("status");
    const q = query.get("q");
    const students: CollectionStudent[] = store.members
      .map((m) => {
        const i = paidIndex.get(m.id);
        return {
          id: m.id,
          name: m.name,
          matricNo: m.matricNo,
          level: m.level,
          email: m.email,
          status: i === undefined ? ("unpaid" as const) : ("paid" as const),
          paidAt: i === undefined ? null : paidAtFor(d, i),
          reference: i === undefined ? null : paymentRef(d, m.id),
        };
      })
      .filter((s) => (!status || status === "all" || s.status === status) && matches(q, s.name, s.matricNo, s.email));
    const n = store.members.length;
    const collected = collectedFor(d);
    const page = paginate(students, query, 100);
    return {
      data: {
        totals: {
          paid: d.paidBy.length,
          unpaid: n - d.paidBy.length,
          collected,
          fees: 0,
          net: collected,
          expected: n * d.amount,
          rate: n ? d.paidBy.length / n : 0,
          guestPaid: d.guests.length,
        },
        students: page.data,
        guests: d.guests,
      },
      meta: page.meta,
    };
  }],

  // ---- Payouts ---------------------------------------------------------------
  ["GET", `${S}/payout/summary`, payoutSummary],
  ["GET", `${S}/ledger`, ledger],
  ["GET", `${S}/payouts`, ({ query }) => paginate(store.payouts, query)],
  ["GET", `${S}/payout/beneficiaries`, () => store.beneficiaries],
  ["POST", `${S}/payout/beneficiaries/lookup`, ({ body }) => {
    const b = json(body);
    return {
      bankCode: b.bankCode,
      bankName: BANKS.find((x) => x.code === b.bankCode)?.name ?? "Bank",
      accountNumber: `•••• ${String(b.accountNumber ?? "").slice(-4)}`,
      accountName: "OKONKWO ADAEZE C",
    };
  }],
  ["POST", `${S}/payout/beneficiaries`, ({ body }) => {
    const b = json(body);
    const ben = {
      id: uid("demo-ben"),
      label: (b.label as string) || null,
      bankCode: String(b.bankCode),
      bankName: BANKS.find((x) => x.code === b.bankCode)?.name ?? "Bank",
      accountNumber: `•••• ${String(b.accountNumber ?? "").slice(-4)}`,
      accountName: "OKONKWO ADAEZE C",
      createdAt: now(),
    };
    store.beneficiaries.unshift(ben);
    return ben;
  }],
  ["DELETE", `${S}/payout/beneficiaries/([^/]+)`, ({ params: [, id] }) => {
    store.beneficiaries = store.beneficiaries.filter((b) => b.id !== id);
    return { removed: true };
  }],
  ["GET", `${S}/payout/quote`, ({ query }) => {
    const amount = Number(query.get("amount")) || 0;
    const fee = withdrawalFee(amount);
    return { amount, fee, net: Math.max(0, amount - fee), minPayout: MIN_PAYOUT, belowMinimum: amount < MIN_PAYOUT, feeBeforeDiscount: fee, discount: 0, discountPercent: 0 };
  }],
  ["POST", `${S}/payout/request`, ({ body }) => {
    const p = createPayout(json(body));
    audit("payout.requested", `Withdrew ₦${(p.amount / 100).toLocaleString("en-NG")} to ${p.account}`);
    return p;
  }],
  ["GET", `${S}/payout/dues`, () => {
    const { available } = payoutSummary();
    const total = totalCollected() || 1;
    return store.dues
      .filter((d) => d.status !== "draft")
      .map((d) => ({ id: d.id, title: d.title, type: d.type, status: d.status, assignedRepId: d.assignedRepId, available: Math.floor((collectedFor(d) * available) / total) }));
  }],
  ["GET", `${S}/payout/breakdown`, () => {
    const byDue = store.dues
      .filter((d) => collectedFor(d) > 0)
      .map((d) => ({ dueId: d.id, title: d.title, type: d.type, paidCount: d.paidBy.length + d.guests.length, collected: collectedFor(d), fees: 0, net: collectedFor(d) }))
      .sort((a, b) => b.net - a.net);
    const totals = byDue.reduce((t, d) => ({ collected: t.collected + d.collected, fees: 0, net: t.net + d.net, paidCount: t.paidCount + d.paidCount }), { collected: 0, fees: 0, net: 0, paidCount: 0 });
    return { data: { totals, byDue }, meta: { page: 1, perPage: byDue.length, total: byDue.length, totalPages: 1 } };
  }],
  ["PUT", `${S}/payout/pin`, () => ({ withdrawalPinSet: true, change: "changed", withdrawalPinHoldUntil: null })],
  ["POST", `${S}/payout/pin/reset`, () => ({ withdrawalPinSet: true, change: "reset", withdrawalPinHoldUntil: null })],
  ["PUT", `${S}/payout/signatories`, () => unavailable("Changing signatories is disabled in the demo.")],
  ["PUT", `${S}/payout/security`, () => unavailable("Changing withdrawal security is disabled in the demo.")],
  ["GET", `${S}/payout/kyc-status`, kycStatus],
  ["POST", `${S}/payout/kyc.*`, () => store.kyc],
  ["POST", `${S}/payout/([^/]+)/otp`, () => ({ sent: true, expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() })],
  ["POST", `${S}/payout/([^/]+)/(approve|reject)`, ({ params: [, id] }) => store.payouts.find((p) => p.id === id) ?? notFound()],
  ["GET", `${S}/payout/([^/]+)`, ({ params: [, id] }) => store.payouts.find((p) => p.id === id) ?? notFound()],

  // ---- Guest pay (public links) ---------------------------------------------------
  ["GET", "/public/dues/([^/]+)", ({ params: [id] }) => {
    const d = publicDue(id!);
    const fee = processingFee(d.amount);
    return {
      id: d.id,
      title: d.title,
      note: d.note,
      type: d.type,
      dueDate: d.dueDate.slice(0, 10),
      amount: d.amount,
      fee,
      total: d.amount + fee,
      canCollect: true,
      fields: guestQuestions(d.guestFields),
      space: { id: store.space.id, name: store.space.name, short: store.space.short, kind: store.space.kind, hue: store.space.hue },
    };
  }],
  ["POST", "/public/dues/([^/]+)/checkout", ({ params: [id], body }) => {
    const d = publicDue(id!);
    const b = json(body) as { name?: string; email?: string; matricNo?: string; answers?: Record<string, string>; createAccount?: boolean };
    const email = String(b.email ?? "").trim().toLowerCase();
    if (d.guests.some((g) => g.email === email)) {
      throw new ApiError("This email has already paid for this.", { code: "DUE_ALREADY_PAID", status: 409 });
    }
    if (!b.matricNo?.trim()) {
      throw new ApiError("Request validation failed", {
        code: "VALIDATION_ERROR",
        status: 400,
        details: [{ field: "matricNo", issue: "Matric number is required" }],
      });
    }
    const answers = checkAnswers(guestQuestions(d.guestFields), b.answers);
    // Asking again with the same email reuses the open checkout, as the API does.
    const open = [...guestCheckouts.values()].find((g) => g.dueId === d.id && g.payer.email === email && g.checkout.status === "pending");
    if (open) {
      open.answers = answers;
      open.accountRequested = !!b.createAccount;
      return { ...open.checkout, token: "demo", reused: true };
    }
    const fee = processingFee(d.amount);
    const total = d.amount + fee;
    const expiresAt = new Date(Date.now() + 30 * 60_000).toISOString();
    const reference = ref();
    const checkout: Checkout = {
      reference,
      status: "pending",
      spaceId: store.space.id,
      amount: total,
      breakdown: { face: d.amount, fee, total },
      items: [{ dueId: d.id, title: d.title, amount: d.amount, fee }],
      bankTransfer: { accountNumber: "9912345678", bankName: "Demo Bank", accountName: `Duevy / ${store.space.short}`, amountKobo: total, expiresAt },
      checkoutUrl: null,
      expiresAt,
      paidAt: null,
      receivedKobo: null,
      overpaidKobo: 0,
      createdAt: now(),
    };
    guestCheckouts.set(reference, {
      checkout,
      dueId: d.id,
      payer: { name: String(b.name ?? "").trim(), email, matricNo: b.matricNo?.trim() || null },
      answers,
      receiptNumber: null,
      openedAt: Date.now(),
      accountRequested: !!b.createAccount,
      inviteSentAt: null,
    });
    return { ...checkout, token: "demo" };
  }],
  ["GET", "/public/checkouts/([^/]+)", ({ params: [reference] }) => {
    const g = guestCheckouts.get(reference!) ?? notFound();
    settleGuestCheckout(g);
    return guestStatus(g);
  }],
  ["POST", "/public/checkouts/([^/]+)/account", ({ params: [reference] }) => {
    const g = guestCheckouts.get(reference!) ?? notFound();
    g.accountRequested = true;
    const paid = g.checkout.status === "paid";
    if (paid) g.inviteSentAt = now();
    return { outcome: paid ? "sent" : "not_paid", account: guestStatus(g).account };
  }],
  // ---- Receipt design ----------------------------------------------------------
  ["GET", `${S}/receipt-design`, () => receiptDesign],
  ["PUT", `${S}/receipt-design`, ({ body }) => {
    const { signatures, ...rest } = json(body) as Partial<ReceiptDesignSettings>;
    // Text and order for signatures that exist, as the API does.
    if (signatures) {
      receiptDesign.signatures = signatures.flatMap((s) => {
        const found = receiptDesign.signatures.find((x) => x.id === s.id);
        return found ? [{ ...found, name: s.name, role: s.role }] : [];
      });
    }
    return Object.assign(receiptDesign, rest, { updatedAt: now() });
  }],
  ["POST", `${S}/receipt-design/(logo|stamp)`, async ({ params: [, image], body }) => {
    const file = body instanceof FormData ? body.get("file") : null;
    if (!(file instanceof Blob)) return unavailable();
    return Object.assign(receiptDesign, { [image === "logo" ? "logo" : "stampImage"]: await readDataUrl(file), updatedAt: now() });
  }],
  ["DELETE", `${S}/receipt-design/(logo|stamp)`, ({ params: [, image] }) =>
    Object.assign(receiptDesign, { [image === "logo" ? "logo" : "stampImage"]: null, updatedAt: now() })],
  ["POST", `${S}/receipt-design/signatures`, () => {
    if (receiptDesign.signatures.length >= MAX_SIGNATURES) return unavailable("A receipt can have up to 3 signatures.");
    receiptDesign.signatures.push({ id: uid("demo-sig"), name: null, role: null, image: null });
    return receiptDesign;
  }],
  ["DELETE", `${S}/receipt-design/signatures/([^/]+)`, ({ params: [, id] }) => {
    receiptDesign.signatures = receiptDesign.signatures.filter((s) => s.id !== id);
    return receiptDesign;
  }],
  ["POST", `${S}/receipt-design/signatures/([^/]+)/image`, async ({ params: [, id], body }) => {
    const file = body instanceof FormData ? body.get("file") : null;
    const sig = receiptDesign.signatures.find((s) => s.id === id);
    if (!(file instanceof Blob) || !sig) return notFound();
    sig.image = await readDataUrl(file);
    return receiptDesign;
  }],
  ["DELETE", `${S}/receipt-design/signatures/([^/]+)/image`, ({ params: [, id] }) => {
    const sig = receiptDesign.signatures.find((s) => s.id === id);
    if (sig) sig.image = null;
    return receiptDesign;
  }],
  // ---- Polls -------------------------------------------------------------------
  ["GET", `${S}/polls`, () => store.polls],
  ["POST", `${S}/polls/image`, ({ body }) => {
    const file = body instanceof FormData ? body.get("file") : null;
    return { imageUrl: file instanceof Blob ? URL.createObjectURL(file) : null };
  }],
  ["POST", `${S}/polls`, ({ body }) => {
    const b = json(body) as Record<string, never>;
    const poll: Poll = {
      id: uid("demo-poll"),
      spaceId: SPACE_ID,
      title: b.title ?? "New poll",
      description: b.description ?? "",
      deadline: b.deadline ?? now(),
      status: b.publish ? "active" : "draft",
      membersOnly: !!b.membersOnly,
      paid: !!b.paid,
      amountPerVote: b.amountPerVote ?? 0,
      slug: uid("poll"),
      totalVotes: 0,
      revenue: 0,
      coverImageUrl: b.coverImageUrl ?? null,
      themeColor: b.themeColor ?? null,
      categories: ((b.categories ?? []) as { title: string; imageUrl?: string; nominees: { name: string }[] }[]).map((c) => ({
        id: uid("demo-cat"),
        title: c.title,
        imageUrl: c.imageUrl ?? null,
        nominees: c.nominees.map((n) => ({ ...n, id: uid("demo-nom"), votes: 0 })),
      })),
    };
    store.polls.unshift(poll);
    return poll;
  }],
  ["PATCH", `${S}/polls/([^/]+)`, ({ params: [, id], body }) => {
    const p = store.polls.find((x) => x.id === id) ?? notFound();
    return Object.assign(p, json(body));
  }],
  ["POST", `${S}/polls/([^/]+)/(publish|close)`, ({ params: [, id, action] }) => {
    const p = store.polls.find((x) => x.id === id) ?? notFound();
    return Object.assign(p, { status: action === "publish" ? "active" : "closed" });
  }],
  ["GET", `${S}/polls/([^/]+)/results`, ({ params: [, id] }) => pollResults(store.polls.find((x) => x.id === id) ?? notFound())],
];

const compiled = routes.map(([method, pattern, handler]) => ({ method, re: new RegExp(`^${pattern}$`), handler }));

/** Makes demo screens feel like they load, without slowing a walkthrough down. */
const latency = () => new Promise((r) => setTimeout(r, 120 + Math.random() * 180));

function isPage(value: unknown): value is Page<unknown> {
  return !!value && typeof value === "object" && "data" in value && "meta" in value && Object.keys(value).length === 2;
}

export async function demoRequest<T>(method: string, path: string, body: unknown): Promise<Page<T>> {
  await latency();
  const [pathname, search = ""] = path.split("?");
  for (const route of compiled) {
    if (route.method !== method) continue;
    const match = pathname.match(route.re);
    if (!match) continue;
    const result = await route.handler({ params: match.slice(1), query: new URLSearchParams(search), body: body as Body });
    // Return copies so callers mutating responses can't corrupt the store.
    const copy = result === undefined ? undefined : structuredClone(result);
    return (isPage(copy) ? copy : { data: copy }) as Page<T>;
  }
  return unavailable();
}

/** A one-page PDF standing in for receipts and exports. */
export async function demoBlob(path: string): Promise<Blob> {
  await latency();
  if (/\/receipt-design\/sample$/.test(path)) {
    const { renderDemoReceipt } = await import("./receipt-sample");
    return renderDemoReceipt(receiptDesign, store.space.name);
  }
  // A demo guest's receipt, in the space's receipt design.
  const guestReceipt = path.match(/^\/public\/checkouts\/([^/?]+)\/receipt/);
  const g = guestReceipt && guestCheckouts.get(decodeURIComponent(guestReceipt[1]!));
  if (g?.receiptNumber) {
    const { renderDemoReceipt } = await import("./receipt-sample");
    return renderDemoReceipt(receiptDesign, store.space.name, {
      number: g.receiptNumber,
      reference: g.checkout.reference,
      payer: g.payer.name,
      item: g.checkout.items[0]!.title,
      face: g.checkout.breakdown.face,
      fee: g.checkout.breakdown.fee,
      answers: g.answers.map((a) => [a.label, a.value]),
    });
  }
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text("Duevy — demo receipt", 20, 30);
  doc.setFontSize(11);
  doc.text("This document was generated from sample data in demo mode.", 20, 42);
  doc.text(`Requested: ${path}`, 20, 50);
  doc.text(`Generated: ${new Date().toLocaleString("en-NG")}`, 20, 58);
  return doc.output("blob");
}
