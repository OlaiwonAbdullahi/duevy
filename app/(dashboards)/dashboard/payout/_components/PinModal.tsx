"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon, SquareLock02Icon } from "@hugeicons/core-free-icons";
import { Modal } from "../../_components/Modal";
import { BARE_INPUT } from "../../_components/form-styles";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** set: first code · change: knows the current one · reset: forgot it. */
export type PinMode = "set" | "change" | "reset";

const COPY: Record<PinMode, { title: string; intro: string; submit: string }> = {
  set: {
    title: "Set a withdrawal code",
    intro: "Choose a 4-digit code. You'll enter it every time you withdraw. Only you know it — not even Duevy can see it.",
    submit: "Save code",
  },
  change: {
    title: "Change withdrawal code",
    intro: "Enter your current code and choose a new one.",
    submit: "Change code",
  },
  reset: {
    title: "Reset withdrawal code",
    intro:
      "Forgot your code? Choose a new one with your account password. For your safety, withdrawals pause for 24 hours after a reset, and your co-reps are notified.",
    submit: "Reset code",
  },
};

const WEAK = new Set(["0123", "1234", "2345", "3456", "4567", "5678", "6789", "9876", "8765", "7654", "6543", "5432", "4321", "3210"]);
const isWeak = (pin: string) => /^(\d)\1{3}$/.test(pin) || WEAK.has(pin);
const digits = (v: string) => v.replace(/[^0-9]/g, "").slice(0, 4);

function PinField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mt-4">
      <label htmlFor={id} className="block text-xs font-medium text-ink-soft">
        {label}
      </label>
      <div className="mt-1.5 flex items-center rounded-2xl border border-cloud bg-canvas px-4 focus-within:border-brand">
        <Input
          id={id}
          type="password"
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          value={value}
          onChange={(e) => onChange(digits(e.target.value))}
          placeholder="••••"
          className={cn(BARE_INPUT, "flex-1 tracking-[0.5em]")}
        />
      </div>
    </div>
  );
}

export function PinModal({
  mode,
  onClose,
  onSubmit,
  onForgot,
}: {
  mode: PinMode;
  onClose: () => void;
  onSubmit: (payload: { pin: string; password: string; currentPin?: string }) => Promise<void>;
  /** From "change": switch to the reset flow. */
  onForgot?: () => void;
}) {
  const copy = COPY[mode];
  const [currentPin, setCurrentPin] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const weak = pin.length === 4 && isWeak(pin);
  const mismatch = confirmPin.length === 4 && confirmPin !== pin;
  const valid =
    pin.length === 4 &&
    !weak &&
    confirmPin === pin &&
    password.length > 0 &&
    (mode !== "change" || currentPin.length === 4);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setSubmitting(true);
    try {
      await onSubmit({ pin, password, ...(mode === "change" ? { currentPin } : {}) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={copy.title} icon={SquareLock02Icon} onClose={onClose}>
      <form onSubmit={submit}>
        <p className="text-xs leading-5 text-ink-soft">{copy.intro}</p>

        {mode === "change" && (
          <>
            <PinField id="current-pin" label="Current code" value={currentPin} onChange={setCurrentPin} />
            {onForgot && (
              <button
                type="button"
                onClick={onForgot}
                className="mt-1.5 text-xs font-semibold text-brand hover:underline cursor-pointer"
              >
                Forgot your current code?
              </button>
            )}
          </>
        )}
        <PinField id="new-pin" label="New code" value={pin} onChange={setPin} />
        {weak && (
          <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600">
            <HugeiconsIcon icon={Alert01Icon} size={13} />
            Too easy to guess — avoid 1111 or 1234-style codes.
          </p>
        )}
        <PinField id="confirm-pin" label="Confirm new code" value={confirmPin} onChange={setConfirmPin} />
        {mismatch && (
          <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600">
            <HugeiconsIcon icon={Alert01Icon} size={13} />
            The codes don&apos;t match.
          </p>
        )}

        <div className="mt-4">
          <label htmlFor="pin-password" className="block text-xs font-medium text-ink-soft">
            Account password
          </label>
          <div className="mt-1.5 flex items-center rounded-2xl border border-cloud bg-canvas px-4 focus-within:border-brand">
            <Input
              id="pin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(BARE_INPUT, "flex-1")}
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-12 flex-1 rounded-full border border-cloud bg-canvas text-sm font-semibold text-ink transition-colors duration-300 hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!valid || submitting}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            {submitting && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {submitting ? "Saving…" : copy.submit}
          </button>
        </div>
      </form>
    </Modal>
  );
}
