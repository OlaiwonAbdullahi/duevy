"use client";

import { useState } from "react";
import { Alert01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Modal } from "../../_components/Modal";
import { BRAND_INPUT } from "../../_components/form-styles";
import { deleteAccount } from "@/lib/api/me";
import { setAccessToken } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";

export function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = password.length > 0;

  const submit = async () => {
    if (!valid) return;
    setSubmitting(true);
    setError(null);
    try {
      await deleteAccount({ password, reason: reason || undefined });
      // The account (and every session) is gone server-side — clear local
      // state and force a full reload so nothing stale renders on the way out.
      setAccessToken(null);
      window.location.href = "/login";
    } catch (err) {
      if (err instanceof ApiError && err.code === "WALLET_NOT_EMPTY") {
        setError("Your wallet still has a balance — withdraw or spend it first.");
      } else if (err instanceof ApiError && err.code === "ACTIVE_REP_OBLIGATIONS") {
        setError("Transfer lead rep or close your active dues before deactivating.");
      } else {
        setError(
          err instanceof ApiError
            ? err.message
            : "Couldn't deactivate your account. Please try again.",
        );
      }
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Deactivate account" icon={Alert01Icon} onClose={onClose}>
      <p className="text-[13px] leading-5 text-ink-soft">
        This hides your profile and signs you out everywhere. Outstanding dues
        remain payable, and you can reactivate any time by signing back in.
      </p>

      <div className="mt-5 flex flex-col gap-4">
        <div>
          <Label className="block text-xs font-medium text-ink-soft">
            Confirm your password
          </Label>
          <Input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            className={cn(BRAND_INPUT, "mt-1.5")}
          />
        </div>
        <div>
          <Label className="block text-xs font-medium text-ink-soft">
            Reason <span className="font-normal text-ink-soft/70">(optional)</span>
          </Label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Help us improve Duevy…"
            rows={3}
            className={cn(
              "mt-1.5 w-full resize-none rounded-2xl border border-cloud bg-canvas px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-soft focus-visible:border-brand focus-visible:ring-[3px] focus-visible:ring-brand/15",
            )}
          />
        </div>

        {error && (
          <p className="rounded-2xl bg-rose-50 px-4 py-2.5 text-xs text-rose-600">{error}</p>
        )}
      </div>

      <Button
        variant="danger"
        size="pill-xl"
        disabled={!valid || submitting}
        onClick={submit}
        className="mt-6 w-full"
      >
        {submitting && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        )}
        {submitting ? "Deactivating…" : "Deactivate my account"}
      </Button>
    </Modal>
  );
}
