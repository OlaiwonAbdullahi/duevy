"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon, SignatureIcon, SquareLock02Icon } from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Modal } from "../../_components/Modal";
import { UserAvatar } from "../../_components/UserAvatar";
import { Skeleton } from "../../_components/Skeleton";
import { BRAND_INPUT } from "../../_components/form-styles";
import { SettingsCard } from "../../settings/_components/SettingsCard";
import { useRepSpace } from "../../_components/use-rep-space";
import { getPayoutSummary, setSignatories, setWithdrawalSecurity } from "@/lib/api/payouts";
import { queryKeys, useSpaceReps } from "@/lib/api/queries";
import { ApiError } from "@/lib/api/errors";
import type { WithdrawalAuthMode } from "@/lib/api/types";

const SAVE_ERRORS: Record<string, string> = {
  INVALID_PASSWORD: "Your password is incorrect.",
  PASSWORD_REQUIRED: "Your account has no password yet. Sign out, use “Forgot password” to create one, then try again.",
  SIGNATORIES_INCOMPLETE: "Approvals need two co-rep signatories. Pick two, or switch to the security code first.",
  USER_INACTIVE: "One of those co-reps' accounts is suspended.",
};

const MODES: { id: WithdrawalAuthMode; title: string; body: string }[] = [
  { id: "pin", title: "Security code", body: "You enter your 4-digit code for each withdrawal." },
  {
    id: "multisig",
    title: "Signatory approval",
    body: "2 of 3 signatories approve each withdrawal with a code Duevy emails them.",
  },
];

const summaryKey = (spaceId: string) => ["space", spaceId, "payout-summary"] as const;

/**
 * How the department's withdrawals are authorised: the lead's security code,
 * or 2 of 3 signatories (the lead + two nominated co-reps) with emailed codes.
 * The lead edits it with their password; co-reps can see it.
 */
export function WithdrawalApprovalsCard() {
  const repSpace = useRepSpace();
  const spaceId = repSpace?.id;
  const isLead = repSpace?.membership !== "co";
  const queryClient = useQueryClient();
  const { data: reps = [] } = useSpaceReps(spaceId);
  const { data: summary, isPending } = useQuery({
    queryKey: summaryKey(spaceId ?? ""),
    queryFn: () => getPayoutSummary(spaceId!),
    enabled: !!spaceId,
  });

  const savedMode = summary?.withdrawalAuthMode ?? "pin";
  const savedIds = (summary?.signatories ?? []).filter((s) => s.role === "co").map((s) => s.id);
  const coReps = reps.filter((r) => r.role === "co");

  const [mode, setMode] = useState<WithdrawalAuthMode>(savedMode);
  const [picked, setPicked] = useState<string[]>(savedIds);
  const [confirming, setConfirming] = useState(false);
  // Re-seed the form whenever the saved settings change (during render, not in an effect).
  const savedKey = `${savedMode}:${savedIds.join(",")}`;
  const [seededKey, setSeededKey] = useState(savedKey);
  if (seededKey !== savedKey) {
    setSeededKey(savedKey);
    setMode(savedMode);
    setPicked(savedIds);
  }

  const signatoriesChanged = picked.length !== savedIds.length || picked.some((id) => !savedIds.includes(id));
  const modeChanged = mode !== savedMode;
  const dirty = signatoriesChanged || modeChanged;
  const invalid = mode === "multisig" && picked.length !== 2;

  const toggle = (id: string) =>
    setPicked((list) => (list.includes(id) ? list.filter((x) => x !== id) : list.length < 2 ? [...list, id] : list));

  // Changes that pause withdrawals for 24 hours, said up front.
  const holdWarning =
    savedMode === "multisig" && mode === "pin"
      ? "Switching back to the security code pauses withdrawals for 24 hours."
      : savedMode === "multisig" && signatoriesChanged
        ? "Changing signatories while approvals are on pauses withdrawals for 24 hours."
        : null;

  const save = async (password: string) => {
    if (!spaceId) return;
    try {
      // Order matters: approvals can't go on without two signatories, and a
      // signatory can't be dropped while they're on.
      const turningOff = modeChanged && mode === "pin";
      if (turningOff) await setWithdrawalSecurity(spaceId, { mode, password });
      if (signatoriesChanged) await setSignatories(spaceId, { userIds: picked, password });
      if (modeChanged && !turningOff) await setWithdrawalSecurity(spaceId, { mode, password });
      setConfirming(false);
      toast.success("Withdrawal security updated", {
        description: holdWarning ?? "Every rep has been notified.",
      });
    } catch (err) {
      toast.error("Couldn't save", {
        description: (err instanceof ApiError && SAVE_ERRORS[err.code]) || "Something went wrong. Please try again.",
      });
    } finally {
      void queryClient.invalidateQueries({ queryKey: summaryKey(spaceId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.spaceReps(spaceId) });
    }
  };

  return (
    <SettingsCard
      icon={SignatureIcon}
      title="Withdrawal approvals"
      description="Choose how withdrawals from this department are authorised."
    >
      {isPending || !summary ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-16 rounded-2xl" />
        </div>
      ) : (
        <>
          <div role="radiogroup" aria-label="How withdrawals are authorised" className="grid gap-2 sm:grid-cols-2">
            {MODES.map((m) => {
              const active = m.id === mode;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={!isLead}
                  onClick={() => setMode(m.id)}
                  className={cn(
                    "rounded-2xl border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-default",
                    active ? "border-brand bg-cloud/40" : "border-cloud bg-paper enabled:hover:bg-cloud/30 enabled:cursor-pointer",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-ink">{m.title}</span>
                    {m.id === savedMode && (
                      <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-white">Current</span>
                    )}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-ink-soft">{m.body}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-5">
            <p className="text-xs font-medium text-ink-soft">Signatories</p>
            <p className="mt-0.5 text-xs text-ink-soft">
              {isLead ? "You're always one. Choose two co-reps to sign with you." : "The lead rep plus two co-reps they nominate."}
            </p>
            <ul className="mt-2 flex flex-col gap-2">
              {reps
                .filter((r) => r.role === "lead")
                .map((r) => (
                  <li key={r.id} className="flex items-center gap-3 rounded-2xl border border-cloud bg-paper p-3">
                    <UserAvatar name={r.name} size={32} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{r.name}</span>
                    <span className="rounded-full bg-brand px-2.5 py-1 text-[11px] font-semibold text-white">Lead rep</span>
                  </li>
                ))}
              {coReps.length === 0 ? (
                <li className="rounded-2xl border border-dashed border-cloud p-3 text-xs text-ink-soft">
                  Add co-reps in &ldquo;Reps &amp; roles&rdquo; to nominate them as signatories.
                </li>
              ) : (
                coReps.map((r) => {
                  const on = picked.includes(r.id);
                  const full = !on && picked.length >= 2;
                  return (
                    <li key={r.id}>
                      <label
                        className={cn(
                          "flex items-center gap-3 rounded-2xl border p-3 transition-colors",
                          on ? "border-brand bg-cloud/40" : "border-cloud bg-canvas",
                          isLead && !full ? "cursor-pointer hover:bg-cloud/30" : "cursor-default",
                          full && "opacity-60",
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          disabled={!isLead || full}
                          onChange={() => toggle(r.id)}
                          className="h-4 w-4 accent-[var(--color-brand)]"
                        />
                        <UserAvatar name={r.name} size={32} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">{r.name}</span>
                          {r.kycVerified === false && (
                            <span className="block truncate text-[11px] text-ink-soft">Not verified yet</span>
                          )}
                        </span>
                      </label>
                    </li>
                  );
                })
              )}
            </ul>
          </div>

          {isLead && dirty && (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className={cn("flex items-start gap-1.5 text-xs", invalid || holdWarning ? "text-amber-700" : "text-ink-soft")}>
                {(invalid || holdWarning) && <HugeiconsIcon icon={Alert01Icon} size={14} className="mt-px shrink-0" />}
                {invalid ? "Signatory approval needs exactly two co-reps." : holdWarning ?? "Every rep will be notified."}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode(savedMode);
                    setPicked(savedIds);
                  }}
                  className="h-10 rounded-full border border-cloud bg-canvas px-4 text-sm font-semibold text-ink transition-colors hover:bg-paper cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="button"
                  disabled={invalid}
                  onClick={() => setConfirming(true)}
                  className="h-10 rounded-full bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-bright disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                  Save changes
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {confirming && <PasswordModal warning={holdWarning} onClose={() => setConfirming(false)} onSubmit={save} />}
    </SettingsCard>
  );
}

function PasswordModal({
  warning,
  onClose,
  onSubmit,
}: {
  warning: string | null;
  onClose: () => void;
  onSubmit: (password: string) => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <Modal title="Confirm with your password" icon={SquareLock02Icon} onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!password) return;
          setSubmitting(true);
          await onSubmit(password);
          setSubmitting(false);
        }}
      >
        <p className="text-[13px] leading-5 text-ink-soft">
          Withdrawal security changes need your account password. Every rep is notified.
        </p>
        {warning && (
          <p className="mt-3 flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
            <HugeiconsIcon icon={Alert01Icon} size={14} className="mt-px shrink-0" />
            {warning}
          </p>
        )}
        <Input
          type="password"
          autoComplete="current-password"
          autoFocus
          aria-label="Account password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={cn(BRAND_INPUT, "mt-4")}
        />
        <button
          type="submit"
          disabled={!password || submitting}
          className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white transition-colors duration-300 hover:bg-brand-bright disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          {submitting && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {submitting ? "Saving…" : "Save changes"}
        </button>
      </form>
    </Modal>
  );
}
