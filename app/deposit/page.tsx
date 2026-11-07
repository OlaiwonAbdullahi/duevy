"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon, CheckmarkCircle02Icon, TestTube01Icon } from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ApiError, NetworkError } from "@/lib/api/errors";
import { simulateDeposit, type SimulatedDeposit } from "@/lib/api/dev";
import { exactNaira } from "@/components/payments/BankTransferPanel";
import { BRAND_INPUT } from "../(dashboards)/dashboard/_components/form-styles";

const ACCOUNT_RE = /^\d{10}$/;
/** Naira with at most two decimal places, e.g. "5075" or "5075.50". */
const NAIRA_RE = /^\d+(\.\d{1,2})?$/;

/** "5,075.50" → 507550 kobo, or null if it isn't a positive amount. */
function toKobo(naira: string): number | null {
  const clean = naira.replace(/[,\s₦]/g, "");
  if (!NAIRA_RE.test(clean)) return null;
  const [whole, frac = ""] = clean.split(".");
  const kobo = Number(whole) * 100 + Number(frac.padEnd(2, "0"));
  return Number.isSafeInteger(kobo) && kobo > 0 ? kobo : null;
}

function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === "AMOUNT_MISMATCH") return "That isn't the checkout's exact total, so nothing was deposited.";
    if (err.code === "DEPOSIT_REFUSED") return "9jaPay refused it — the account is unknown, closed or already paid.";
    if (err.status === 404) return "This API isn't a sandbox, so it can't simulate deposits.";
    return err.message;
  }
  if (err instanceof NetworkError) return err.message;
  return "Something went wrong. Please try again.";
}

function DepositForm() {
  const params = useSearchParams();
  // `?account=9000143502&amount=507500` (kobo) prefills the form.
  const initialKobo = Number(params.get("amount"));
  const [account, setAccount] = useState(() => (params.get("account") ?? "").replace(/\D/g, "").slice(0, 10));
  const [amount, setAmount] = useState(() =>
    Number.isSafeInteger(initialKobo) && initialKobo > 0 ? (initialKobo / 100).toFixed(2) : "",
  );
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SimulatedDeposit | null>(null);
  const [error, setError] = useState<string | null>(null);

  const kobo = toKobo(amount);
  const accountOk = ACCOUNT_RE.test(account);
  const canSubmit = accountOk && kobo !== null && !busy;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit || kobo === null) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      setResult(await simulateDeposit(account, kobo));
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-3xl border border-cloud bg-canvas p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-2 text-amber-700">
        <HugeiconsIcon icon={TestTube01Icon} size={18} aria-hidden />
        <h1 className="text-lg font-semibold text-ink">Simulate a deposit</h1>
      </div>
      <p className="mt-1.5 text-sm text-ink-soft">
        Pretend someone transferred money into a 9jaPay account. A checkout&apos;s one-time account only takes its exact
        total; the checkout is confirmed straight away.
      </p>

      <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="account" className="text-ink">Account number</Label>
          <Input
            id="account"
            inputMode="numeric"
            autoComplete="off"
            placeholder="9000143502"
            value={account}
            onChange={(e) => setAccount(e.target.value.replace(/\D/g, "").slice(0, 10))}
            aria-invalid={account.length > 0 && !accountOk}
            className={cn(BRAND_INPUT, "font-mono tracking-wider")}
          />
          {account.length > 0 && !accountOk && <p className="text-xs text-red-600">Enter all 10 digits.</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="amount" className="text-ink">Amount (₦)</Label>
          <Input
            id="amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="5075.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-invalid={amount.length > 0 && kobo === null}
            className={BRAND_INPUT}
          />
          {amount.length > 0 && kobo === null ? (
            <p className="text-xs text-red-600">Enter a positive amount with at most two decimal places.</p>
          ) : kobo !== null ? (
            <p className="text-xs text-ink-soft">
              Sends {exactNaira(kobo)} ({kobo.toLocaleString("en-NG")} kobo).
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden />}
          {busy ? "Sending test transfer… (a few seconds)" : "Simulate deposit"}
        </button>
      </form>

      <div aria-live="polite">
        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <HugeiconsIcon icon={Alert01Icon} size={16} className="mt-0.5 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
            <div className="flex items-center gap-2 font-semibold">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} aria-hidden />
              Deposited {exactNaira(result.amount)} into {result.accountNumber}
            </div>
            {result.checkout ? (
              <p className="mt-1.5">
                Checkout <span className="font-mono font-semibold">{result.checkout.reference}</span> is{" "}
                <span className="font-semibold">{result.checkout.status}</span>.
                {result.checkout.status === "pending" && " The pay page's next status poll will pick it up."}{" "}
                <Link
                  href={`/dashboard/pay/${encodeURIComponent(result.checkout.reference)}`}
                  className="font-semibold underline underline-offset-2"
                >
                  View checkout
                </Link>
              </p>
            ) : (
              <p className="mt-1.5">No open checkout holds this account (e.g. it&apos;s a space account).</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DepositPage() {
  return (
    <Suspense>
      <DepositForm />
    </Suspense>
  );
}
