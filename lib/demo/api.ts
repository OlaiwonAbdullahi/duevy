/**
 * The demo API. Serves every student- and rep-facing endpoint out of the local
 * fixture store, matching the real API's shapes exactly so nothing above
 * `lib/api/client` has to know the difference.
 *
 * Routes are matched in registration order, so literal segments are always
 * registered before their `:param` siblings (`/payout/summary` before
 * `/payout/:payoutId`).
 *
 * Admin endpoints are deliberately not implemented — the demo ships a student
 * and a rep account only, and an unmatched path throws rather than quietly
 * returning empty data.
 */
import { ApiError } from "@/lib/api/errors";
import type {
  ApiMeta,
  Due,
  NotificationItem,
  Payout,
  Poll,
  PollCategory,
  Transaction,
} from "@/lib/api/types";
import { DEMO_LATENCY_MS } from "./config";
import { computeCharge, computePayoutFees, MIN_PAYOUT_KOBO, payoutReference, reference } from "./money";
import {
  REP_ID,
  type DemoDue,
  type DemoNotification,
  type DemoPayout,
  type DemoState,
  type DemoUser,
} from "./seed";
import {
  approvalStatus,
  collectionsFor,
  currentUser,
  findUser,
  getState,
  isRep,
  memberCount,
  mutate,
  naira,
  newId,
  paymentFor,
  payoutSummary,
  publicSpace,
  publicUser,
  pushAudit,
  pushNotification,
  repDue,
  studentDue,
  visibleDues,
} from "./store";

// ---------------------------------------------------------------------------
// Plumbing
// ---------------------------------------------------------------------------

type Ctx = {
  s: DemoState;
  params: string[];
  query: URLSearchParams;
  body: unknown;
  me: DemoUser;
};

/** A handler's return value when it needs to set `meta` alongside `data`. */
type Paged = { __paged: true; data: unknown; meta?: ApiMeta };

function page(data: unknown, meta?: ApiMeta): Paged {
  return { __paged: true, data, meta };
}

type Handler = (ctx: Ctx) => unknown | Promise<unknown>;

type Route = {
  method: string;
  pattern: RegExp;
  handler: Handler;
  /** Routes reachable while signed out. */
  publicRoute?: boolean;
};

const routes: Route[] = [];

/** `/spaces/:id/dues/:dueId` → a regex with one capture group per `:param`. */
function route(method: string, path: string, handler: Handler, publicRoute = false) {
  const pattern = new RegExp(
    "^" + path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/:[A-Za-z]+/g, "([^/]+)") + "$",
  );
  routes.push({ method, pattern, handler, publicRoute });
}

function fail(status: number, code: string, message: string): never {
  throw new ApiError(message, { code, status });
}

function body<T>(ctx: Ctx): T {
  return (ctx.body ?? {}) as T;
}

function paginate<T>(rows: T[], query: URLSearchParams): { rows: T[]; meta: ApiMeta } {
  const perPage = Number(query.get("perPage")) || 20;
  const pageNo = Number(query.get("page")) || 1;
  const start = (pageNo - 1) * perPage;
  return {
    rows: rows.slice(start, start + perPage),
    meta: {
      page: pageNo,
      perPage,
      total: rows.length,
      totalPages: Math.max(1, Math.ceil(rows.length / perPage)),
    },
  };
}

function requireRep(ctx: Ctx): DemoUser {
  if (!isRep(ctx.s, ctx.me)) {
    fail(403, "FORBIDDEN", "This is a rep-only action.");
  }
  return ctx.me;
}

function requireLead(ctx: Ctx): DemoUser {
  const rep = ctx.s.reps.find((r) => r.id === ctx.me.id);
  if (rep?.role !== "lead") {
    fail(403, "FORBIDDEN", "Only the lead rep can do this.");
  }
  return ctx.me;
}

function findDue(ctx: Ctx, dueId: string): DemoDue {
  const due = ctx.s.dues.find((d) => d.id === dueId);
  if (!due) fail(404, "NOT_FOUND", "That due no longer exists.");
  return due;
}

function findPoll(ctx: Ctx, idOrSlug: string): Poll {
  const poll = ctx.s.polls.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
  if (!poll) fail(404, "NOT_FOUND", "That poll no longer exists.");
  return poll;
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

/** Pulls the single `file` out of a multipart body. */
function formFile(ctx: Ctx): File {
  const form = ctx.body;
  if (!(typeof FormData !== "undefined" && form instanceof FormData)) {
    fail(422, "VALIDATION_ERROR", "No file was attached.");
  }
  const file = form.get("file");
  if (!(file instanceof File)) fail(422, "VALIDATION_ERROR", "No file was attached.");
  return file;
}

/**
 * Wire shapes. The store carries a couple of fields the API never sends — which
 * user a notification belongs to, and a payout's approval votes (those ride on
 * the single-payout read instead). Mapped explicitly so the demo can't leak an
 * internal field the real API wouldn't.
 */
function wireNotification(n: DemoNotification): NotificationItem {
  return {
    id: n.id,
    kind: n.kind,
    tone: n.tone,
    title: n.title,
    detail: n.detail,
    href: n.href,
    read: n.read,
    createdAt: n.createdAt,
  };
}

function wirePayout(p: DemoPayout): Payout {
  return {
    id: p.id,
    dueId: p.dueId,
    amount: p.amount,
    reference: p.reference,
    status: p.status,
    account: p.account,
    note: p.note,
    requestedById: p.requestedById,
    requestedAt: p.requestedAt,
    cancelledAt: p.cancelledAt,
    settledAt: p.settledAt,
    failureReason: p.failureReason,
  };
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

route(
  "POST",
  "/auth/login",
  (ctx) => {
    const { email, password } = body<{ email?: string; password?: string }>(ctx);
    const user = ctx.s.users.find(
      (u) => u.email.toLowerCase() === String(email ?? "").trim().toLowerCase(),
    );
    if (!user || !user.password || user.password !== password) {
      fail(
        401,
        "INVALID_CREDENTIALS",
        "Those details don't match a demo account. Use the demo buttons below, or student@duevy.demo / rep@duevy.demo with Demo1234!",
      );
    }
    ctx.s.currentUserId = user.id;
    return { user: publicUser(ctx.s, user), accessToken: `demo.${user.id}` };
  },
  true,
);

route(
  "POST",
  "/auth/refresh",
  (ctx) => {
    if (!ctx.s.currentUserId) fail(401, "UNAUTHENTICATED", "No demo session.");
    return { accessToken: `demo.${ctx.s.currentUserId}` };
  },
  true,
);

route("POST", "/auth/logout", (ctx) => {
  ctx.s.currentUserId = null;
  return undefined;
});

route("GET", "/auth/me", (ctx) => publicUser(ctx.s, ctx.me));

route(
  "POST",
  "/auth/register",
  (ctx) => {
    const payload = body<{
      name?: string;
      email?: string;
      matricNo?: string;
      password?: string;
      role?: "student" | "rep";
    }>(ctx);
    const email = String(payload.email ?? "").trim().toLowerCase();
    if (ctx.s.users.some((u) => u.email.toLowerCase() === email)) {
      fail(409, "EMAIL_TAKEN", "An account with that email already exists.");
    }
    const user: DemoUser = {
      id: newId("usr"),
      name: payload.name ?? "New user",
      email,
      emailVerified: true,
      phone: null,
      avatarUrl: null,
      role: "student",
      repApplicationStatus: payload.role === "rep" ? "pending" : "none",
      matricNo: payload.matricNo ?? null,
      level: null,
      referralCode: null,
      createdAt: new Date().toISOString(),
      password: payload.password ?? null,
      membership: null,
      joinedAt: new Date().toISOString(),
    };
    ctx.s.users.push(user);
    return { user: publicUser(ctx.s, user), accessToken: `demo.${user.id}` };
  },
  true,
);

route("POST", "/auth/forgot-password", () => undefined, true);
route("POST", "/auth/reset-password", () => undefined, true);
route("POST", "/auth/verify-email", () => undefined, true);

// ---------------------------------------------------------------------------
// Me
// ---------------------------------------------------------------------------

route("GET", "/me/overview", (ctx) => {
  const dues = visibleDues(ctx.s, ctx.me)
    .filter((d) => d.status === "active")
    .map((d) => studentDue(ctx.s, ctx.me.id, d));
  const open = dues.filter((d) => d.status !== "paid");

  const sessionStart = new Date();
  sessionStart.setMonth(sessionStart.getMonth() - 6);
  const paidThisSession = ctx.s.payments
    .filter((p) => p.userId === ctx.me.id && new Date(p.paidAt) >= sessionStart)
    .reduce((sum, p) => sum + p.amountPaid, 0);

  return {
    outstanding: {
      amount: open.reduce((sum, d) => sum + (d.payableAmount ?? d.amount), 0),
      count: open.length,
    },
    paidThisSession,
    openDues: open,
    recentTransactions: ctx.s.transactions.filter((t) => t.userId === ctx.me.id).slice(0, 5),
  };
});

route("PATCH", "/me", (ctx) => {
  const patch = body<{ name?: string; email?: string; phone?: string; avatarUrl?: string }>(ctx);
  const user = ctx.s.users.find((u) => u.id === ctx.me.id)!;
  if (patch.name !== undefined) user.name = patch.name;
  if (patch.phone !== undefined) user.phone = patch.phone;
  if (patch.avatarUrl !== undefined) user.avatarUrl = patch.avatarUrl;
  if (patch.email !== undefined && patch.email !== user.email) {
    user.email = patch.email;
    user.emailVerified = false;
  }
  return publicUser(ctx.s, user);
});

route("POST", "/me/avatar", async (ctx) => {
  const avatarUrl = await fileToDataUrl(formFile(ctx));
  const user = ctx.s.users.find((u) => u.id === ctx.me.id)!;
  user.avatarUrl = avatarUrl;
  return { avatarUrl };
});

route("PUT", "/me/password", (ctx) => {
  const { currentPassword, newPassword } = body<{
    currentPassword?: string;
    newPassword?: string;
  }>(ctx);
  const user = ctx.s.users.find((u) => u.id === ctx.me.id)!;
  if (user.password && currentPassword !== user.password) {
    fail(400, "INVALID_CREDENTIALS", "That isn't your current password.");
  }
  user.password = newPassword ?? user.password;
  return { success: true };
});

route("GET", "/me/notification-preferences", (ctx) => ctx.s.notificationPrefs[ctx.me.id]);

route("PUT", "/me/notification-preferences", (ctx) => {
  ctx.s.notificationPrefs[ctx.me.id] = body(ctx);
  return ctx.s.notificationPrefs[ctx.me.id];
});

route("GET", "/me/sessions", (ctx) => ctx.s.sessions);

route("DELETE", "/me/sessions/:id", (ctx) => {
  ctx.s.sessions = ctx.s.sessions.filter((x) => x.id !== ctx.params[0]);
  return undefined;
});

route("DELETE", "/me", (ctx) => {
  ctx.s.currentUserId = null;
  return undefined;
});

// ---------------------------------------------------------------------------
// Student dues & payments
// ---------------------------------------------------------------------------

route("GET", "/dues", (ctx) => {
  let rows: Due[] = visibleDues(ctx.s, ctx.me).map((d) => studentDue(ctx.s, ctx.me.id, d));
  const status = ctx.query.get("status");
  const category = ctx.query.get("category");
  if (status) rows = rows.filter((d) => d.status === status);
  if (category) rows = rows.filter((d) => d.category === category);
  const { rows: pageRows, meta } = paginate(rows, ctx.query);
  return page(pageRows, meta);
});

route("GET", "/dues/:dueId", (ctx) => studentDue(ctx.s, ctx.me.id, findDue(ctx, ctx.params[0])));

/**
 * Starts a checkout rather than settling on the spot, exactly like the real
 * flow. A second `pay` from the same user within a few seconds joins the
 * checkout already open instead of starting another — that is how paying a
 * batch of dues ends up at one checkout.
 */
route("POST", "/dues/:dueId/pay", (ctx) => {
  const due = findDue(ctx, ctx.params[0]);
  if (due.status !== "active") fail(409, "DUE_CLOSED", "This due isn't accepting payments.");
  if (paymentFor(ctx.s, ctx.me.id, due.id)) {
    fail(409, "ALREADY_PAID", "You've already paid this due.");
  }

  const charge = computeCharge(due.amount);
  const open = ctx.s.checkouts.find(
    (c) =>
      c.userId === ctx.me.id &&
      c.status === "pending" &&
      c.kind === "due" &&
      Date.now() - new Date(c.createdAt).getTime() < 5_000,
  );

  if (open) {
    if (!open.dueIds.includes(due.id)) {
      open.dueIds.push(due.id);
      open.amount += charge.totalCharged;
    }
    return {
      reference: open.reference,
      amount: open.amount,
      checkoutUrl: checkoutUrl(open.reference),
    };
  }

  const ref = reference();
  ctx.s.checkouts.push({
    reference: ref,
    userId: ctx.me.id,
    kind: "due",
    dueIds: [due.id],
    pollSlug: null,
    selections: [],
    amount: charge.totalCharged,
    createdAt: new Date().toISOString(),
    status: "pending",
  });
  return { reference: ref, amount: charge.totalCharged, checkoutUrl: checkoutUrl(ref) };
});

function checkoutUrl(ref: string) {
  return `/demo/checkout?reference=${encodeURIComponent(ref)}`;
}

route("GET", "/payments/:reference/status", (ctx) => {
  const ref = ctx.params[0];
  const checkout = ctx.s.checkouts.find((c) => c.reference === ref);
  if (!checkout) {
    // Already-settled payments keep answering after their checkout is gone.
    const payment = ctx.s.payments.find((p) => p.reference === ref);
    if (!payment) fail(404, "NOT_FOUND", "We don't have a payment with that reference.");
    return {
      status: "completed" as const,
      amount: payment.amountPaid,
      transaction: ctx.s.transactions.find((t) => t.reference === ref),
    };
  }
  return {
    status: checkout.status,
    amount: checkout.amount,
    checkoutUrl: checkout.status === "pending" ? checkoutUrl(ref) : undefined,
    transaction: ctx.s.transactions.find((t) => t.reference === ref),
  };
});

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

route("GET", "/transactions", (ctx) => {
  let rows: Transaction[] = ctx.s.transactions.filter((t) => t.userId === ctx.me.id);
  const type = ctx.query.get("type");
  const status = ctx.query.get("status");
  if (type) rows = rows.filter((t) => t.type === type);
  if (status) rows = rows.filter((t) => t.status === status);
  const { rows: pageRows, meta } = paginate(rows, ctx.query);
  return page(pageRows, meta);
});

route("GET", "/transactions/:id", (ctx) => {
  const txn = ctx.s.transactions.find((t) => t.id === ctx.params[0] && t.userId === ctx.me.id);
  if (!txn) fail(404, "NOT_FOUND", "That transaction doesn't exist.");
  return txn;
});

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

route("GET", "/notifications", (ctx) => {
  const mine: NotificationItem[] = ctx.s.notifications
    .filter((n) => n.userId === ctx.me.id)
    .map(wireNotification);
  const { rows, meta } = paginate(mine, ctx.query);
  return page(rows, { ...meta, unreadCount: mine.filter((n) => !n.read).length } as ApiMeta);
});

route("POST", "/notifications/:id/read", (ctx) => {
  const n = ctx.s.notifications.find((x) => x.id === ctx.params[0] && x.userId === ctx.me.id);
  if (!n) fail(404, "NOT_FOUND", "That notification is gone.");
  n.read = true;
  return wireNotification(n);
});

route("POST", "/notifications/read-all", (ctx) => {
  for (const n of ctx.s.notifications) if (n.userId === ctx.me.id) n.read = true;
  return undefined;
});

// ---------------------------------------------------------------------------
// Spaces (student side)
// ---------------------------------------------------------------------------

route("GET", "/spaces", (ctx) => (ctx.me.membership ? [publicSpace(ctx.s, ctx.me)] : []));

// Single-segment, so it can't shadow any of the `/spaces/:id/...` routes below.
route("GET", "/spaces/:id", (ctx) => {
  if (ctx.params[0] !== ctx.s.space.id) fail(404, "NOT_FOUND", "That space doesn't exist.");
  return publicSpace(ctx.s, ctx.me);
});

route("POST", "/spaces/lookup", (ctx) => {
  const { code } = body<{ code?: string }>(ctx);
  if (String(code ?? "").trim().toUpperCase() !== ctx.s.space.joinCode.toUpperCase()) {
    fail(404, "NOT_FOUND", "No department matches that code.");
  }
  return {
    ...publicSpace(ctx.s, ctx.me),
    code: ctx.s.space.joinCode,
    dues: ctx.s.dues
      .filter((d) => d.status === "active")
      .map((d) => studentDue(ctx.s, ctx.me.id, d)),
  };
});

route("POST", "/spaces/:id/join", (ctx) => {
  const { as } = body<{ as?: "member" | "guest" }>(ctx);
  const user = ctx.s.users.find((u) => u.id === ctx.me.id)!;
  const membership = as ?? "member";
  user.membership = membership;
  user.joinedAt = new Date().toISOString();
  pushNotification(ctx.s, {
    userId: REP_ID,
    kind: "member_joined",
    tone: "brand",
    title: "New member",
    detail: `${user.name} joined ${ctx.s.space.short}.`,
    href: "/dashboard/circle",
  });
  return {
    spaceId: ctx.s.space.id,
    status: "joined",
    membership,
    joinedAt: user.joinedAt,
  };
});

route("DELETE", "/spaces/:id/membership", (ctx) => {
  const user = ctx.s.users.find((u) => u.id === ctx.me.id)!;
  user.membership = null;
  return undefined;
});

// ---------------------------------------------------------------------------
// Rep: overview, dues, collections
// ---------------------------------------------------------------------------

route("GET", "/spaces/:id/overview", (ctx) => {
  requireRep(ctx);
  const active = ctx.s.dues.filter((d) => d.status === "active");
  const summary = payoutSummary(ctx.s);
  const members = memberCount(ctx.s);

  const expected = active.reduce((sum, d) => sum + d.amount * members, 0);
  const collected = ctx.s.payments
    .filter((p) => active.some((d) => d.id === p.dueId))
    .reduce((sum, p) => sum + p.netToSpace, 0);
  const unpaidCount = active.reduce(
    (sum, d) => sum + (members - ctx.s.payments.filter((p) => p.dueId === d.id).length),
    0,
  );

  return {
    space: publicSpace(ctx.s, ctx.me),
    joinCode: ctx.s.space.joinCode,
    stats: {
      collected: summary.available + summary.lifetime + summary.pending,
      outstanding: Math.max(0, expected - collected),
      unpaidCount,
      collectionRate: expected ? Math.round((collected / expected) * 100) : 0,
    },
    activeDues: active.map((d) => repDue(ctx.s, d)),
    newMembers: [...ctx.s.users]
      .filter((u) => u.membership !== null)
      .sort((a, b) => b.joinedAt.localeCompare(a.joinedAt))
      .slice(0, 5)
      .map((u) => ({
        id: u.id,
        name: u.name,
        matricNo: u.matricNo ?? "—",
        level: u.level,
        email: u.email,
        joinedAt: u.joinedAt,
      })),
  };
});

route("GET", "/spaces/:id/dues", (ctx) => {
  requireRep(ctx);
  let rows = ctx.s.dues;
  const status = ctx.query.get("status");
  const category = ctx.query.get("category");
  if (status) rows = rows.filter((d) => d.status === status);
  if (category) rows = rows.filter((d) => d.category === category);
  return rows.map((d) => repDue(ctx.s, d));
});

route("POST", "/spaces/:id/dues", (ctx) => {
  const rep = requireRep(ctx);
  const draft = body<{
    title?: string;
    note?: string;
    amount?: number;
    dueDate?: string;
    category?: DemoDue["category"];
    allowGuests?: boolean;
    publish?: boolean;
  }>(ctx);

  const due: DemoDue = {
    id: newId("due"),
    spaceId: ctx.s.space.id,
    title: draft.title ?? "Untitled due",
    note: draft.note ?? null,
    amount: draft.amount ?? 0,
    dueDate: draft.dueDate ?? new Date(Date.now() + 14 * 864e5).toISOString(),
    category: draft.category ?? "levy",
    status: draft.publish ? "active" : "draft",
    allowGuests: draft.allowGuests ?? false,
    assignedRepId: rep.id,
    createdAt: new Date().toISOString(),
  };
  ctx.s.dues.unshift(due);
  pushAudit(ctx.s, {
    action: draft.publish ? "due.published" : "due.created",
    description: `${draft.publish ? "Published" : "Drafted"} "${due.title}" (${naira(due.amount)})`,
    actor: rep,
  });
  if (draft.publish) announceDue(ctx.s, due);
  return repDue(ctx.s, due);
});

/** Tells every member there's something new to pay — the link back to the student side. */
function announceDue(s: DemoState, due: DemoDue) {
  const charge = computeCharge(due.amount);
  for (const u of s.users) {
    if (!u.membership || u.membership === "lead") continue;
    pushNotification(s, {
      userId: u.id,
      kind: "due_published",
      tone: "brand",
      title: `New due from ${s.space.short}`,
      detail: `"${due.title}" — ${naira(charge.totalCharged)} payable.`,
      href: "/dashboard/dues",
    });
  }
}

route("PATCH", "/spaces/:id/dues/:dueId", (ctx) => {
  requireRep(ctx);
  const due = findDue(ctx, ctx.params[1]);
  Object.assign(due, body<Partial<DemoDue>>(ctx));
  return repDue(ctx.s, due);
});

route("POST", "/spaces/:id/dues/:dueId/publish", (ctx) => {
  const rep = requireRep(ctx);
  const due = findDue(ctx, ctx.params[1]);
  due.status = "active";
  pushAudit(ctx.s, {
    action: "due.published",
    description: `Published "${due.title}" (${naira(due.amount)})`,
    actor: rep,
  });
  announceDue(ctx.s, due);
  return repDue(ctx.s, due);
});

route("POST", "/spaces/:id/dues/:dueId/close", (ctx) => {
  const rep = requireRep(ctx);
  const due = findDue(ctx, ctx.params[1]);
  due.status = "closed";
  pushAudit(ctx.s, {
    action: "due.closed",
    description: `Closed "${due.title}"`,
    actor: rep,
  });
  return repDue(ctx.s, due);
});

route("DELETE", "/spaces/:id/dues/:dueId", (ctx) => {
  const rep = requireRep(ctx);
  const due = findDue(ctx, ctx.params[1]);
  if (ctx.s.payments.some((p) => p.dueId === due.id)) {
    fail(409, "DUE_HAS_PAYMENTS", "This due has payments against it — close it instead.");
  }
  ctx.s.dues = ctx.s.dues.filter((d) => d.id !== due.id);
  pushAudit(ctx.s, {
    action: "due.deleted",
    description: `Deleted "${due.title}"`,
    actor: rep,
  });
  return undefined;
});

route("POST", "/spaces/:id/dues/:dueId/reassign", (ctx) => {
  requireLead(ctx);
  const due = findDue(ctx, ctx.params[1]);
  const { userId } = body<{ userId?: string }>(ctx);
  if (!ctx.s.reps.some((r) => r.id === userId)) {
    fail(409, "NOT_A_REP", "Invite them as a co-rep first.");
  }
  due.assignedRepId = userId ?? null;
  return repDue(ctx.s, due);
});

route("GET", "/spaces/:id/dues/:dueId/collections", (ctx) => {
  requireRep(ctx);
  const due = findDue(ctx, ctx.params[1]);
  return page(collectionsFor(ctx.s, due.id));
});

route("POST", "/spaces/:id/dues/:dueId/remind", (ctx) => {
  const rep = requireRep(ctx);
  const due = findDue(ctx, ctx.params[1]);
  const { userIds } = body<{ userIds?: string[] }>(ctx);
  const charge = computeCharge(due.amount);

  const targets = ctx.s.users.filter(
    (u) =>
      u.membership !== null &&
      !paymentFor(ctx.s, u.id, due.id) &&
      (!userIds?.length || userIds.includes(u.id)),
  );
  for (const u of targets) {
    pushNotification(ctx.s, {
      userId: u.id,
      kind: "due_reminder",
      tone: "amber",
      title: "Payment reminder",
      detail: `"${due.title}" (${naira(charge.totalCharged)}) is still unpaid.`,
      href: "/dashboard/dues",
    });
  }
  pushAudit(ctx.s, {
    action: "due.reminded",
    description: `Reminded ${targets.length} unpaid member${targets.length === 1 ? "" : "s"} about "${due.title}"`,
    actor: rep,
  });
  return undefined;
});

// ---------------------------------------------------------------------------
// Rep: circle, co-reps, audit, profile
// ---------------------------------------------------------------------------

route("GET", "/spaces/:id/members", (ctx) => {
  requireRep(ctx);
  const q = (ctx.query.get("q") ?? "").toLowerCase();
  const rows = ctx.s.users
    .filter((u) => u.membership !== null)
    .filter(
      (u) =>
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.matricNo ?? "").toLowerCase().includes(q),
    )
    .map((u) => ({
      id: u.id,
      name: u.name,
      matricNo: u.matricNo ?? "—",
      level: u.level ?? "—",
      email: u.email,
      joinedAt: u.joinedAt,
    }));
  const { rows: pageRows, meta } = paginate(rows, ctx.query);
  return page(pageRows, meta);
});

route("DELETE", "/spaces/:id/members/:userId", (ctx) => {
  const rep = requireRep(ctx);
  const target = findUser(ctx.s, ctx.params[1]);
  if (!target) fail(404, "NOT_FOUND", "That member isn't in this space.");
  target.membership = null;
  pushAudit(ctx.s, {
    action: "member.removed",
    description: `Removed ${target.name} from ${ctx.s.space.short}`,
    actor: rep,
  });
  return undefined;
});

route("POST", "/spaces/:id/join-code/regenerate", (ctx) => {
  const rep = requireLead(ctx);
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  ctx.s.space.joinCode = `${ctx.s.space.short}-${suffix}`;
  pushAudit(ctx.s, {
    action: "space.join_code_rotated",
    description: "Rotated the department join code",
    actor: rep,
  });
  return { code: ctx.s.space.joinCode };
});

route("GET", "/spaces/:id/reps", (ctx) => {
  requireRep(ctx);
  return ctx.s.reps;
});

route("POST", "/spaces/:id/reps/invite", (ctx) => {
  const rep = requireLead(ctx);
  const { email } = body<{ email?: string }>(ctx);
  const address = String(email ?? "").trim().toLowerCase();
  if (ctx.s.reps.some((r) => r.email.toLowerCase() === address)) {
    fail(409, "ALREADY_A_REP", "They're already a rep on this space.");
  }
  const existing = ctx.s.users.find((u) => u.email.toLowerCase() === address);
  const invited = {
    id: existing?.id ?? newId("usr"),
    name: existing?.name ?? address.split("@")[0],
    email: address,
    role: "co" as const,
  };
  ctx.s.reps.push(invited);
  if (existing) existing.membership = "co";
  pushAudit(ctx.s, {
    action: "rep.invited",
    description: `Invited ${address} as a co-rep`,
    actor: rep,
  });
  return invited;
});

route("DELETE", "/spaces/:id/reps/:userId", (ctx) => {
  const rep = requireLead(ctx);
  const target = ctx.s.reps.find((r) => r.id === ctx.params[1]);
  if (!target) fail(404, "NOT_FOUND", "They're not a rep on this space.");
  if (target.role === "lead") fail(409, "CANNOT_REMOVE_LEAD", "Transfer the lead role first.");
  ctx.s.reps = ctx.s.reps.filter((r) => r.id !== target.id);
  const user = findUser(ctx.s, target.id);
  if (user) user.membership = "member";
  pushAudit(ctx.s, {
    action: "rep.removed",
    description: `Removed ${target.name} as a co-rep`,
    actor: rep,
  });
  return undefined;
});

route("GET", "/spaces/:id/audit-log", (ctx) => {
  requireRep(ctx);
  const { rows, meta } = paginate(ctx.s.auditLog, ctx.query);
  return page(rows, meta);
});

route("PATCH", "/spaces/:id", (ctx) => {
  const rep = requireLead(ctx);
  const patch = body<Partial<DemoState["space"]>>(ctx);
  Object.assign(ctx.s.space, patch);
  pushAudit(ctx.s, {
    action: "space.updated",
    description: "Updated the department profile",
    actor: rep,
  });
  return publicSpace(ctx.s, ctx.me);
});

route("POST", "/spaces/:id/transfer-lead", (ctx) => {
  const rep = requireLead(ctx);
  const { userId, password } = body<{ userId?: string; password?: string }>(ctx);
  if (rep.password && password !== rep.password) {
    fail(400, "INVALID_CREDENTIALS", "That password isn't right.");
  }
  const target = ctx.s.reps.find((r) => r.id === userId);
  if (!target) fail(409, "NOT_A_REP", "Invite them as a co-rep first.");
  for (const r of ctx.s.reps) r.role = r.id === target.id ? "lead" : "co";
  const me = ctx.s.users.find((u) => u.id === rep.id)!;
  me.membership = "co";
  const newLead = findUser(ctx.s, target.id);
  if (newLead) newLead.membership = "lead";
  pushAudit(ctx.s, {
    action: "space.lead_transferred",
    description: `Transferred lead rep to ${target.name}`,
    actor: rep,
  });
  return { spaceId: ctx.s.space.id, newLeadId: target.id };
});

route("POST", "/spaces/:id/archive", (ctx) => {
  const rep = requireLead(ctx);
  const { password } = body<{ password?: string; reason?: string }>(ctx);
  if (rep.password && password !== rep.password) {
    fail(400, "INVALID_CREDENTIALS", "That password isn't right.");
  }
  const summary = payoutSummary(ctx.s);
  if (summary.pending > 0) {
    fail(409, "PENDING_PAYOUT", "Wait for the payout in flight to settle first.");
  }
  if (summary.available > 0) {
    fail(409, "HELD_BALANCE", `Withdraw the ${naira(summary.available)} still held first.`);
  }
  ctx.s.space.archived = true;
  return undefined;
});

// ---------------------------------------------------------------------------
// Payouts. Literal paths first — `/payout/:payoutId` would otherwise swallow
// `/payout/summary`, `/payout/account` and `/payout/breakdown`.
// ---------------------------------------------------------------------------

const BANKS = [
  { code: "044", name: "Access Bank" },
  { code: "058", name: "Guaranty Trust Bank" },
  { code: "057", name: "Zenith Bank" },
  { code: "011", name: "First Bank of Nigeria" },
  { code: "033", name: "United Bank for Africa" },
  { code: "232", name: "Sterling Bank" },
  { code: "070", name: "Fidelity Bank" },
  { code: "050", name: "Ecobank Nigeria" },
  { code: "221", name: "Stanbic IBTC Bank" },
  { code: "035", name: "Wema Bank" },
  { code: "214", name: "First City Monument Bank" },
  { code: "032", name: "Union Bank of Nigeria" },
  { code: "999992", name: "OPay" },
  { code: "50211", name: "Kuda Bank" },
  { code: "999991", name: "PalmPay" },
  { code: "090405", name: "Moniepoint MFB" },
];

route("GET", "/banks", () => BANKS);

route("GET", "/spaces/:id/payout/summary", (ctx) => {
  requireRep(ctx);
  return payoutSummary(ctx.s);
});

route("GET", "/spaces/:id/payout/breakdown", (ctx) => {
  requireRep(ctx);
  const byDue = ctx.s.dues
    .map((due) => {
      const rows = ctx.s.payments.filter((p) => p.dueId === due.id);
      return {
        dueId: due.id,
        title: due.title,
        category: due.category,
        paidCount: rows.length,
        collected: rows.reduce((sum, p) => sum + p.amountPaid, 0),
        fees: rows.reduce((sum, p) => sum + p.processingFee + p.duevyFee, 0),
        net: rows.reduce((sum, p) => sum + p.netToSpace, 0),
      };
    })
    .filter((row) => row.paidCount > 0)
    .sort((a, b) => b.net - a.net);

  return page({
    totals: {
      collected: byDue.reduce((sum, d) => sum + d.collected, 0),
      fees: byDue.reduce((sum, d) => sum + d.fees, 0),
      net: byDue.reduce((sum, d) => sum + d.net, 0),
      paidCount: byDue.reduce((sum, d) => sum + d.paidCount, 0),
    },
    byDue,
  });
});

route("GET", "/spaces/:id/payout/account", (ctx) => {
  requireRep(ctx);
  if (!ctx.s.bankAccount) fail(404, "NOT_FOUND", "No payout account on file yet.");
  return ctx.s.bankAccount;
});

route("POST", "/spaces/:id/payout/account/lookup", (ctx) => {
  requireRep(ctx);
  const { accountNumber } = body<{ bankCode?: string; accountNumber?: string }>(ctx);
  if (!/^\d{10}$/.test(String(accountNumber ?? ""))) {
    fail(422, "ACCOUNT_UNVERIFIABLE", "That account number doesn't look right.");
  }
  // Name enquiry always resolves to the space's own name in the demo.
  return { accountName: `${ctx.s.space.short} ${ctx.s.space.school.split(" ").pop()}`.toUpperCase() };
});

route("PUT", "/spaces/:id/payout/account", (ctx) => {
  const rep = requireLead(ctx);
  const { bankCode, accountNumber } = body<{ bankCode?: string; accountNumber?: string }>(ctx);
  const bank = BANKS.find((b) => b.code === bankCode);
  ctx.s.bankAccount = {
    bankCode: bankCode ?? "058",
    bankName: bank?.name ?? "Bank",
    accountNumber: accountNumber ?? "0000000000",
    accountName: `${ctx.s.space.short} ${ctx.s.space.school.split(" ").pop()}`.toUpperCase(),
  };
  pushAudit(ctx.s, {
    action: "payout.account_changed",
    description: `Changed the payout account to ${bank?.name ?? "a new bank"}`,
    actor: rep,
  });
  return ctx.s.bankAccount;
});

function maskedAccount(s: DemoState): string {
  const acct = s.bankAccount;
  if (!acct) return "No account on file";
  const short = (acct.bankName ?? "Bank").replace(/ (Bank|Nigeria|of Nigeria)$/i, "");
  return `${short} •••• ${acct.accountNumber.slice(-4)}`;
}

function raisePayout(ctx: Ctx, amount: number, note: string | undefined, dueId: string | null) {
  const rep = ctx.me;
  const summary = payoutSummary(ctx.s, dueId ?? undefined);
  if (amount < MIN_PAYOUT_KOBO) {
    fail(422, "AMOUNT_TOO_SMALL", `The smallest withdrawal is ${naira(MIN_PAYOUT_KOBO)}.`);
  }
  if (amount > summary.available) {
    fail(422, "INSUFFICIENT_BALANCE", `Only ${naira(summary.available)} is available right now.`);
  }
  if (!ctx.s.bankAccount) {
    fail(409, "NO_PAYOUT_ACCOUNT", "Add a payout account before withdrawing.");
  }

  const payout = {
    id: newId("pyt"),
    dueId,
    amount,
    reference: payoutReference(),
    // The requester's own request counts as an implicit approval.
    status: "pending_approval" as const,
    account: maskedAccount(ctx.s),
    note: note ?? null,
    requestedById: rep.id,
    requestedAt: new Date().toISOString(),
    cancelledAt: null,
    settledAt: null,
    failureReason: null,
    decisions: [
      {
        repUserId: rep.id,
        repName: rep.name,
        decision: "approved" as const,
        decidedAt: new Date().toISOString(),
      },
    ],
  };
  ctx.s.payouts.unshift(payout);
  pushAudit(ctx.s, {
    action: "payout.requested",
    description: `Requested a payout of ${naira(amount)}`,
    actor: rep,
  });
  return payout;
}

route("POST", "/spaces/:id/payout/request", (ctx) => {
  requireLead(ctx);
  const { amount, note } = body<{ amount?: number; note?: string }>(ctx);
  return raisePayout(ctx, amount ?? 0, note, null);
});

route("POST", "/spaces/:id/dues/:dueId/payout/request", (ctx) => {
  const rep = requireRep(ctx);
  const due = findDue(ctx, ctx.params[1]);
  const isLead = ctx.s.reps.find((r) => r.id === rep.id)?.role === "lead";
  if (!isLead && due.assignedRepId !== rep.id) {
    fail(403, "FORBIDDEN", "This due isn't assigned to you.");
  }
  const { amount, note } = body<{ amount?: number; note?: string }>(ctx);
  return raisePayout(ctx, amount ?? 0, note, due.id);
});

route("GET", "/spaces/:id/dues/:dueId/payout/summary", (ctx) => {
  requireRep(ctx);
  return payoutSummary(ctx.s, findDue(ctx, ctx.params[1]).id);
});

route("GET", "/spaces/:id/payouts", (ctx) => {
  requireRep(ctx);
  return ctx.s.payouts.map(wirePayout);
});

route("POST", "/spaces/:id/payout/:payoutId/approve", (ctx) => {
  const rep = requireRep(ctx);
  const payout = ctx.s.payouts.find((p) => p.id === ctx.params[1]);
  if (!payout) fail(404, "NOT_FOUND", "That payout doesn't exist.");
  const { decision } = body<{ decision?: "approved" | "rejected" }>(ctx);

  payout.decisions = payout.decisions.filter((d) => d.repUserId !== rep.id);
  payout.decisions.push({
    repUserId: rep.id,
    repName: rep.name,
    decision: decision ?? "approved",
    decidedAt: new Date().toISOString(),
  });

  const approval = approvalStatus(ctx.s, payout.id);
  if (approval.met && payout.status === "pending_approval") payout.status = "processing";

  return { payout: wirePayout(payout), approval };
});

route("POST", "/spaces/:id/payout/:payoutId/cancel", (ctx) => {
  const rep = requireRep(ctx);
  const payout = ctx.s.payouts.find((p) => p.id === ctx.params[1]);
  if (!payout) fail(404, "NOT_FOUND", "That payout doesn't exist.");
  if (payout.status !== "pending_approval") {
    fail(409, "PAYOUT_NOT_CANCELLABLE", "This payout has already moved past approval.");
  }
  payout.status = "cancelled";
  payout.cancelledAt = new Date().toISOString();
  pushAudit(ctx.s, {
    action: "payout.cancelled",
    description: `Cancelled payout ${payout.reference}`,
    actor: rep,
  });
  return wirePayout(payout);
});

route("GET", "/spaces/:id/payout/onboarding-status", (ctx) => {
  requireRep(ctx);
  return { setupStatus: "complete", transfersActive: true, payoutsActive: true };
});

route("GET", "/spaces/:id/payout/onboarding/checklist", (ctx) => {
  requireRep(ctx);
  return {
    checklist: [
      { key: "business_profile", state: "complete", provided: true },
      { key: "identity", state: "complete", provided: true },
      { key: "bank_account", state: ctx.s.bankAccount ? "complete" : "pending", provided: !!ctx.s.bankAccount },
    ],
    tasks: [],
    errors: [],
  };
});

route("POST", "/spaces/:id/payout/onboarding/documents", async (ctx) => {
  requireRep(ctx);
  formFile(ctx);
  return { uploadId: newId("upl") };
});

route("POST", "/spaces/:id/payout/onboarding/submit", (ctx) => {
  requireRep(ctx);
  return { checklist: [], tasks: [], errors: [] };
});

route("GET", "/spaces/:id/payout/onboarding/identity/methods", (ctx) => {
  requireRep(ctx);
  return { hostedAvailable: true, ninAvailable: true, country: "NG" };
});

route("POST", "/spaces/:id/payout/onboarding/identity/nin", (ctx) => {
  requireRep(ctx);
  const { nin } = body<{ nin?: string }>(ctx);
  if (!/^\d{11}$/.test(String(nin ?? ""))) {
    return { status: "failed" as const, reason: "A NIN is 11 digits." };
  }
  return { status: "verified" as const };
});

route("GET", "/spaces/:id/payout/onboarding/identity/status", (ctx) => {
  requireRep(ctx);
  return { status: "verified" };
});

route("GET", "/spaces/:id/payout/:payoutId", (ctx) => {
  requireRep(ctx);
  const payout = ctx.s.payouts.find((p) => p.id === ctx.params[1]);
  if (!payout) fail(404, "NOT_FOUND", "That payout doesn't exist.");
  return { ...wirePayout(payout), approval: approvalStatus(ctx.s, payout.id) };
});

// ---------------------------------------------------------------------------
// Polls
// ---------------------------------------------------------------------------

/** Strips tallies while a poll is still running — results are revealed on close. */
function publicPoll(s: DemoState, poll: Poll, viewer: DemoUser | null): Poll {
  const reveal = poll.status === "closed";
  return {
    ...poll,
    categories: poll.categories.map((c) => ({
      ...c,
      nominees: c.nominees.map((n) => ({ ...n, votes: reveal ? n.votes : undefined })),
      remaining: viewer
        ? poll.paid
          ? null
          : s.votes.some((v) => v.userId === viewer.id && v.categoryId === c.id)
            ? 0
            : 1
        : null,
    })),
  };
}

route(
  "GET",
  "/polls/:slug",
  (ctx) => {
    const poll = findPoll(ctx, ctx.params[0]);
    if (poll.status === "draft") fail(404, "NOT_FOUND", "That poll isn't live yet.");
    return publicPoll(ctx.s, poll, currentUser(ctx.s));
  },
  true,
);

route(
  "POST",
  "/polls/:slug/votes",
  (ctx) => {
    const poll = findPoll(ctx, ctx.params[0]);
    if (poll.status !== "active") fail(409, "POLL_CLOSED", "Voting has closed on this poll.");
    const me = currentUser(ctx.s);
    if (poll.membersOnly && !me?.membership) {
      fail(403, "MEMBERS_ONLY", "Only verified members can vote in this poll.");
    }

    const { selections } = body<{
      selections?: Array<{ categoryId: string; nomineeId: string; quantity: number }>;
    }>(ctx);
    const picks = selections ?? [];
    const quantity = picks.reduce((sum, sel) => sum + (sel.quantity || 1), 0);

    if (poll.paid) {
      const amount = quantity * poll.amountPerVote;
      const ref = reference();
      ctx.s.checkouts.push({
        reference: ref,
        userId: me?.id ?? "guest",
        kind: "vote",
        dueIds: [],
        pollSlug: poll.slug,
        selections: picks,
        amount,
        createdAt: new Date().toISOString(),
        status: "pending",
      });
      return { reference: ref, amount, checkoutUrl: checkoutUrl(ref) };
    }

    applyVotes(ctx.s, poll, picks, me?.id ?? "guest");
    return { receiptId: newId("rcp"), totalCharged: 0 };
  },
  true,
);

export function applyVotes(
  s: DemoState,
  poll: Poll,
  picks: Array<{ categoryId: string; nomineeId: string; quantity: number }>,
  userId: string,
) {
  for (const sel of picks) {
    const category = poll.categories.find((c) => c.id === sel.categoryId);
    const nominee = category?.nominees.find((n) => n.id === sel.nomineeId);
    if (!nominee) continue;
    const quantity = sel.quantity || 1;
    nominee.votes = (nominee.votes ?? 0) + quantity;
    poll.totalVotes += quantity;
    poll.revenue += quantity * poll.amountPerVote;
    s.votes.push({ userId, pollId: poll.id, categoryId: sel.categoryId, quantity });
  }
}

route("GET", "/spaces/:id/polls", (ctx) => {
  requireRep(ctx);
  return ctx.s.polls;
});

route("POST", "/spaces/:id/polls/image", async (ctx) => {
  requireRep(ctx);
  return { imageUrl: await fileToDataUrl(formFile(ctx)) };
});

route("POST", "/spaces/:id/polls", (ctx) => {
  const rep = requireRep(ctx);
  const draft = body<{
    title?: string;
    description?: string;
    deadline?: string;
    paid?: boolean;
    amountPerVote?: number;
    membersOnly?: boolean;
    coverImageUrl?: string;
    themeColor?: string;
    publish?: boolean;
    categories?: Array<{
      title: string;
      imageUrl?: string;
      nominees: Array<{ name: string; imageUrl?: string; bio?: string; code?: string }>;
    }>;
  }>(ctx);

  const title = draft.title ?? "Untitled poll";
  const poll: Poll = {
    id: newId("poll"),
    spaceId: ctx.s.space.id,
    title,
    description: draft.description ?? "",
    deadline: draft.deadline ?? new Date(Date.now() + 14 * 864e5).toISOString(),
    status: draft.publish ? "active" : "draft",
    membersOnly: draft.membersOnly ?? true,
    paid: draft.paid ?? false,
    amountPerVote: draft.amountPerVote ?? 0,
    slug: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Math.random()
      .toString(36)
      .slice(2, 6)}`,
    coverImageUrl: draft.coverImageUrl ?? null,
    themeColor: draft.themeColor ?? null,
    totalVotes: 0,
    revenue: 0,
    categories: (draft.categories ?? []).map((c, ci) => ({
      id: newId(`cat${ci}`),
      title: c.title,
      imageUrl: c.imageUrl ?? null,
      nominees: c.nominees.map((n, ni) => ({
        id: newId(`nom${ci}${ni}`),
        name: n.name,
        votes: 0,
        imageUrl: n.imageUrl ?? null,
        bio: n.bio ?? null,
        code: n.code ?? String(ni + 1).padStart(2, "0"),
      })),
    })),
  };
  ctx.s.polls.unshift(poll);
  pushAudit(ctx.s, {
    action: draft.publish ? "poll.published" : "poll.created",
    description: `${draft.publish ? "Published" : "Drafted"} the poll "${title}"`,
    actor: rep,
  });
  return poll;
});

route("PATCH", "/spaces/:id/polls/:pollId/categories/:categoryId", (ctx) => {
  requireRep(ctx);
  const poll = findPoll(ctx, ctx.params[1]);
  const category = poll.categories.find((c) => c.id === ctx.params[2]);
  if (!category) fail(404, "NOT_FOUND", "That category doesn't exist.");
  const { imageUrl } = body<{ imageUrl?: string | null }>(ctx);
  category.imageUrl = imageUrl ?? null;
  return category as PollCategory;
});

route("PATCH", "/spaces/:id/polls/:pollId/nominees/:nomineeId", (ctx) => {
  requireRep(ctx);
  const poll = findPoll(ctx, ctx.params[1]);
  const nominee = poll.categories.flatMap((c) => c.nominees).find((n) => n.id === ctx.params[2]);
  if (!nominee) fail(404, "NOT_FOUND", "That nominee doesn't exist.");
  Object.assign(nominee, body(ctx));
  return nominee;
});

route("POST", "/spaces/:id/polls/:pollId/publish", (ctx) => {
  const rep = requireRep(ctx);
  const poll = findPoll(ctx, ctx.params[1]);
  poll.status = "active";
  pushAudit(ctx.s, {
    action: "poll.published",
    description: `Published the poll "${poll.title}"`,
    actor: rep,
  });
  return poll;
});

route("POST", "/spaces/:id/polls/:pollId/close", (ctx) => {
  const rep = requireRep(ctx);
  const poll = findPoll(ctx, ctx.params[1]);
  poll.status = "closed";
  pushAudit(ctx.s, {
    action: "poll.closed",
    description: `Closed the poll "${poll.title}"`,
    actor: rep,
  });
  return poll;
});

route("GET", "/spaces/:id/polls/:pollId/results", (ctx) => {
  requireRep(ctx);
  const poll = findPoll(ctx, ctx.params[1]);
  return {
    poll: { id: poll.id, title: poll.title, status: poll.status },
    totalVotes: poll.totalVotes,
    revenue: poll.revenue,
    categories: poll.categories,
  };
});

route("PATCH", "/spaces/:id/polls/:pollId", (ctx) => {
  requireRep(ctx);
  const poll = findPoll(ctx, ctx.params[1]);
  Object.assign(poll, body(ctx));
  return poll;
});

// ---------------------------------------------------------------------------
// Referrals — rep-only, per the programme's own rules.
// ---------------------------------------------------------------------------

route("GET", "/referrals", (ctx) => {
  if (!isRep(ctx.s, ctx.me)) {
    fail(403, "FORBIDDEN", "The referral programme is open to reps only.");
  }
  const code = ctx.me.referralCode ?? "DUEVY";
  return {
    code,
    link: `https://duevy.app/signup?ref=${code}`,
    rewardPerReferral: 100_000,
    summary: {
      invited: ctx.s.referrals.length,
      joined: ctx.s.referrals.filter((r) => r.status !== "pending").length,
      earned: ctx.s.referrals.reduce((sum, r) => sum + r.reward, 0),
    },
    referrals: ctx.s.referrals,
  };
});

route("POST", "/referrals/invites", (ctx) => {
  const { emails } = body<{ emails?: string[] }>(ctx);
  const list = emails ?? [];
  for (const email of list) {
    ctx.s.referrals.unshift({
      id: newId("ref"),
      name: email,
      status: "pending",
      reward: 0,
      date: new Date().toISOString(),
    });
  }
  return { sent: list.length };
});

// ---------------------------------------------------------------------------
// Disputes
// ---------------------------------------------------------------------------

route("POST", "/disputes", (ctx) => {
  const payload = body<{ type?: string; transactionReference?: string; description?: string }>(ctx);
  const dispute = {
    id: newId("dsp"),
    type: (payload.type ?? "payment_not_reflecting") as never,
    openedBy: ctx.me.name,
    status: "open" as const,
    slaDays: 5,
    ageDays: 0,
    breached: false,
    description: payload.description ?? "",
    resolution: null,
    createdAt: new Date().toISOString(),
    email: ctx.me.email,
    department: ctx.s.space.name,
    txnReference: payload.transactionReference ?? null,
  };
  ctx.s.disputes.unshift(dispute);
  return dispute;
});

route("GET", "/disputes", (ctx) => {
  const mine = ctx.s.disputes.filter((d) => d.email === ctx.me.email);
  const { rows, meta } = paginate(mine, ctx.query);
  return page(rows, meta);
});

// ---------------------------------------------------------------------------
// Duey, the assistant. Keyword intent matching over the caller's own data —
// enough to demo the conversation, with no model behind it.
// ---------------------------------------------------------------------------

type AssistantReply = {
  reply: string;
  intent: string;
  quickReplies: Array<{ label: string; value: string }>;
  action: Record<string, unknown> | null;
};

function answer(s: DemoState, me: DemoUser, message: string): AssistantReply {
  const text = message.toLowerCase();
  const rep = isRep(s, me);
  const openDues = s.dues
    .filter((d) => d.status === "active" && !paymentFor(s, me.id, d.id))
    .map((d) => studentDue(s, me.id, d));

  const has = (...words: string[]) => words.some((w) => text.includes(w));

  if (has("pay", "settle", "clear my due")) {
    if (!openDues.length) {
      return {
        reply: "You're all clear — nothing outstanding right now.",
        intent: "pay_dues",
        quickReplies: [{ label: "Show my history", value: "Show my payment history" }],
        action: null,
      };
    }
    const due = openDues[0];
    return {
      reply: `You have ${openDues.length} due${openDues.length === 1 ? "" : "s"} open. The nearest is "${due.title}" at ${naira(
        due.payableAmount ?? due.amount,
      )}. Want to settle it now?`,
      intent: "pay_dues",
      quickReplies: [
        { label: `Pay ${due.title}`, value: `Pay ${due.title}` },
        { label: "Not now", value: "Not now" },
      ],
      action: { type: "open_payment_modal", dueId: due.id },
    };
  }

  if (has("balance", "owe", "outstanding", "how much")) {
    const total = openDues.reduce((sum, d) => sum + (d.payableAmount ?? d.amount), 0);
    return {
      reply: total
        ? `You owe ${naira(total)} across ${openDues.length} due${openDues.length === 1 ? "" : "s"} in ${s.space.short}.`
        : "Nothing outstanding — you're fully paid up.",
      intent: "check_balance",
      quickReplies: total ? [{ label: "Pay now", value: "Pay my dues" }] : [],
      action: null,
    };
  }

  if (has("history", "receipt", "transaction", "paid before")) {
    const recent = s.transactions.filter((t) => t.userId === me.id).slice(0, 3);
    return {
      reply: recent.length
        ? `Your last ${recent.length}: ${recent.map((t) => `${t.title} (${naira(Math.abs(t.amount))})`).join(", ")}.`
        : "No transactions yet.",
      intent: "view_history",
      quickReplies: [{ label: "Open transactions", value: "Open my transactions" }],
      action: null,
    };
  }

  if (has("join", "invite code", "join code")) {
    const code = message.match(/[A-Za-z]{2,}-?[A-Za-z0-9]{3,}/)?.[0]?.toUpperCase();
    if (code && code === s.space.joinCode.toUpperCase()) {
      return {
        reply: `That code is for ${s.space.name}. Want me to add you?`,
        intent: "join_department",
        quickReplies: [{ label: "Yes, join", value: "Yes" }],
        action: { type: "confirm_join_department", spaceId: s.space.id, inviteCode: code },
      };
    }
    return {
      reply: "Send me the join code your rep shared and I'll look it up.",
      intent: "join_department",
      quickReplies: [],
      action: null,
    };
  }

  if (rep && has("create", "raise", "new due")) {
    const amount = Number(message.match(/(\d[\d,]{2,})/)?.[1]?.replace(/,/g, "") ?? 0) * 100;
    const title = message.match(/(?:for|called)\s+"?([^"]+?)"?$/i)?.[1]?.trim();
    if (amount && title) {
      return {
        reply: `Raise "${title}" at ${naira(amount)} for ${s.space.short}? I'll create it as a draft so you can review before publishing.`,
        intent: "create_due",
        quickReplies: [{ label: "Create it", value: "Yes" }],
        action: {
          type: "confirm_create_due",
          spaceId: s.space.id,
          title,
          amount,
          dueDate: new Date(Date.now() + 14 * 864e5).toISOString(),
          category: "levy",
        },
      };
    }
    return {
      reply: 'Tell me the amount and what it\'s for — e.g. "create a 5000 due for Lab Coats".',
      intent: "create_due",
      quickReplies: [],
      action: null,
    };
  }

  if (rep && has("summary", "collection", "how are we doing", "rate")) {
    const summary = payoutSummary(s);
    const active = s.dues.filter((d) => d.status === "active").length;
    return {
      reply: `${s.space.short} has ${naira(summary.available)} available to withdraw across ${active} active due${
        active === 1 ? "" : "s"
      }, with ${naira(summary.lifetime)} paid out to date.`,
      intent: "rep_summary",
      quickReplies: [{ label: "Open payouts", value: "Open payouts" }],
      action: null,
    };
  }

  return {
    reply: rep
      ? "I can raise a due, summarise collections, or pull up your payouts. What do you need?"
      : "I can show what you owe, settle a due, or pull up a receipt. What do you need?",
    intent: "unknown",
    quickReplies: rep
      ? [
          { label: "Collection summary", value: "How are collections going?" },
          { label: "Create a due", value: "Create a new due" },
        ]
      : [
          { label: "What do I owe?", value: "What do I owe?" },
          { label: "Pay my dues", value: "Pay my dues" },
        ],
    action: null,
  };
}

route("POST", "/assistant/message", (ctx) => {
  const { message, conversationId } = body<{ message?: string; conversationId?: string }>(ctx);
  const text = message ?? "";

  let convo = ctx.s.conversations.find((c) => c.id === conversationId && c.userId === ctx.me.id);
  if (!convo) {
    convo = {
      id: newId("cnv"),
      userId: ctx.me.id,
      preview: text.slice(0, 60),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    ctx.s.conversations.unshift(convo);
  }

  const result = answer(ctx.s, ctx.me, text);
  convo.messages.push({
    id: newId("msg"),
    role: "user",
    content: text,
    intent: null,
    confidence: null,
    createdAt: new Date().toISOString(),
  });
  convo.messages.push({
    id: newId("msg"),
    role: "assistant",
    content: result.reply,
    intent: result.intent,
    confidence: 0.92,
    createdAt: new Date().toISOString(),
  });
  convo.updatedAt = new Date().toISOString();

  return {
    conversationId: convo.id,
    intent: result.intent,
    confidence: result.intent === "unknown" ? 0.3 : 0.92,
    needsClarification: result.intent === "unknown",
    reply: result.reply,
    quickReplies: result.quickReplies,
    action: result.action,
  };
});

route("POST", "/assistant/confirm", (ctx) => {
  const payload = body<{
    spaceId?: string;
    inviteCode?: string;
    title?: string;
    amount?: number;
    dueDate?: string;
    category?: DemoDue["category"];
  }>(ctx);

  // A create-due confirmation carries a title; a join confirmation carries a code.
  if (payload.title) {
    const due: DemoDue = {
      id: newId("due"),
      spaceId: ctx.s.space.id,
      title: payload.title,
      note: null,
      amount: payload.amount ?? 0,
      dueDate: payload.dueDate ?? new Date(Date.now() + 14 * 864e5).toISOString(),
      category: payload.category ?? "levy",
      status: "draft",
      allowGuests: false,
      assignedRepId: ctx.me.id,
      createdAt: new Date().toISOString(),
    };
    ctx.s.dues.unshift(due);
    pushAudit(ctx.s, {
      action: "due.created",
      description: `Drafted "${due.title}" (${naira(due.amount)}) via Duey`,
      actor: ctx.me,
    });
    return {
      status: "created",
      dueId: due.id,
      title: due.title,
      spaceName: ctx.s.space.name,
    };
  }

  const user = ctx.s.users.find((u) => u.id === ctx.me.id)!;
  if (user.membership) return { status: "already_member", spaceName: ctx.s.space.name };
  user.membership = "member";
  user.joinedAt = new Date().toISOString();
  return { status: "joined", spaceName: ctx.s.space.name, joinedAt: user.joinedAt };
});

route("GET", "/assistant/conversations", (ctx) => {
  const mine = ctx.s.conversations
    .filter((c) => c.userId === ctx.me.id)
    .map((c) => ({
      id: c.id,
      preview: c.preview,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  const { rows, meta } = paginate(mine, ctx.query);
  return page(rows, meta);
});

route("GET", "/assistant/conversations/:id/messages", (ctx) => {
  const convo = ctx.s.conversations.find((c) => c.id === ctx.params[0] && c.userId === ctx.me.id);
  if (!convo) fail(404, "NOT_FOUND", "That conversation doesn't exist.");
  return { conversationId: convo.id, messages: convo.messages };
});

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export type DemoResponse<T> = { data: T; meta?: ApiMeta };

/**
 * Resolves one request against the fixture store. Mirrors the real client's
 * contract: resolves with `{ data, meta }`, or throws an `ApiError` the UI
 * already knows how to render.
 */
export async function handleDemoRequest<T>(
  method: string,
  fullPath: string,
  requestBody: unknown,
): Promise<DemoResponse<T>> {
  if (DEMO_LATENCY_MS > 0) {
    await new Promise((resolve) => setTimeout(resolve, DEMO_LATENCY_MS));
  }

  const [rawPath, rawQuery = ""] = fullPath.split("?");
  const path = rawPath.replace(/\/$/, "") || "/";
  const query = new URLSearchParams(rawQuery);

  for (const r of routes) {
    if (r.method !== method) continue;
    const match = r.pattern.exec(path);
    if (!match) continue;

    const s = getState();
    const me = currentUser(s);
    if (!r.publicRoute && !me) {
      fail(401, "UNAUTHENTICATED", "Your demo session ended. Sign in again to continue.");
    }

    const ctx: Ctx = { s, params: match.slice(1), query, body: requestBody, me: me as DemoUser };
    const raw = await mutateAsync(() => r.handler(ctx));

    if (raw && typeof raw === "object" && (raw as Paged).__paged) {
      const paged = raw as Paged;
      return { data: paged.data as T, meta: paged.meta };
    }
    return { data: raw as T };
  }

  throw new ApiError(`This screen isn't part of the demo (${method} ${path}).`, {
    code: "NOT_IN_DEMO",
    status: 501,
  });
}

/** Runs a handler and persists whatever it changed, async handlers included. */
async function mutateAsync<T>(fn: () => T | Promise<T>): Promise<T> {
  const result = await fn();
  mutate(() => undefined);
  return result;
}

/**
 * Settles a checkout: records payments, writes the ledger rows, and notifies
 * both sides. Called by the simulated checkout page, not by a route.
 */
export function settleCheckout(ref: string): "completed" | "unknown" {
  return mutate((s) => {
    const checkout = s.checkouts.find((c) => c.reference === ref);
    if (!checkout) return "unknown";
    if (checkout.status === "completed") return "completed";

    checkout.status = "completed";
    const payer = s.users.find((u) => u.id === checkout.userId);

    if (checkout.kind === "vote") {
      const poll = s.polls.find((p) => p.slug === checkout.pollSlug);
      if (poll) applyVotes(s, poll, checkout.selections, checkout.userId);
      s.transactions.unshift({
        id: newId("txn"),
        userId: checkout.userId,
        type: "vote",
        method: "Bank transfer",
        title: `${poll?.title ?? "Poll"} — ${checkout.selections.reduce((n, sel) => n + (sel.quantity || 1), 0)} votes`,
        detail: s.space.name,
        amount: -checkout.amount,
        status: "completed",
        reference: ref,
        createdAt: new Date().toISOString(),
      });
      return "completed";
    }

    for (const dueId of checkout.dueIds) {
      const due = s.dues.find((d) => d.id === dueId);
      if (!due || paymentFor(s, checkout.userId, dueId)) continue;
      const charge = computeCharge(due.amount);
      const now = new Date().toISOString();

      s.payments.push({
        id: newId("pay"),
        userId: checkout.userId,
        dueId,
        reference: ref,
        amountPaid: charge.totalCharged,
        processingFee: charge.processingFee,
        duevyFee: charge.duevyFee,
        netToSpace: charge.netToSpace,
        paidAt: now,
      });

      s.transactions.unshift({
        id: newId("txn"),
        userId: checkout.userId,
        type: "due",
        method: "Bank transfer",
        title: due.title,
        detail: s.space.name,
        amount: -charge.totalCharged,
        status: "completed",
        reference: ref,
        createdAt: now,
      });

      pushNotification(s, {
        userId: checkout.userId,
        kind: "payment_receipt",
        tone: "brand",
        title: "Payment confirmed",
        detail: `Your ${naira(charge.totalCharged)} for "${due.title}" was received.`,
        href: "/dashboard/transactions",
      });

      // The rep side of the same event — this is what makes the two demo
      // accounts feel like one system.
      pushNotification(s, {
        userId: due.assignedRepId ?? REP_ID,
        kind: "payment_received",
        tone: "brand",
        title: "Payment received",
        detail: `${payer?.name ?? "A member"} paid ${naira(charge.totalCharged)} for "${due.title}".`,
        href: "/dashboard/create-dues",
      });
    }

    return "completed";
  });
}

/** Marks a checkout failed — the "cancel" path on the simulated checkout page. */
export function failCheckout(ref: string) {
  mutate((s) => {
    const checkout = s.checkouts.find((c) => c.reference === ref);
    if (checkout && checkout.status === "pending") checkout.status = "failed";
  });
}

/** What the simulated checkout page renders. */
export function getCheckout(ref: string) {
  const s = getState();
  const checkout = s.checkouts.find((c) => c.reference === ref);
  if (!checkout) return null;
  const dues = checkout.dueIds
    .map((id) => s.dues.find((d) => d.id === id))
    .filter((d): d is DemoDue => !!d);
  return {
    reference: checkout.reference,
    amount: checkout.amount,
    status: checkout.status,
    kind: checkout.kind,
    spaceName: s.space.name,
    lines: checkout.kind === "vote"
      ? [
          {
            title: s.polls.find((p) => p.slug === checkout.pollSlug)?.title ?? "Poll votes",
            amount: checkout.amount,
          },
        ]
      : dues.map((d) => ({ title: d.title, amount: computeCharge(d.amount).totalCharged })),
    returnPath:
      checkout.kind === "vote"
        ? `/vote/callback?reference=${encodeURIComponent(ref)}`
        : `/dashboard/pay/${encodeURIComponent(ref)}`,
  };
}

/** Receipt/export downloads, which bypass the JSON client. */
export function demoBlob(path: string): Blob {
  const s = getState();
  const collections = path.match(/\/spaces\/[^/]+\/dues\/([^/]+)\/collections\/export/);
  if (collections) {
    const { students } = collectionsFor(s, collections[1]);
    const header = "Name,Matric No,Level,Email,Status,Paid At,Reference";
    const rows = students.map((r) =>
      [r.name, r.matricNo, r.level ?? "", r.email, r.status, r.paidAt ?? "", r.reference ?? ""]
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(","),
    );
    return new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
  }

  return new Blob(
    [`Duevy demo receipt\n\n${path}\n\nGenerated ${new Date().toLocaleString()}\n`],
    { type: "text/plain" },
  );
}

void computePayoutFees;
