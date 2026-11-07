"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { FaceIdIcon, IdIcon, Shield01Icon, UserSearch01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "../../../dashboard/_components/EmptyState";
import TableCard from "../../_components/TableCard";
import StatusBadge from "../../_components/StatusBadge";
import { Switch } from "../../_components/Switch";
import { ConfirmDialog } from "../../_components/ConfirmDialog";
import { kycPolicyQueryKey, useKycPolicy } from "../../_components/kycPolicy";
import { PERMISSION_LABELS, isForbidden, useAdminPermissions } from "../../_components/permissions";
import { updateKycPolicy, type KycPolicy } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/errors";

type Toggle = "ninRequired" | "livenessRequired";

const CHECKS: Record<
  Toggle,
  { title: string; short: string; description: string; icon: typeof IdIcon; queueTab: string }
> = {
  livenessRequired: {
    title: "Face capture (liveness)",
    short: "face capture",
    description:
      "A photo or short video of the rep's face, taken in the app. A Duevy admin approves it next to their student ID card. No third party is involved.",
    icon: FaceIdIcon,
    queueTab: "liveness",
  },
  ninRequired: {
    title: "NIN check (Didit / NIMC)",
    short: "NIN check",
    description:
      "NIN and date of birth checked against NIMC through Didit when the rep submits. Partial matches come to an admin. While off, nothing is sent to Didit or stored.",
    icon: UserSearch01Icon,
    queueTab: "nin",
  },
};

function spacesLine(n: number) {
  return n === 0
    ? "Every space's lead rep meets this policy."
    : `${n} space${n === 1 ? "" : "s"} can't collect because the lead rep hasn't passed every required check.`;
}

/**
 * Which checks a rep must pass before their space can collect
 * (`GET|PUT /admin/settings/kyc`). Reading needs User management; changing
 * needs System overrides. A change applies to every rep within seconds.
 */
export function KycPolicyCard() {
  const queryClient = useQueryClient();
  const policyQuery = useKycPolicy();
  const policy = policyQuery.data;
  const { can } = useAdminPermissions();
  const [forbidden, setForbidden] = useState(false);
  const allowed = can("overrides") !== false && !forbidden;
  const [confirm, setConfirm] = useState<{ key: Toggle; next: boolean } | null>(null);
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);
  const noteId = useId();

  async function save() {
    if (!confirm || inFlight.current) return;
    inFlight.current = true;
    setSaving(true);
    const { key, next } = confirm;
    try {
      const updated = await updateKycPolicy({ [key]: next });
      queryClient.setQueryData<KycPolicy>(kycPolicyQueryKey, updated);
      // Queues and application reviews read the policy too.
      void queryClient.invalidateQueries({ queryKey: ["admin", "rep-application"] });
      const n = updated.leadRepsNotMeetingPolicy;
      toast.success(`${CHECKS[key].title} is now ${next ? "required" : "off"}.`, {
        description: spacesLine(n),
      });
      setConfirm(null);
    } catch (err) {
      if (isForbidden(err)) {
        setForbidden(true);
        setConfirm(null);
        toast.error(`Changing the verification policy needs the ${PERMISSION_LABELS.overrides} permission.`);
      } else {
        toast.error(err instanceof ApiError ? err.message : "Couldn't update the verification policy.");
      }
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }

  return (
    <TableCard
      title="Rep verification policy"
      subtitle="Which checks a rep must pass before their space can collect. Changes apply to every rep within seconds and are audit-logged."
    >
      {policyQuery.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-paper" />
          ))}
        </div>
      ) : !policy ? (
        <EmptyState
          icon={Shield01Icon}
          title={isForbidden(policyQuery.error) ? "You can't view this policy" : "Verification policy unavailable"}
          description={
            isForbidden(policyQuery.error)
              ? `Viewing it needs the ${PERMISSION_LABELS.userManagement} permission.`
              : "Check your connection, then try again."
          }
          action={
            isForbidden(policyQuery.error) ? undefined : (
              <Button variant="brand-outline" size="pill" onClick={() => void policyQuery.refetch()}>
                Try again
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          <ul className="divide-y divide-cloud/70 overflow-hidden rounded-2xl border border-cloud bg-canvas">
            <li className="flex items-start gap-3 p-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper text-ink-soft">
                <HugeiconsIcon icon={IdIcon} size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-ink">Student ID card</p>
                  <StatusBadge tone="ok">Always on</StatusBadge>
                </div>
                <p className="mt-0.5 text-xs text-ink-soft">
                  The rep&apos;s student ID card, approved by a Duevy admin. Every rep needs it; it can&apos;t be
                  turned off.
                </p>
              </div>
              <Switch checked disabled label="Student ID card (always required)" onChange={() => {}} />
            </li>
            {(["livenessRequired", "ninRequired"] as const).map((key) => {
              const check = CHECKS[key];
              const on = policy[key];
              return (
                <li key={key} className="flex items-start gap-3 p-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper text-ink-soft">
                    <HugeiconsIcon icon={check.icon} size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-ink">{check.title}</p>
                      <StatusBadge tone={on ? "ok" : "neutral"}>{on ? "Required" : "Off"}</StatusBadge>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-soft">{check.description}</p>
                    <Link
                      href={`/admin/verification?tab=${check.queueTab}`}
                      className="mt-1 inline-block text-xs font-semibold text-brand hover:underline"
                    >
                      Open the {check.short} queue
                    </Link>
                  </div>
                  <Switch
                    checked={on}
                    disabled={!allowed || saving}
                    describedBy={allowed ? undefined : noteId}
                    label={`Require ${check.short}`}
                    onChange={(next) => setConfirm({ key, next })}
                  />
                </li>
              );
            })}
          </ul>

          <p
            role="status"
            className={
              policy.leadRepsNotMeetingPolicy > 0
                ? "rounded-2xl bg-amber-500/10 px-4 py-3 text-xs text-amber-800 dark:text-amber-300"
                : "rounded-2xl bg-emerald-500/10 px-4 py-3 text-xs text-emerald-800 dark:text-emerald-300"
            }
          >
            {spacesLine(policy.leadRepsNotMeetingPolicy)}
          </p>

          {!allowed && (
            <p id={noteId} className="text-xs text-ink-soft">
              Changing this needs the {PERMISSION_LABELS.overrides} permission. Ask a super admin if it should
              change.
            </p>
          )}
        </div>
      )}

      {confirm && policy && (
        <ConfirmDialog
          icon={CHECKS[confirm.key].icon}
          title={confirm.next ? `Require ${CHECKS[confirm.key].short}?` : `Turn off ${CHECKS[confirm.key].short}?`}
          confirmLabel={confirm.next ? "Require it" : "Turn it off"}
          busyLabel="Saving…"
          tone={confirm.next ? "danger" : "brand"}
          busy={saving}
          onConfirm={() => void save()}
          onClose={() => setConfirm(null)}
        >
          {confirm.next ? (
            <>
              <p>
                Every rep will need to pass the {CHECKS[confirm.key].short}.{" "}
                <span className="font-semibold text-ink">
                  Spaces whose lead rep hasn&apos;t passed it stop collecting payments immediately
                </span>{" "}
                (within about 10 seconds), until the lead rep completes it and it&apos;s approved.
              </p>
              <p>Reps are asked for it the next time they open verification. This is recorded in the audit log.</p>
            </>
          ) : (
            <>
              <p>
                Reps will no longer need the {CHECKS[confirm.key].short}. Spaces blocked only by it can start
                collecting again, without that check.
              </p>
              <p>This is recorded in the audit log.</p>
            </>
          )}
          <p className="text-xs">
            Currently: {spacesLine(policy.leadRepsNotMeetingPolicy)} You&apos;ll see the new count once it&apos;s
            saved.
          </p>
        </ConfirmDialog>
      )}
    </TableCard>
  );
}
