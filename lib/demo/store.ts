/**
 * The demo store: one mutable `DemoState` held in memory and mirrored to
 * localStorage, plus the derived reads the API router serves from it.
 *
 * Both demo accounts read and write the *same* state, which is what makes the
 * demo hang together — when Aisha pays a due, Tunde's collection rate, payout
 * balance and notification feed all move with it.
 */
import type {
  AuditEntry,
  CollectionStudent,
  CollectionTotals,
  Due,
  DueStatus,
  RepDue,
  Space,
  SpaceMembershipSummary,
  User,
} from "@/lib/api/types";
import { computeCharge } from "./money";
import {
  CO_REP_ID,
  createInitialState,
  DEMO_STATE_VERSION,
  REP_ID,
  type DemoDue,
  type DemoState,
  type DemoUser,
} from "./seed";

const STORAGE_KEY = "duevy:demo:v1";

let state: DemoState | null = null;

function load(): DemoState {
  if (state) return state;

  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DemoState;
        // A fixture change bumps the version and invalidates whatever a
        // previous run left behind, rather than merging two shapes.
        if (parsed?.version === DEMO_STATE_VERSION) {
          state = parsed;
          return state;
        }
      }
    } catch {
      // Private mode, blocked storage, corrupt JSON — fall through to a fresh seed.
    }
  }

  state = createInitialState();
  persist();
  return state;
}

function persist() {
  if (typeof window === "undefined" || !state) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable — the in-memory copy still drives this session.
  }
}

/** Read the current state, with the simulated clock applied. */
export function getState(): DemoState {
  const s = load();
  if (advanceClock(s)) persist();
  return s;
}

/** Mutate and persist in one step. */
export function mutate<T>(fn: (s: DemoState) => T): T {
  const s = load();
  const result = fn(s);
  persist();
  return result;
}

/** Wipe everything and rebuild the fixtures — the "start the demo over" button. */
export function resetDemo() {
  state = createInitialState();
  persist();
}

// ---------------------------------------------------------------------------
// Simulated clock
// ---------------------------------------------------------------------------

/** A requested payout collects its second approval this long after it is raised. */
const APPROVAL_AFTER_MS = 8_000;
/** ...and settles this long after that. */
const SETTLE_AFTER_MS = 18_000;

/**
 * Walks in-flight payouts forward so a rep who requests one during the demo
 * actually sees it approved and settled a few seconds later, instead of a row
 * that sits at "pending" forever. Derived from elapsed time rather than a
 * timer, so it is correct after a reload and needs nothing running in the
 * background. Returns true if anything moved.
 */
function advanceClock(s: DemoState): boolean {
  let changed = false;
  const now = Date.now();

  for (const p of s.payouts) {
    if (p.status !== "pending_approval" && p.status !== "processing") continue;
    const age = now - new Date(p.requestedAt).getTime();

    if (p.status === "pending_approval" && age >= APPROVAL_AFTER_MS) {
      const approver = p.requestedById === REP_ID ? CO_REP_ID : REP_ID;
      if (!p.decisions.some((d) => d.repUserId === approver)) {
        p.decisions.push({
          repUserId: approver,
          repName: s.reps.find((r) => r.id === approver)?.name ?? "Co-rep",
          decision: "approved",
          decidedAt: new Date(new Date(p.requestedAt).getTime() + APPROVAL_AFTER_MS).toISOString(),
        });
      }
      p.status = "processing";
      changed = true;
    }

    if (p.status === "processing" && age >= SETTLE_AFTER_MS) {
      p.status = "completed";
      p.settledAt = new Date(new Date(p.requestedAt).getTime() + SETTLE_AFTER_MS).toISOString();
      pushNotification(s, {
        userId: p.requestedById ?? REP_ID,
        kind: "payout_settled",
        tone: "brand",
        title: "Payout settled",
        detail: `${naira(p.amount)} landed in ${p.account}.`,
        href: "/dashboard/payout",
      });
      changed = true;
    }
  }

  return changed;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function naira(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(kobo / 100);
}

export function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export function findUser(s: DemoState, id: string | null): DemoUser | null {
  if (!id) return null;
  return s.users.find((u) => u.id === id) ?? null;
}

export function currentUser(s: DemoState): DemoUser | null {
  return findUser(s, s.currentUserId);
}

export function isRep(s: DemoState, user: DemoUser | null): boolean {
  if (!user) return false;
  return user.role === "rep" || s.reps.some((r) => r.id === user.id);
}

/** The wire shape of a user — never carries the password. */
export function publicUser(s: DemoState, user: DemoUser): User {
  const spaces: SpaceMembershipSummary[] = user.membership
    ? [
        {
          id: s.space.id,
          name: s.space.name,
          short: s.space.short,
          kind: s.space.kind,
          hue: s.space.hue,
          // Only a rep ever sees the join code on their membership row.
          joinCode: user.membership === "lead" || user.membership === "co" ? s.space.joinCode : null,
          membership: user.membership,
        },
      ]
    : [];

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    role: user.role,
    repApplicationStatus: user.repApplicationStatus,
    matricNo: user.matricNo,
    level: user.level,
    referralCode: user.referralCode,
    spaces,
    createdAt: user.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Spaces
// ---------------------------------------------------------------------------

export function memberCount(s: DemoState): number {
  return s.users.filter((u) => u.membership !== null).length;
}

export function publicSpace(s: DemoState, viewer: DemoUser | null): Space {
  const membership =
    viewer?.membership === "lead" || viewer?.membership === "co"
      ? ("rep" as const)
      : viewer?.membership === "guest"
        ? ("guest" as const)
        : viewer?.membership === "member"
          ? ("member" as const)
          : undefined;

  return {
    id: s.space.id,
    name: s.space.name,
    short: s.space.short,
    kind: s.space.kind,
    hue: s.space.hue,
    theme: s.space.theme,
    about: s.space.about,
    faculty: s.space.faculty,
    school: s.space.school,
    memberCount: memberCount(s),
    membership,
    createdAt: s.space.createdAt,
  };
}

// ---------------------------------------------------------------------------
// Dues
// ---------------------------------------------------------------------------

export function paymentFor(s: DemoState, userId: string, dueId: string) {
  return s.payments.find((p) => p.userId === userId && p.dueId === dueId) ?? null;
}

export function dueStatusFor(s: DemoState, userId: string, due: DemoDue): DueStatus {
  if (paymentFor(s, userId, due.id)) return "paid";
  return new Date(due.dueDate).getTime() < Date.now() ? "overdue" : "unpaid";
}

/** A due as the student API returns it, with the viewer's own payment state. */
export function studentDue(s: DemoState, userId: string, due: DemoDue): Due {
  const charge = computeCharge(due.amount);
  const payment = paymentFor(s, userId, due.id);
  return {
    id: due.id,
    spaceId: due.spaceId,
    title: due.title,
    note: due.note,
    amount: due.amount,
    processingFee: charge.totalFee,
    payableAmount: charge.totalCharged,
    dueDate: due.dueDate,
    category: due.category,
    status: dueStatusFor(s, userId, due),
    paidAt: payment?.paidAt ?? null,
    reference: payment?.reference ?? null,
  };
}

/** Dues a student can actually see: published, in a space they belong to. */
export function visibleDues(s: DemoState, user: DemoUser): DemoDue[] {
  if (!user.membership) return [];
  return s.dues.filter((d) => d.status !== "draft");
}

export function repDue(s: DemoState, due: DemoDue): RepDue {
  const charge = computeCharge(due.amount);
  return {
    id: due.id,
    spaceId: due.spaceId,
    title: due.title,
    note: due.note,
    amount: due.amount,
    processingFee: charge.totalFee,
    payableAmount: charge.totalCharged,
    dueDate: due.dueDate,
    category: due.category,
    status: due.status,
    allowGuests: due.allowGuests,
    paidAt: null,
    reference: null,
    paidCount: s.payments.filter((p) => p.dueId === due.id).length,
    memberCount: memberCount(s),
    assignedRepId: due.assignedRepId,
  };
}

// ---------------------------------------------------------------------------
// Collections
// ---------------------------------------------------------------------------

export function collectionsFor(
  s: DemoState,
  dueId: string,
): { totals: CollectionTotals; students: CollectionStudent[] } {
  const due = s.dues.find((d) => d.id === dueId);
  const members = s.users.filter((u) => u.membership !== null);

  const students: CollectionStudent[] = members.map((u) => {
    const payment = paymentFor(s, u.id, dueId);
    return {
      id: u.id,
      name: u.name,
      matricNo: u.matricNo ?? "—",
      level: u.level,
      email: u.email,
      status: payment ? "paid" : "unpaid",
      paidAt: payment?.paidAt ?? null,
      reference: payment?.reference ?? null,
    };
  });

  const paidRows = s.payments.filter((p) => p.dueId === dueId);
  const paid = paidRows.length;
  const unpaid = students.length - paid;
  // `collected` is what payers sent; `fees` is the 3% inside it; `net` is the
  // face value the space keeps — which is the number the rep actually cares about.
  const collected = paidRows.reduce((sum, p) => sum + p.amountPaid, 0);
  const fees = paidRows.reduce((sum, p) => sum + p.processingFee + p.duevyFee, 0);
  const net = paidRows.reduce((sum, p) => sum + p.netToSpace, 0);
  const expected = (due?.amount ?? 0) * students.length;

  return {
    totals: {
      paid,
      unpaid,
      collected,
      fees,
      net,
      expected,
      rate: students.length ? Math.round((paid / students.length) * 100) : 0,
    },
    students,
  };
}

// ---------------------------------------------------------------------------
// Payouts
// ---------------------------------------------------------------------------

/**
 * Space (or single-due) balance. `available` is the face value collected minus
 * everything already withdrawn or in flight — the same source of truth the
 * breakdown screen itemises per due.
 */
export function payoutSummary(s: DemoState, dueId?: string) {
  const payments = dueId ? s.payments.filter((p) => p.dueId === dueId) : s.payments;
  const payouts = dueId ? s.payouts.filter((p) => p.dueId === dueId) : s.payouts;

  const collectedNet = payments.reduce((sum, p) => sum + p.netToSpace, 0);
  const inFlight = payouts
    .filter((p) => p.status === "pending_approval" || p.status === "processing")
    .reduce((sum, p) => sum + p.amount, 0);
  const settled = payouts
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  return {
    available: Math.max(0, collectedNet - inFlight - settled),
    pending: inFlight,
    lifetime: settled,
  };
}

/** 70% of the space's reps must approve before a payout disburses. */
export function requiredApprovals(s: DemoState): number {
  return Math.max(1, Math.ceil(s.reps.length * 0.7));
}

export function approvalStatus(s: DemoState, payoutId: string) {
  const payout = s.payouts.find((p) => p.id === payoutId);
  const approved = payout?.decisions.filter((d) => d.decision === "approved").length ?? 0;
  const required = requiredApprovals(s);
  return {
    totalReps: s.reps.length,
    approvedCount: approved,
    requiredCount: required,
    met: approved >= required,
    decisions: payout?.decisions ?? [],
  };
}

// ---------------------------------------------------------------------------
// Notifications & audit
// ---------------------------------------------------------------------------

export function pushNotification(
  s: DemoState,
  n: {
    userId: string;
    kind: string;
    tone: "brand" | "amber" | "rose";
    title: string;
    detail: string;
    href: string | null;
  },
) {
  s.notifications.unshift({
    id: newId("ntf"),
    read: false,
    createdAt: new Date().toISOString(),
    ...n,
  });
}

export function pushAudit(
  s: DemoState,
  entry: { action: string; description: string; actor: DemoUser },
) {
  const role = s.reps.find((r) => r.id === entry.actor.id)?.role ?? null;
  const row: AuditEntry = {
    id: newId("aud"),
    action: entry.action,
    description: entry.description,
    actor: { id: entry.actor.id, name: entry.actor.name, role },
    createdAt: new Date().toISOString(),
  };
  s.auditLog.unshift(row);
}
