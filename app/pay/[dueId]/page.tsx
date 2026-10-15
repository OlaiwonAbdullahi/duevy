"use client";

import { Suspense, useEffect, useRef, useState } from "react";
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
  LinkSquare01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/errors";
import {
  getGuestCheckout,
  getGuestDue,
  guestReceiptUrl,
  startGuestCheckout,
  type GuestCheckoutStatus,
  type GuestDue,
} from "@/lib/api/guest";
import { BRAND_INPUT } from "../../(dashboards)/dashboard/_components/form-styles";
import { SpaceEmblem } from "../../(dashboards)/dashboard/dues/_components/SpaceEmblem";
import { KIND_GLYPH, SPACE_KIND_LABEL } from "../../(dashboards)/dashboard/dues/_components/data";

const POLL_MS = 5000;
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

/**
 * Public pay page for a guest-enabled due: `/pay/<dueId>`. A guest enters a
 * name and email and pays by bank transfer — no account. Once a checkout is
 * open its reference and token ride in the URL (`?ref=&t=`), so a refresh, or
 * coming back from a hosted checkout, lands on the same payment.
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
    <CheckoutStatus dueId={dueId} reference={reference} token={token} />
  ) : (
    <PayForm dueId={dueId} />
  );
}

// ---------------------------------------------------------------------------
// Step 1 — who's paying
// ---------------------------------------------------------------------------

function PayForm({ dueId }: { dueId: string }) {
  const router = useRouter();
  const [due, setDue] = useState<GuestDue | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "closed">("loading");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [matricNo, setMatricNo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ message: string; signIn?: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getGuestDue(dueId)
      .then((d) => {
        if (cancelled) return;
        setDue(d);
        setState("ready");
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

  const valid = name.trim().length >= 2 && EMAIL_RE.test(email.trim());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const checkout = await startGuestCheckout(dueId, {
        name: name.trim(),
        email: email.trim(),
        ...(matricNo.trim() ? { matricNo: matricNo.trim() } : {}),
      });
      const next = `/pay/${encodeURIComponent(dueId)}?ref=${encodeURIComponent(checkout.reference)}&t=${encodeURIComponent(checkout.token)}`;
      // Keep the payment in the URL first, so Back from a hosted page returns to it.
      router.replace(next, { scroll: false });
      if (checkout.checkoutUrl && !checkout.bankTransfer) window.location.href = checkout.checkoutUrl;
    } catch (err) {
      if (err instanceof ApiError && err.code === "EMAIL_HAS_ACCOUNT") {
        setError({ message: "This email already has a Duevy account. Sign in to pay so it shows in your history.", signIn: true });
      } else if (err instanceof ApiError && err.code === "DUE_ALREADY_PAID") {
        setError({ message: "This email has already paid for this. Check your inbox for the receipt." });
      } else {
        setError({ message: err instanceof ApiError ? err.message : "Couldn't start the payment. Please try again." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-cloud bg-canvas p-6 sm:p-8">
      <div className="flex items-center gap-4">
        <SpaceEmblem space={due.space} glyph={KIND_GLYPH[due.space.kind]} size={52} />
        <div className="min-w-0">
          <p className="truncate text-xs text-ink-soft">
            {due.space.name} · {SPACE_KIND_LABEL[due.space.kind]}
          </p>
          <h1 className="truncate text-lg font-semibold tracking-tight text-ink">{due.title}</h1>
        </div>
      </div>
      {due.note && <p className="mt-4 text-sm leading-relaxed text-ink-soft">{due.note}</p>}

      <Breakdown face={due.amount} fee={due.fee} total={due.total} />

      {!due.canCollect ? (
        <p className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
          This department can&apos;t take payments yet — its rep is still finishing verification.
          Try again later.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4" noValidate>
          <div>
            <Label htmlFor="guest-name" className="text-xs font-medium text-ink">Full name</Label>
            <Input
              id="guest-name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="As it should appear on your receipt"
              className={cn(BRAND_INPUT, "mt-1.5")}
            />
          </div>
          <div>
            <Label htmlFor="guest-email" className="text-xs font-medium text-ink">Email</Label>
            <Input
              id="guest-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="We'll send your receipt here"
              className={cn(BRAND_INPUT, "mt-1.5")}
            />
          </div>
          <div>
            <Label htmlFor="guest-matric" className="text-xs font-medium text-ink">
              Matric number <span className="font-normal text-ink-soft">(optional)</span>
            </Label>
            <Input
              id="guest-matric"
              value={matricNo}
              onChange={(e) => setMatricNo(e.target.value)}
              placeholder="Helps the rep match your payment"
              className={cn(BRAND_INPUT, "mt-1.5")}
            />
          </div>

          {error && (
            <p className="rounded-2xl bg-rose-50 p-3 text-[13px] leading-relaxed text-rose-700">
              {error.message}{" "}
              {error.signIn && (
                <Link href="/login?next=/dashboard/dues" className="font-semibold underline">
                  Sign in
                </Link>
              )}
            </p>
          )}

          <button
            type="submit"
            disabled={!valid || submitting}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:opacity-60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            {submitting ? "Setting up…" : `Pay ${exactNaira(due.total)}`}
          </button>
          <p className="text-center text-[11px] leading-relaxed text-ink-soft">
            No account needed. You&apos;ll pay by bank transfer and get a receipt by email.
          </p>
        </form>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — transfer, then the outcome
// ---------------------------------------------------------------------------

function CheckoutStatus({ dueId, reference, token }: { dueId: string; reference: string; token: string }) {
  const router = useRouter();
  const [checkout, setCheckout] = useState<GuestCheckoutStatus | null>(null);
  const [missing, setMissing] = useState(false);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const settled = useRef(false);
  const status = checkout?.status ?? "pending";

  const check = async (manual: boolean) => {
    if (settled.current) return;
    if (manual) setChecking(true);
    try {
      const res = await getGuestCheckout(reference, token);
      setCheckout(res);
      if (res.status !== "pending") settled.current = true;
      else if (manual) toast.info("Still waiting for your transfer", { description: "Transfers usually land within a minute or two." });
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
    const poll = setInterval(() => !document.hidden && void check(false), POLL_MS);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, missing]);

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

  const { breakdown, items } = checkout;
  const title = items.length === 1 ? items[0]!.title : `${items.length} dues`;

  if (status === "paid") {
    return (
      <div className="rounded-3xl border border-cloud bg-canvas p-6 text-center sm:p-8">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand/10 text-brand">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={26} />
        </span>
        <h1 className="mt-3 text-lg font-semibold text-ink">Payment confirmed</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {exactNaira(checkout.receivedKobo ?? breakdown.total)} received for {title}. We&apos;ve emailed
          your receipt.
        </p>
        <Breakdown face={breakdown.face} fee={breakdown.fee} total={breakdown.total} />
        <dl className="mt-4 flex flex-col gap-1.5 text-left text-xs">
          {checkout.receiptNumber && (
            <div className="flex justify-between gap-3 text-ink-soft">
              <dt>Receipt no.</dt>
              <dd className="font-medium text-ink">{checkout.receiptNumber}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3 text-ink-soft">
            <dt>Reference</dt>
            <dd className="min-w-0 truncate font-medium text-ink">{reference}</dd>
          </div>
        </dl>
        {checkout.receiptNumber && (
          <a
            href={guestReceiptUrl(reference, token)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex h-11 items-center gap-1.5 rounded-full bg-brand px-5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright"
          >
            <HugeiconsIcon icon={Download04Icon} size={15} />
            Download receipt
          </a>
        )}
        <p className="mt-5 text-xs text-ink-soft">
          Want all your receipts in one place?{" "}
          <Link href="/forgot-password" className="font-semibold text-brand hover:underline">
            Set a password for this email
          </Link>
        </p>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <Notice
        tone="rose"
        icon={Clock01Icon}
        title="This payment expired"
        body={`It closed before any money arrived, so nothing was charged. Already sent money? Contact support with reference ${reference}.`}
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

  return (
    <div className="rounded-3xl border border-cloud bg-canvas p-6 sm:p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-brand/10 text-brand">
          <HugeiconsIcon icon={BankIcon} size={22} />
        </span>
        <h1 className="text-lg font-semibold text-ink">{hostedUrl ? "Complete your payment" : "Pay by bank transfer"}</h1>
        <p className="text-sm text-ink-soft">
          {hostedUrl ? (
            "Pay on our secure checkout page, then come back here — we confirm it automatically."
          ) : (
            <>
              Send the <span className="font-semibold text-ink">exact amount</span> to this one-time
              account from any bank app. We confirm it automatically.
            </>
          )}
        </p>
      </div>

      {hostedUrl ? (
        <a
          href={hostedUrl}
          className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright"
        >
          <HugeiconsIcon icon={LinkSquare01Icon} size={16} />
          Continue to payment
        </a>
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
          <p className="text-sm text-ink-soft">Setting up your transfer account…</p>
        </div>
      )}

      <p className={cn("mt-3 inline-flex w-full items-center justify-center gap-1.5 text-xs", msLeft > 0 ? "text-ink-soft" : "text-rose-600")}>
        <HugeiconsIcon icon={Clock01Icon} size={13} />
        {msLeft > 0 ? (
          <>
            Expires in <span className="font-semibold tabular-nums">{formatCountdown(msLeft)}</span>
          </>
        ) : (
          "Expired — don't send money to it. Checking for a final update…"
        )}
      </p>

      <Breakdown face={breakdown.face} fee={breakdown.fee} total={breakdown.total} />

      <button
        type="button"
        disabled={checking}
        onClick={() => void check(true)}
        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-cloud text-sm font-semibold text-ink transition-colors duration-300 hover:border-brand/40 hover:text-brand disabled:opacity-60 cursor-pointer"
      >
        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
        {checking ? "Checking…" : "I've sent the money"}
      </button>
      <p className="mt-3 text-center text-[11px] text-ink-soft">
        This page updates on its own. Reference <span className="font-semibold text-ink">{reference}</span>
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------

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

function CardSkeleton() {
  return <div className="h-80 animate-pulse rounded-3xl border border-cloud bg-paper/50" />;
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
