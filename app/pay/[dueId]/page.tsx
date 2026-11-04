"use client";

import { Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert01Icon,
  BankIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Copy01Icon,
  Download04Icon,
  Mail01Icon,
  SecurityCheckIcon,
  SquareLock02Icon,
  Tick02Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/errors";
import { apiClient } from "@/lib/api/client";
import { isDemoMode } from "@/lib/demo/mode";
import { useAuth } from "@/lib/auth/auth-context";
import { closeBachsCheckout, openBachsCheckout, preloadBachs, type BachsCheckoutEvent } from "@/lib/bachs/overlay";
import type { GuestField } from "@/lib/api/types";
import {
  getGuestCheckout,
  getGuestDue,
  guestReceiptPath,
  guestReceiptUrl,
  requestGuestAccount,
  startGuestCheckout,
  type GuestAccountState,
  type GuestCheckoutStatus,
  type GuestDue,
} from "@/lib/api/guest";
import { BRAND_INPUT } from "../../(dashboards)/dashboard/_components/form-styles";
import { SpaceEmblem } from "../../(dashboards)/dashboard/dues/_components/SpaceEmblem";
import { KIND_GLYPH, SPACE_KIND_LABEL } from "../../(dashboards)/dashboard/dues/_components/data";

const POLL_MS = 5000;
/** Right after the overlay says it's done, check sooner — the webhook is usually seconds behind. */
const CONFIRM_POLL_MS = 2000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Exact naira with kobo — what the payer must send. */
const exactNaira = (kobo: number) =>
  `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

const statusHref = (dueId: string, reference: string, token: string, completed = false) =>
  `/pay/${encodeURIComponent(dueId)}?ref=${encodeURIComponent(reference)}&t=${encodeURIComponent(token)}${completed ? "&c=1" : ""}`;

/**
 * Public pay page for a guest-enabled due: `/pay/<dueId>`. The payer fills in
 * the form the rep configured, can opt into a free Duevy account, and pays in
 * the Bachs overlay without leaving the page (or, when the platform is on
 * bank-transfer mode, into a one-time account shown here). No sign-in needed;
 * someone already signed in pays as themselves.
 *
 * Once a checkout is under way its reference and token ride in the URL
 * (`?ref=&t=`), so a refresh lands on the same payment. Only the API decides
 * it's paid — never an overlay event.
 */
export default function GuestPayPage() {
  return (
    <Suspense fallback={<CardSkeleton />}>
      <GuestPay />
    </Suspense>
  );
}

function GuestPay() {
  const { dueId } = useParams<{ dueId: string }>();
  const searchParams = useSearchParams();
  const reference = searchParams.get("ref");
  const token = searchParams.get("t");

  return reference && token ? (
    <CheckoutStatus dueId={dueId} reference={reference} token={token} completed={searchParams.get("c") === "1"} />
  ) : (
    <PayForm dueId={dueId} />
  );
}

// ---------------------------------------------------------------------------
// The Bachs overlay, as UI state
// ---------------------------------------------------------------------------

/**
 * Opens checkout sessions in the Bachs overlay and reports its outcomes as
 * toasts. `onCompleted` fires on the browser's `checkout.completed`, which
 * only means "go and wait for the API to confirm it". `onEnded` fires on
 * failed / expired, so the page can have the API re-check the session before
 * a retry. `attempted` is set once a try ended without paying, for a "Try
 * again" label.
 */
function useOverlayCheckout({ onCompleted, onEnded }: { onCompleted: () => void; onEnded?: () => void }) {
  const [phase, setPhase] = useState<"idle" | "opening" | "open">("idle");
  const [attempted, setAttempted] = useState(false);
  const completed = useRef(false);
  // Set when failed / expired / error already told the payer, so closing doesn't toast twice.
  const told = useRef(false);
  const handlers = useRef({ onCompleted, onEnded });
  useEffect(() => {
    handlers.current = { onCompleted, onEnded };
  });

  // Fetch the SDK while the payer is still typing, and never leave an overlay
  // open behind a page that's gone.
  useEffect(() => {
    if (!isDemoMode()) preloadBachs().catch(() => {});
    return () => closeBachsCheckout();
  }, []);

  const onEvent = useCallback((event: BachsCheckoutEvent) => {
    switch (event.type) {
      case "checkout.ready":
        // Only while opening: a late `ready` after a quick close mustn't lock the button.
        setPhase((p) => (p === "opening" ? "open" : p));
        return;
      case "checkout.completed":
        completed.current = true;
        handlers.current.onCompleted();
        return;
      case "checkout.failed":
        told.current = true;
        setAttempted(true);
        toast.error("Payment didn't go through", { description: "Nothing was charged. Your details are saved — try again." });
        handlers.current.onEnded?.();
        return;
      case "checkout.expired":
        told.current = true;
        setAttempted(true);
        toast.warning("Checkout timed out", { description: "Nothing was charged. Tap pay again for a fresh one." });
        handlers.current.onEnded?.();
        return;
      case "checkout.closed":
        setPhase("idle");
        if (!completed.current && !told.current) {
          setAttempted(true);
          toast.info("Payment not finished", { description: "Your details are saved — pick up where you left off." });
        }
        return;
      case "checkout.error":
        console.error("Bachs checkout error", event.data);
        told.current = true;
        setAttempted(true);
        setPhase("idle");
        toast.error("Checkout hit a problem", { description: "Nothing was charged. Please try again in a moment." });
        return;
      default:
        // opened / loaded: nothing to show.
        return;
    }
  }, []);

  const open = useCallback(
    async (checkoutUrl: string) => {
      completed.current = false;
      told.current = false;
      setPhase("opening");
      try {
        await openBachsCheckout(checkoutUrl, onEvent);
      } catch (err) {
        console.error("Couldn't open the Bachs checkout", err);
        setPhase("idle");
        setAttempted(true);
        toast.error("Couldn't open the secure checkout", {
          description: "Check your connection (and any content blocker), then try again. Nothing was charged.",
        });
      }
    },
    [onEvent],
  );

  return { phase, attempted, open };
}

// ---------------------------------------------------------------------------
// Step 1 — who's paying
// ---------------------------------------------------------------------------

const TRUST = ["Secure checkout", "No account needed", "Receipt by email"];

/** "17 Nov" from a yyyy-mm-dd date. */
function shortDate(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y!, m! - 1, d!).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

function PayForm({ dueId }: { dueId: string }) {
  const router = useRouter();
  const { user, status: authStatus, logout } = useAuth();
  const [switching, setSwitching] = useState(false);
  const [due, setDue] = useState<GuestDue | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "closed">("loading");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [matricNo, setMatricNo] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [createAccount, setCreateAccount] = useState(false);
  // Field ids the API rejected — outlined red; the reason comes as a toast.
  const [invalid, setInvalid] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  // The checkout the overlay is showing, so its completion can open the status page.
  const active = useRef<{ reference: string; token: string } | null>(null);

  const overlay = useOverlayCheckout({
    onCompleted: () => {
      const c = active.current;
      if (c) router.replace(statusHref(dueId, c.reference, c.token, true), { scroll: false });
    },
    // Have the API check the session with Bachs now, so a retry doesn't reuse a dead one.
    onEnded: () => {
      const c = active.current;
      if (c) getGuestCheckout(c.reference, c.token).catch(() => {});
    },
  });

  useEffect(() => {
    let cancelled = false;
    getGuestDue(dueId)
      .then((d) => {
        if (cancelled) return;
        setDue(d);
        setState("ready");
        if (!d.canCollect) {
          toast.info("Not taking payments yet", {
            description: "This department's rep is still finishing verification. Try again later.",
            duration: 10_000,
          });
        }
      })
      .catch(() => !cancelled && setState("closed"));
    return () => {
      cancelled = true;
    };
  }, [dueId]);

  if (state === "loading") return <CardSkeleton />;
  if (state === "closed" || !due) {
    return (
      <Notice
        tone="rose"
        icon={Alert01Icon}
        title="This payment link isn't open"
        body="It may have closed, or it's only for members of the department. Ask whoever shared it for a new link."
      />
    );
  }

  // Signed in: the account pays, so its name and email (and matric number, if
  // the profile has one) aren't asked again.
  const signedIn = authStatus === "authenticated" && !!user;
  const profileMatric = signedIn ? user.matricNo : null;
  const fields = due.fields ?? [];
  const busy = submitting || overlay.phase !== "idle";
  const valid =
    due.canCollect &&
    (signedIn || (name.trim().length >= 2 && EMAIL_RE.test(email.trim()))) &&
    (!!profileMatric || matricNo.trim().length > 0) &&
    fields.every((f) => !f.required || answers[f.id]?.trim());

  const clearInvalid = (id: string) =>
    invalid.has(id) && setInvalid((s) => new Set([...s].filter((x) => x !== id)));
  const answer = (id: string, value: string) => {
    setAnswers((a) => ({ ...a, [id]: value }));
    clearInvalid(`answers.${id}`);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || busy) return;
    setSubmitting(true);
    setInvalid(new Set());
    try {
      const checkout = await startGuestCheckout(dueId, {
        name: signedIn ? user.name : name.trim(),
        email: signedIn ? user.email : email.trim(),
        ...(profileMatric ? {} : { matricNo: matricNo.trim() }),
        ...(fields.length ? { answers } : {}),
        ...(!signedIn && createAccount ? { createAccount: true } : {}),
      });
      active.current = { reference: checkout.reference, token: checkout.token };
      if (checkout.checkoutUrl && !checkout.bankTransfer) {
        // Pay in the overlay, right here; the form stays as it is underneath.
        await overlay.open(checkout.checkoutUrl);
      } else {
        // Bank-transfer mode: the one-time account is shown on the status page.
        router.replace(statusHref(dueId, checkout.reference, checkout.token), { scroll: false });
      }
    } catch (err) {
      const details = err instanceof ApiError ? (err.details ?? []) : [];
      if (err instanceof ApiError && err.code === "EMAIL_HAS_ACCOUNT") {
        toast.error("This email has a Duevy account", {
          description: "Sign in to pay, so it shows in your history.",
          action: { label: "Sign in", onClick: () => router.push(`/login?next=${encodeURIComponent(`/pay/${dueId}`)}`) },
          duration: 10_000,
        });
      } else if (err instanceof ApiError && err.code === "VALIDATION_ERROR" && details.length) {
        // The rep may have changed the questions since this page loaded.
        setInvalid(new Set(details.map((d) => d.field)));
        const first = details[0]!;
        toast.error(
          first.field === "email"
            ? "That email address doesn't look right"
            : first.field === "matricNo"
              ? "Enter your matric number"
              : "Check your answers",
          { description: first.field.startsWith("answers.") ? first.issue : undefined },
        );
      } else if (err instanceof ApiError && err.code === "DUE_ALREADY_PAID") {
        toast.info("Already paid", { description: "This email has paid for this. Check your inbox for the receipt." });
      } else if (err instanceof ApiError && err.code === "CHECKOUT_OPENING") {
        toast.info("Still setting up your payment", { description: "Give it a few seconds, then try again." });
      } else {
        toast.error("Couldn't start the payment", {
          description: err instanceof ApiError ? err.message : "Check your connection and try again.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const payLabel = !due.canCollect
    ? "Not taking payments yet"
    : submitting
      ? "Setting up…"
      : overlay.phase !== "idle"
        ? "Opening secure checkout…"
        : overlay.attempted
          ? `Try again · ${exactNaira(due.total)}`
          : `Pay ${exactNaira(due.total)}`;

  return (
    <div className="overflow-hidden rounded-[28px] border border-cloud bg-canvas">
      {/* What's being paid, and how much. */}
      <div className="doodle-card relative px-6 pb-7 pt-6 text-white sm:px-8">
        <div className="relative flex items-center gap-3">
          <span className="rounded-2xl bg-white/15 p-1 ring-1 ring-white/20">
            <SpaceEmblem space={due.space} glyph={KIND_GLYPH[due.space.kind]} size={40} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs text-white/75">
              {due.space.name} · {SPACE_KIND_LABEL[due.space.kind]}
            </p>
            <h1 className="truncate text-base font-semibold tracking-tight sm:text-lg">{due.title}</h1>
          </div>
        </div>
        <div className="relative mt-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/70">Amount to pay</p>
          <p className="mt-1 text-[34px] font-semibold leading-none tracking-tight tabular-nums">{exactNaira(due.total)}</p>
          <p className="mt-2 text-xs text-white/75">
            {exactNaira(due.amount)} + {exactNaira(due.fee)} service fee · Due {shortDate(due.dueDate)}
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-5 p-6 sm:p-8" noValidate>
        {due.note && <p className="-mt-1 text-sm leading-relaxed text-ink-soft">{due.note}</p>}

        {/* Disabled while the overlay is up, so nothing changes under an open payment. */}
        <fieldset disabled={busy} className="flex min-w-0 flex-col gap-4">
          <legend className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft">Your details</legend>
          {signedIn ? (
            <div className="flex items-center gap-3 rounded-2xl bg-cloud/70 px-4 py-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-canvas text-brand">
                <HugeiconsIcon icon={SecurityCheckIcon} size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">Paying as {user.name}</p>
                <p className="truncate text-[11px] text-ink-soft">
                  {user.email}
                  {profileMatric ? ` · ${profileMatric}` : ""}
                </p>
              </div>
              {/* Someone else's session on this device: sign it out and pay as yourself. */}
              <button
                type="button"
                disabled={switching}
                onClick={async () => {
                  setSwitching(true);
                  try {
                    await logout();
                    toast.success("Signed out — enter your own details below.");
                  } catch {
                    toast.error("Couldn't sign out. Try again.");
                  } finally {
                    setSwitching(false);
                  }
                }}
                className="shrink-0 rounded-full bg-canvas px-3 py-1.5 text-xs font-medium text-brand transition hover:bg-paper disabled:opacity-60"
              >
                {switching ? "Signing out…" : "Not you?"}
              </button>
            </div>
          ) : (
            <>
              <FormField id="guest-name" label="Full name">
                <Input
                  id="guest-name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Write your name"
                  className={BRAND_INPUT}
                />
              </FormField>
              <FormField id="guest-email" label="Email">
                <Input
                  id="guest-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  aria-invalid={invalid.has("email")}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearInvalid("email");
                  }}
                  placeholder="Your email address"
                  className={cn(BRAND_INPUT, invalid.has("email") && INVALID)}
                />
              </FormField>
            </>
          )}
          {!profileMatric && (
            <FormField id="guest-matric" label="Matric number">
              <Input
                id="guest-matric"
                autoComplete="off"
                maxLength={32}
                value={matricNo}
                aria-invalid={invalid.has("matricNo")}
                onChange={(e) => {
                  setMatricNo(e.target.value);
                  clearInvalid("matricNo");
                }}
                placeholder="Your matric number"
                className={cn(BRAND_INPUT, invalid.has("matricNo") && INVALID)}
              />
            </FormField>
          )}
          {fields.map((f) => (
            <AnswerField
              key={f.id}
              field={f}
              value={answers[f.id] ?? ""}
              invalid={invalid.has(`answers.${f.id}`)}
              onChange={(v) => answer(f.id, v)}
            />
          ))}

          {!signedIn && (
            <label
              htmlFor="guest-create-account"
              className="mt-1 flex cursor-pointer items-start gap-2.5 rounded-2xl border border-cloud px-3.5 py-3 transition-colors has-[:checked]:border-brand/40 has-[:checked]:bg-cloud/50"
            >
              <input
                id="guest-create-account"
                type="checkbox"
                checked={createAccount}
                onChange={(e) => setCreateAccount(e.target.checked)}
                className="mt-px h-4 w-4 shrink-0 cursor-pointer rounded accent-[var(--color-brand)]"
              />
              <span className="min-w-0">
                <span className="block text-xs leading-relaxed text-ink">
                  Create a free Duevy account for me so I can track my payments, access receipts and manage
                  future collections.
                </span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-ink-soft">
                  You can still complete your payment without creating an account.
                </span>
              </span>
            </label>
          )}
        </fieldset>

        <div className="flex flex-col gap-3">
          <button
            type="submit"
            disabled={!valid || busy}
            className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-brand text-[15px] font-semibold text-white transition-all duration-300 hover:bg-brand-bright active:translate-y-px disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            {busy ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <HugeiconsIcon icon={SquareLock02Icon} size={16} />
            )}
            {payLabel}
          </button>
          <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-ink-soft">
            {TRUST.map((t) => (
              <li key={t} className="inline-flex items-center gap-1">
                <HugeiconsIcon icon={Tick02Icon} size={12} className="text-brand" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </form>
    </div>
  );
}

/** Red outline for a field the API rejected. */
const INVALID = "border-rose-400 focus-visible:border-rose-500 focus-visible:ring-rose-500/15";

function FormField({ id, label, optional, children }: { id: string; label: string; optional?: boolean; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-ink">
        {label} {optional && <span className="font-normal text-ink-soft">(optional)</span>}
      </Label>
      {children}
    </div>
  );
}

/** A short, plain prompt for one of the rep's questions. */
function placeholderFor(field: GuestField) {
  switch (field.type) {
    case "email":
      return "Your email address";
    case "phone":
      return "Your phone number";
    case "number":
      return "Enter a number";
    case "textarea":
      return "Write here";
    case "select":
      return "Choose one";
    default:
      return `Your ${field.label.charAt(0).toLowerCase()}${field.label.slice(1)}`;
  }
}

/** One of the rep's questions, as the input its type calls for. */
function AnswerField({
  field,
  value,
  invalid,
  onChange,
}: {
  field: GuestField;
  value: string;
  invalid: boolean;
  onChange: (value: string) => void;
}) {
  const id = `guest-q-${field.id}`;
  const input = {
    id,
    value,
    "aria-invalid": invalid,
    placeholder: placeholderFor(field),
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
  };

  return (
    <FormField id={id} label={field.label} optional={!field.required}>
      {field.type === "select" ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id={id} aria-invalid={invalid} className={cn("h-11 w-full rounded-2xl border-cloud bg-canvas px-4 text-sm font-normal", invalid && INVALID)}>
            <SelectValue placeholder={placeholderFor(field)} />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : field.type === "textarea" ? (
        <textarea
          {...input}
          maxLength={500}
          className={cn(
            "min-h-[96px] w-full resize-none rounded-2xl border border-cloud bg-canvas px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-[3px] focus:ring-brand/15 placeholder:text-ink-soft",
            invalid && INVALID,
          )}
        />
      ) : (
        <Input
          {...input}
          maxLength={500}
          {...(field.type === "email"
            ? { type: "email", inputMode: "email" as const }
            : field.type === "phone"
              ? { type: "tel", inputMode: "tel" as const, autoComplete: "tel" }
              : field.type === "number"
                ? { inputMode: "decimal" as const }
                : {})}
          className={cn(BRAND_INPUT, invalid && INVALID)}
        />
      )}
    </FormField>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — pay, then the outcome
// ---------------------------------------------------------------------------

function CheckoutStatus({
  dueId,
  reference,
  token,
  completed,
}: {
  dueId: string;
  reference: string;
  token: string;
  /** The overlay just reported completion: show "confirming" while the API catches up. */
  completed: boolean;
}) {
  const router = useRouter();
  const [checkout, setCheckout] = useState<GuestCheckoutStatus | null>(null);
  const [missing, setMissing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [confirming, setConfirming] = useState(completed);
  const [copied, setCopied] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const settled = useRef(false);
  // Seen pending on this visit: a change to paid / expired is news, so it gets a toast.
  const sawPending = useRef(false);
  const status = checkout?.status ?? "pending";

  const overlay = useOverlayCheckout({
    onCompleted: () => {
      setConfirming(true);
      void check(false);
    },
    onEnded: () => void check(false),
  });

  const check = async (manual: boolean) => {
    if (settled.current) return;
    if (manual) setChecking(true);
    try {
      const res = await getGuestCheckout(reference, token);
      setCheckout(res);
      if (res.status === "pending") {
        sawPending.current = true;
        if (manual) toast.info("Still waiting for your payment", { description: "It usually lands within a minute or two." });
      } else {
        settled.current = true;
        if (sawPending.current && res.status === "paid") toast.success("Payment confirmed", { description: "Your receipt is ready." });
        if (sawPending.current && res.status === "expired") toast.error("This payment expired", { description: "Nothing was charged." });
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        settled.current = true;
        setMissing(true);
      } else if (manual) {
        toast.error("Couldn't check the payment. Please try again.");
      }
    } finally {
      if (manual) setChecking(false);
    }
  };

  useEffect(() => {
    const first = setTimeout(() => void check(false), 0);
    return () => clearTimeout(first);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference, token]);

  // Poll while visible and still pending.
  useEffect(() => {
    if (status !== "pending" || missing) return;
    const poll = setInterval(() => !document.hidden && void check(false), confirming ? CONFIRM_POLL_MS : POLL_MS);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, missing, confirming]);

  const copy = async (key: string, value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 2000);
    } catch {
      toast.error("Couldn't copy — select it and copy manually.");
    }
  };

  const startOver = () => router.replace(`/pay/${encodeURIComponent(dueId)}`);

  if (missing) {
    return (
      <Notice
        tone="rose"
        icon={Alert01Icon}
        title="Payment not found"
        body="This payment link is incomplete or has been changed."
        action={{ label: "Start again", onClick: startOver }}
      />
    );
  }
  if (!checkout) return <CardSkeleton />;

  const { breakdown } = checkout;

  if (status === "paid") {
    return <PaidReceipt checkout={checkout} reference={reference} token={token} onAccount={(account) => setCheckout({ ...checkout, account })} />;
  }

  if (status === "expired") {
    return (
      <Notice
        tone="rose"
        icon={Clock01Icon}
        title="This payment expired"
        body={`It closed before any money arrived, so nothing was charged. Already paid? Contact support with reference ${reference}.`}
        action={{ label: "Start a new payment", onClick: startOver }}
      />
    );
  }

  if (status === "underpaid") {
    return (
      <Notice
        tone="amber"
        icon={Alert01Icon}
        title="Less than the total arrived"
        body={`${checkout.receivedKobo != null ? `We received ${exactNaira(checkout.receivedKobo)} of ${exactNaira(breakdown.total)}. ` : ""}Support will contact you by email to sort out the difference — don't pay again. Reference ${reference}.`}
      />
    );
  }

  const bank = checkout.bankTransfer;
  const hostedUrl = !bank ? checkout.checkoutUrl : null;
  const expiresAt = bank?.expiresAt ?? checkout.expiresAt;
  const msLeft = new Date(expiresAt).getTime() - now;

  // The overlay finished: the payment is with Bachs, and we're waiting on the API.
  if (confirming && !bank) {
    return (
      <div className="rounded-3xl border border-cloud bg-canvas p-6 text-center sm:p-8">
        <span className="mx-auto block h-12 w-12 animate-spin rounded-full border-[3px] border-brand/20 border-t-brand" />
        <h1 className="mt-4 text-lg font-semibold text-ink">Confirming your payment…</h1>
        <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed text-ink-soft">
          We&apos;re checking with the payment provider. This usually takes a few seconds — please keep this
          page open.
        </p>
        <Breakdown face={breakdown.face} fee={breakdown.fee} total={breakdown.total} />
        <p className="mt-4 text-[11px] text-ink-soft">
          Reference <span className="font-semibold text-ink">{reference}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-cloud bg-canvas p-6 sm:p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-brand/10 text-brand">
          <HugeiconsIcon icon={hostedUrl ? SecurityCheckIcon : BankIcon} size={22} />
        </span>
        <h1 className="text-lg font-semibold text-ink">{hostedUrl ? "Complete your payment" : "Pay by bank transfer"}</h1>
        <p className="text-sm text-ink-soft">
          {hostedUrl ? (
            "Your payment is ready. Open the secure checkout to finish — you won't leave this page."
          ) : (
            <>
              Send the <span className="font-semibold text-ink">exact amount</span> to this one-time
              account from any bank app. We confirm it automatically.
            </>
          )}
        </p>
      </div>

      {hostedUrl ? (
        <div className="mt-5 flex flex-col gap-3">
          <button
            type="button"
            disabled={overlay.phase !== "idle" || msLeft <= 0}
            onClick={() => void overlay.open(hostedUrl)}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:opacity-60 cursor-pointer"
          >
            {overlay.phase !== "idle" ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <HugeiconsIcon icon={SecurityCheckIcon} size={16} />
            )}
            {overlay.phase !== "idle"
              ? "Opening secure checkout…"
              : `${overlay.attempted ? "Try again" : "Pay"} ${exactNaira(breakdown.total)}`}
          </button>
        </div>
      ) : bank ? (
        <div className="mt-5 flex flex-col gap-3">
          <div className="rounded-2xl border border-brand/20 bg-cloud/60 p-4">
            <p className="text-[11px] font-medium text-ink-soft">Amount to send</p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="text-2xl font-semibold tracking-tight text-ink">{exactNaira(bank.amountKobo)}</p>
              <CopyButton done={copied === "amount"} label="Copy amount" onClick={() => void copy("amount", (bank.amountKobo / 100).toFixed(2), "Amount")} />
            </div>
          </div>
          <div className="rounded-2xl border border-cloud bg-paper/50 p-4">
            <p className="text-[11px] font-medium text-ink-soft">Account number</p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <p className="font-mono text-xl font-semibold tracking-wider text-ink">{bank.accountNumber}</p>
              <CopyButton done={copied === "account"} label="Copy account number" onClick={() => void copy("account", bank.accountNumber, "Account number")} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-cloud pt-3 text-sm">
              <div className="min-w-0">
                <dt className="text-[11px] font-medium text-ink-soft">Bank</dt>
                <dd className="truncate font-medium text-ink">{bank.bankName || "—"}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[11px] font-medium text-ink-soft">Account name</dt>
                <dd className="truncate font-medium text-ink">{bank.accountName || "—"}</dd>
              </div>
            </dl>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex flex-col items-center gap-2 rounded-2xl border border-cloud bg-paper/50 p-5 text-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
          <p className="text-sm text-ink-soft">Setting up your payment…</p>
        </div>
      )}

      <p className={cn("mt-3 inline-flex w-full items-center justify-center gap-1.5 text-xs", msLeft > 0 ? "text-ink-soft" : "text-rose-600")}>
        <HugeiconsIcon icon={Clock01Icon} size={13} />
        {msLeft > 0 ? (
          <>
            Expires in <span className="font-semibold tabular-nums">{formatCountdown(msLeft)}</span>
          </>
        ) : hostedUrl ? (
          "This checkout has expired. Checking for a final update…"
        ) : (
          "Expired — don't send money to it. Checking for a final update…"
        )}
      </p>

      <Breakdown face={breakdown.face} fee={breakdown.fee} total={breakdown.total} />

      {hostedUrl ? (
        <button
          type="button"
          onClick={startOver}
          className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-full border border-cloud text-sm font-semibold text-ink transition-colors duration-300 hover:border-brand/40 hover:text-brand cursor-pointer"
        >
          Edit my details
        </button>
      ) : (
        <button
          type="button"
          disabled={checking}
          onClick={() => void check(true)}
          className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-cloud text-sm font-semibold text-ink transition-colors duration-300 hover:border-brand/40 hover:text-brand disabled:opacity-60 cursor-pointer"
        >
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
          {checking ? "Checking…" : "I've sent the money"}
        </button>
      )}
      <p className="mt-3 text-center text-[11px] text-ink-soft">
        This page updates on its own. Reference <span className="font-semibold text-ink">{reference}</span>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — paid
// ---------------------------------------------------------------------------

/** Re-check this many times for the activation email to go out after payment (it's sent just after). */
const INVITE_CHECKS = 6;

function PaidReceipt({
  checkout,
  reference,
  token,
  onAccount,
}: {
  checkout: GuestCheckoutStatus;
  reference: string;
  token: string;
  onAccount: (account: GuestAccountState) => void;
}) {
  const { breakdown, items, account } = checkout;
  const title = items.length === 1 ? items[0]!.title : `${items.length} dues`;
  const paidAt = checkout.paidAt ? new Date(checkout.paidAt) : null;
  const awaitingInvite = account.requested && !account.exists && !account.inviteSentAt;
  const onAccountRef = useRef(onAccount);
  useEffect(() => {
    onAccountRef.current = onAccount;
  });

  // The activation link goes out a moment after the payment is confirmed: look again briefly.
  useEffect(() => {
    if (!awaitingInvite) return;
    let left = INVITE_CHECKS;
    const timer = setInterval(() => {
      if (left-- <= 0) return clearInterval(timer);
      getGuestCheckout(reference, token)
        .then((c) => c.account.inviteSentAt && onAccountRef.current(c.account))
        .catch(() => {});
    }, 4000);
    return () => clearInterval(timer);
  }, [awaitingInvite, reference, token]);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-3xl border border-cloud bg-canvas p-6 sm:p-8">
        <div className="text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand/10 text-brand">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={28} />
          </span>
          <h1 className="mt-3 text-lg font-semibold text-ink">Payment successful</h1>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-ink tabular-nums">
            {exactNaira(checkout.receivedKobo ?? breakdown.total)}
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            for <span className="font-medium text-ink">{title}</span> · {checkout.spaceName}
          </p>
        </div>

        <dl className="mt-6 flex flex-col gap-2 rounded-2xl border border-cloud bg-paper/50 p-4 text-xs">
          <Row label="Paid by" value={checkout.payer.name} />
          <Row label="Email" value={checkout.payer.email} />
          {checkout.payer.matricNo && <Row label="Matric number" value={checkout.payer.matricNo} />}
          {checkout.answers.map((a) => (
            <Row key={a.fieldId} label={a.label} value={a.value} />
          ))}
          <div className="my-1 border-t border-cloud" />
          {paidAt && (
            <Row
              label="Date"
              value={paidAt.toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
            />
          )}
          <Row label="Transaction ref." value={reference} mono />
          {checkout.receiptNumber && <Row label="Receipt no." value={checkout.receiptNumber} mono />}
        </dl>

        <Breakdown face={breakdown.face} fee={breakdown.fee} total={breakdown.total} />

        <div className="mt-5 flex flex-col items-center gap-2">
          {checkout.receiptNumber ? (
            <ReceiptButton reference={reference} token={token} />
          ) : (
            <p className="text-xs text-ink-soft">Your receipt is being issued — refresh in a moment.</p>
          )}
          <p className="text-[11px] text-ink-soft">A copy is on its way to {checkout.payer.email}.</p>
        </div>
      </div>

      <AccountCard account={account} email={checkout.payer.email} reference={reference} token={token} onAccount={onAccount} />
    </div>
  );
}

/** The payer's Duevy account: activation pending, an offer to create one, or a sign-in link. */
function AccountCard({
  account,
  email,
  reference,
  token,
  onAccount,
}: {
  account: GuestAccountState;
  email: string;
  reference: string;
  token: string;
  onAccount: (account: GuestAccountState) => void;
}) {
  const [busy, setBusy] = useState(false);

  const request = async () => {
    setBusy(true);
    try {
      const res = await requestGuestAccount(reference, token);
      onAccount(res.account);
      if (res.outcome === "sent") toast.success("Activation link sent", { description: `Check ${email}.` });
      else if (res.outcome === "already_sent") toast.info("We just sent one", { description: "Give it a minute, and check spam too." });
    } catch (err) {
      toast.error(
        err instanceof ApiError && err.code === "ACCOUNT_EXISTS"
          ? "This email already has an account — sign in instead."
          : "Couldn't send the link. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const shell = "rounded-3xl border border-cloud bg-canvas p-5 sm:p-6";
  const secondary =
    "inline-flex h-10 items-center justify-center gap-1.5 rounded-full border border-cloud px-4 text-sm font-semibold text-ink transition-colors hover:border-brand/40 hover:text-brand disabled:opacity-60 cursor-pointer";

  if (account.exists) {
    return (
      <div className={cn(shell, "flex items-center gap-3")}>
        <IconBubble icon={SecurityCheckIcon} />
        <p className="min-w-0 flex-1 text-sm text-ink-soft">
          This payment is saved to your Duevy account.
        </p>
        <Link href="/dashboard/transactions" className={secondary}>
          View
        </Link>
      </div>
    );
  }

  if (account.requested) {
    return (
      <div className={cn(shell, "flex flex-col gap-3 sm:flex-row sm:items-center")}>
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <IconBubble icon={Mail01Icon} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">
              {account.inviteSentAt ? "Activate your Duevy account" : "Setting up your Duevy account…"}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
              {account.inviteSentAt ? (
                <>
                  We&apos;ve emailed an activation link to <span className="font-medium text-ink">{email}</span>. Open it
                  to set your password — it works once and expires in 72 hours. This payment is already linked.
                </>
              ) : (
                <>We&apos;ll email an activation link to {email} in a moment. Your payment is safe either way.</>
              )}
            </p>
          </div>
        </div>
        <button type="button" onClick={() => void request()} disabled={busy} className={cn(secondary, "shrink-0")}>
          {busy ? "Sending…" : account.inviteSentAt ? "Resend link" : "Send it now"}
        </button>
      </div>
    );
  }

  return (
    <div className={cn(shell, "flex flex-col gap-3 sm:flex-row sm:items-center")}>
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <IconBubble icon={UserAdd01Icon} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">Keep your receipts in one place</p>
          <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
            Create a free Duevy account for {email} to track payments and pay future collections faster. This
            payment comes with it.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => void request()}
        disabled={busy}
        className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-bright disabled:opacity-60 cursor-pointer"
      >
        {busy ? "Sending…" : "Create account"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------

function IconBubble({ icon }: { icon: typeof Alert01Icon }) {
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
      <HugeiconsIcon icon={icon} size={18} />
    </span>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="shrink-0 text-ink-soft">{label}</dt>
      <dd className={cn("min-w-0 truncate text-right font-medium text-ink", mono && "font-mono")}>{value}</dd>
    </div>
  );
}

function Breakdown({ face, fee, total }: { face: number; fee: number; total: number }) {
  return (
    <div className="mt-5 rounded-2xl border border-cloud bg-paper/50 p-4 text-left">
      <div className="flex items-center justify-between text-xs text-ink-soft">
        <span>Amount</span>
        <span className="font-medium text-ink">{exactNaira(face)}</span>
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs text-ink-soft">
        <span>Service fee (2% + ₦20)</span>
        <span className="font-medium text-ink">{exactNaira(fee)}</span>
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-cloud pt-2">
        <span className="text-xs font-medium text-ink-soft">Total</span>
        <span className="text-base font-semibold tracking-tight text-ink">{exactNaira(total)}</span>
      </div>
    </div>
  );
}

function Notice({
  tone,
  icon,
  title,
  body,
  action,
}: {
  tone: "rose" | "amber";
  icon: typeof Alert01Icon;
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="rounded-3xl border border-cloud bg-canvas p-6 text-center sm:p-8">
      <span
        className={cn(
          "mx-auto grid h-14 w-14 place-items-center rounded-full",
          tone === "rose" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600",
        )}
      >
        <HugeiconsIcon icon={icon} size={24} />
      </span>
      <h1 className="mt-3 text-lg font-semibold text-ink">{title}</h1>
      <p className="mt-1 text-sm leading-relaxed text-ink-soft">{body}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-5 inline-flex h-10 items-center rounded-full bg-brand px-4 text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright cursor-pointer"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/** The card's own shape while it loads: the dark header, then the form. */
function CardSkeleton() {
  return (
    <div aria-busy aria-label="Loading" className="overflow-hidden rounded-[28px] border border-cloud bg-canvas">
      <div className="doodle-card px-6 pb-7 pt-6 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 animate-pulse rounded-2xl bg-white/20" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-40 animate-pulse rounded-full bg-white/20" />
            <div className="h-4 w-28 animate-pulse rounded-full bg-white/25" />
          </div>
        </div>
        <div className="mt-6 h-3 w-24 animate-pulse rounded-full bg-white/20" />
        <div className="mt-3 h-8 w-44 animate-pulse rounded-full bg-white/25" />
        <div className="mt-3 h-3 w-52 animate-pulse rounded-full bg-white/20" />
      </div>
      <div className="flex flex-col gap-4 p-6 sm:p-8">
        <div className="h-3 w-20 animate-pulse rounded-full bg-ink/[0.1]" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-24 animate-pulse rounded-full bg-ink/[0.1]" />
            <div className="h-11 animate-pulse rounded-full bg-ink/[0.07]" />
          </div>
        ))}
        <div className="mt-1 h-[52px] animate-pulse rounded-full bg-brand/35" />
      </div>
    </div>
  );
}

/**
 * The paid receipt. A real one opens straight from the API; a demo payment's
 * comes from the demo's sample data, so it's fetched and saved instead.
 */
function ReceiptButton({ reference, token }: { reference: string; token: string }) {
  const [busy, setBusy] = useState(false);
  const className =
    "inline-flex h-11 items-center gap-1.5 rounded-full bg-brand px-5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:opacity-60 cursor-pointer";

  if (!isDemoMode()) {
    return (
      <a href={guestReceiptUrl(reference, token)} target="_blank" rel="noopener noreferrer" className={className}>
        <HugeiconsIcon icon={Download04Icon} size={15} />
        Download receipt
      </a>
    );
  }

  const download = async () => {
    setBusy(true);
    try {
      const url = URL.createObjectURL(await apiClient.getBlob(guestReceiptPath(reference, token)));
      const a = document.createElement("a");
      a.href = url;
      a.download = `Duevy-receipt-${reference}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      toast.error("Couldn't download the receipt. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" onClick={() => void download()} disabled={busy} className={className}>
      <HugeiconsIcon icon={Download04Icon} size={15} />
      {busy ? "Preparing…" : "Download receipt"}
    </button>
  );
}

function CopyButton({ done, label, onClick }: { done: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-cloud bg-canvas px-3 text-xs font-semibold text-brand transition-colors duration-300 hover:bg-cloud cursor-pointer"
    >
      <HugeiconsIcon icon={done ? Tick02Icon : Copy01Icon} size={14} />
      {done ? "Copied" : "Copy"}
    </button>
  );
}
