"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  IdIcon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AdminModal, ModalField } from "../../_components/AdminModal";
import StatusBadge from "../../_components/StatusBadge";
import {
  applicationKycReady,
  type ApplicationKyc,
  type RepApplication,
  type StudentIdReviewRow,
} from "@/lib/api/admin";

type CheckState = "done" | "waiting" | "failed" | "todo";

/** Inline spinner for a button whose request is in flight. */
function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current/30 border-t-current", className)}
    />
  );
}

const CHECK_STYLE: Record<CheckState, { icon: typeof Clock01Icon; className: string }> = {
  done: { icon: CheckmarkCircle02Icon, className: "bg-emerald-500/10 text-emerald-700" },
  waiting: { icon: Clock01Icon, className: "bg-amber-500/10 text-amber-700" },
  failed: { icon: Alert01Icon, className: "bg-rose-500/10 text-rose-700" },
  todo: { icon: Clock01Icon, className: "bg-cloud text-ink-soft" },
};

function Check({
  step,
  title,
  state,
  detail,
  children,
}: {
  step: number;
  title: string;
  state: CheckState;
  detail: string;
  children?: React.ReactNode;
}) {
  const style = CHECK_STYLE[state];
  return (
    <li className="rounded-2xl border border-cloud bg-canvas p-4">
      <div className="flex items-start gap-3">
        <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full", style.className)}>
          <HugeiconsIcon icon={style.icon} size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">
            <span className="text-ink-soft">{step}.</span> {title}
          </p>
          <p className="mt-0.5 text-xs text-ink-soft">{detail}</p>
        </div>
      </div>
      {children && <div className="mt-3 sm:pl-11">{children}</div>}
    </li>
  );
}

/** A student ID image (or PDF) behind a signed, short-lived link. */
function StudentIdPreview({ url, mimeType, name }: { url: string; mimeType: string | null; name: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-cloud bg-white">
      {mimeType === "application/pdf" ? (
        <iframe src={url} title={`Student ID card for ${name}`} className="h-72 w-full" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- signed, short-lived private URL
        <img src={url} alt={`Student ID card for ${name}`} className="max-h-72 w-full object-contain" />
      )}
      <div className="border-t border-cloud px-3 py-2">
        <a href={url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-brand hover:underline">
          Open full size
        </a>
      </div>
    </div>
  );
}

/** Inline "write a reason, then confirm" form — replaces window.prompt. */
function ReasonForm({
  label,
  placeholder,
  confirmLabel,
  busyLabel,
  busy,
  loading = false,
  onCancel,
  onConfirm,
}: {
  label: string;
  placeholder: string;
  confirmLabel: string;
  /** Shown on the confirm button while this form's request runs, e.g. "Rejecting…". */
  busyLabel: string;
  /** Any request on the modal is running — locks the form. */
  busy: boolean;
  /** This form's own request is running — spinner on its confirm button. */
  loading?: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3">
      <label className="text-xs font-medium text-ink">{label}</label>
      <textarea
        autoFocus
        value={reason}
        onChange={(e) => setReason(e.target.value.slice(0, 500))}
        rows={3}
        disabled={busy}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-cloud bg-canvas px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-brand focus:ring-2 focus:ring-brand/15"
      />
      <div className="mt-2 flex justify-end gap-2">
        <Button variant="brand-outline" size="pill" disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="danger-outline"
          size="pill"
          disabled={busy || !reason.trim()}
          aria-busy={loading || undefined}
          onClick={() => onConfirm(reason.trim())}
        >
          {loading && <Spinner />}
          {loading ? busyLabel : confirmLabel}
        </Button>
      </div>
    </div>
  );
}

function ninCheck(kyc: ApplicationKyc | null): { state: CheckState; detail: string } {
  const s = kyc?.identity.status ?? "unverified";
  if (s === "verified") return { state: "done", detail: "Bachs confirmed the NIN and date of birth." };
  if (s === "rejected")
    return { state: "failed", detail: kyc?.identity.rejectionReason ?? "Bachs couldn't verify these details. The applicant can retry." };
  if (s === "pending")
    return {
      state: "waiting",
      detail:
        kyc && kyc.identity.requirementsDue.length > 0
          ? `Waiting on Bachs — it asked for: ${kyc.identity.requirementsDue.join(", ")}.`
          : "Submitted — waiting for Bachs's result. This updates automatically.",
    };
  return { state: "todo", detail: "The applicant hasn't submitted their NIN yet." };
}

function idCheck(kyc: ApplicationKyc | null): { state: CheckState; detail: string } {
  const s = kyc?.studentId.status ?? null;
  if (s === "approved") return { state: "done", detail: "Approved." };
  if (s === "pending") return { state: "waiting", detail: "Check the card matches the applicant's name and school." };
  if (s === "rejected")
    return { state: "failed", detail: `Sent back: ${kyc?.studentId.reviewNote ?? "waiting for a new upload."}` };
  return { state: "todo", detail: "No student ID uploaded yet." };
}

/**
 * Review one rep application: the requested department, then the three checks
 * (email, NIN via Bachs, student ID), then final approval. Approving also
 * approves the student ID and creates the department.
 */
export function ApplicationReviewModal({
  app,
  loading,
  busy,
  onClose,
  onApprove,
  onReject,
  onRejectId,
}: {
  app: RepApplication | null;
  loading: boolean;
  busy: boolean;
  onClose: () => void;
  onApprove: (app: RepApplication) => void;
  onReject: (app: RepApplication, reason: string) => void;
  /** Resolves `true` once the ID was sent back, so the note form can close. */
  onRejectId: (app: RepApplication, note: string) => Promise<boolean>;
}) {
  const [mode, setMode] = useState<"review" | "reject-app" | "reject-id">("review");
  // Which button started the running request, so only that one shows a spinner.
  const [action, setAction] = useState<"approve" | "reject" | "reject-id" | null>(null);
  const running = busy ? action : null;
  const pending = app?.status === "pending";
  const kyc = app?.kyc ?? null;
  const ready = applicationKycReady(kyc);

  const email = app?.applicant?.emailVerified;
  const nin = ninCheck(kyc);
  const id = idCheck(kyc);
  const waitingOn = [
    !email && "email verification",
    nin.state !== "done" && "NIN verification",
    (id.state === "todo" || id.state === "failed") && "a student ID",
  ].filter(Boolean) as string[];

  return (
    <AdminModal
      wide
      icon={UserAdd01Icon}
      title={app?.applicant?.name ?? "Application"}
      description={app?.applicant?.email}
      // Not while a decision is being saved — closing would hide its result.
      onClose={() => !busy && onClose()}
      footer={
        app && pending && mode === "review" ? (
          <>
            <Button variant="danger-outline" size="pill" disabled={busy} onClick={() => setMode("reject-app")}>
              Reject application
            </Button>
            <Button
              variant="brand"
              size="pill"
              disabled={busy || !ready}
              aria-busy={running === "approve" || undefined}
              onClick={() => {
                setAction("approve");
                onApprove(app);
              }}
            >
              {running === "approve" && <Spinner />}
              {running === "approve" ? "Approving…" : "Approve rep"}
            </Button>
          </>
        ) : undefined
      }
    >
      {loading || !app ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-paper" />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {/* What they're applying for. */}
          <div className="rounded-2xl bg-paper p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Wants to run</p>
            <p className="mt-1 text-base font-semibold text-ink">
              {app.requestedSpace.name} <span className="text-ink-soft">({app.requestedSpace.short})</span>
            </p>
            <p className="mt-0.5 text-xs capitalize text-ink-soft">
              {[app.requestedSpace.kind, app.requestedSpace.faculty, app.requestedSpace.school].filter(Boolean).join(" · ")}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <ModalField label="Matric number">{app.applicant?.matricNo ?? "—"}</ModalField>
              <ModalField label="Level">{app.applicant?.level ?? "—"}</ModalField>
              <ModalField label="Phone">{app.applicant?.phone || "—"}</ModalField>
              <ModalField label="Gender">
                <span className="capitalize">{app.applicant?.gender || "—"}</span>
              </ModalField>
              <ModalField label="Applied">{new Date(app.submittedAt).toLocaleDateString("en-NG")}</ModalField>
            </div>
          </div>

          {/* The checks, in the order they happen. */}
          <ol className="space-y-3">
            <Check
              step={1}
              title="Email verified"
              state={email ? "done" : "todo"}
              detail={email ? "The applicant confirmed their email address." : "Waiting for the applicant to open the verification link."}
            />
            <Check step={2} title="NIN verified by Bachs" state={nin.state} detail={nin.detail} />
            <Check step={3} title="Student ID card" state={id.state} detail={id.detail}>
              {kyc?.studentId.viewUrl && (
                <div className="space-y-3">
                  <StudentIdPreview url={kyc.studentId.viewUrl} mimeType={kyc.studentId.mimeType} name={app.applicant?.name ?? "applicant"} />
                  {pending && kyc.studentId.status === "pending" && mode === "review" && (
                    <button
                      type="button"
                      onClick={() => setMode("reject-id")}
                      className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                    >
                      ID doesn&apos;t look right? Ask for a new one
                    </button>
                  )}
                  {mode === "reject-id" && (
                    <ReasonForm
                      label="What should they fix? They'll see this."
                      placeholder="e.g. The photo is blurry — upload a clear photo showing your name and matric number."
                      confirmLabel="Send back"
                      busyLabel="Sending…"
                      busy={busy}
                      loading={running === "reject-id"}
                      onCancel={() => setMode("review")}
                      // Stays open until it's saved, so a failure keeps the note.
                      onConfirm={async (note) => {
                        setAction("reject-id");
                        if (await onRejectId(app, note)) setMode("review");
                      }}
                    />
                  )}
                </div>
              )}
            </Check>
          </ol>

          {pending &&
            (mode === "reject-app" ? (
              <ReasonForm
                label="Why are you rejecting this application? The applicant will be emailed."
                placeholder="e.g. We couldn't confirm you're a rep for this department."
                confirmLabel="Reject application"
                busyLabel="Rejecting…"
                busy={busy}
                loading={running === "reject"}
                onCancel={() => setMode("review")}
                onConfirm={(reason) => {
                  setAction("reject");
                  onReject(app, reason);
                }}
              />
            ) : ready ? (
              <p
                role="status"
                className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-3 text-xs text-emerald-800"
              >
                {running === "approve" ? (
                  <>
                    <Spinner />
                    <span>
                      Approving — creating <span className="font-semibold">{app.requestedSpace.name}</span>…
                    </span>
                  </>
                ) : (
                  <span>
                    Ready to approve. Approving also approves the student ID and creates{" "}
                    <span className="font-semibold">{app.requestedSpace.name}</span>.
                  </span>
                )}
              </p>
            ) : (
              <p className="rounded-2xl bg-amber-500/10 px-4 py-3 text-xs text-amber-800">
                Waiting on {waitingOn.join(", ") || "the checks above"} before you can approve.
              </p>
            ))}

          {!pending && (
            <div className="grid gap-3 sm:grid-cols-2">
              <ModalField label="Decision">
                <StatusBadge tone={app.status === "approved" ? "ok" : "bad"}>{app.status}</StatusBadge>
              </ModalField>
              <ModalField label="Note">{app.reviewNote ?? "—"}</ModalField>
            </div>
          )}
        </div>
      )}
    </AdminModal>
  );
}

/**
 * A student ID re-uploaded by a rep who's already approved (e.g. after it was
 * sent back). Applicants' IDs are reviewed inside their application instead.
 */
export function IdReuploadModal({
  row,
  busy,
  onClose,
  onDecide,
}: {
  row: StudentIdReviewRow;
  busy: boolean;
  onClose: () => void;
  onDecide: (decision: "approved" | "rejected", note?: string) => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [decision, setDecision] = useState<"approved" | "rejected" | null>(null);
  const running = busy ? decision : null;
  return (
    <AdminModal
      wide
      icon={IdIcon}
      title={row.name}
      description={`${row.email}${row.matricNo ? ` · ${row.matricNo}` : ""}`}
      onClose={() => !busy && onClose()}
      footer={
        rejecting ? undefined : (
          <>
            <Button variant="danger-outline" size="pill" disabled={busy} onClick={() => setRejecting(true)}>
              Send back
            </Button>
            <Button
              variant="brand"
              size="pill"
              disabled={busy}
              aria-busy={running === "approved" || undefined}
              onClick={() => {
                setDecision("approved");
                onDecide("approved");
              }}
            >
              {running === "approved" && <Spinner />}
              {running === "approved" ? "Approving…" : "Approve ID"}
            </Button>
          </>
        )
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-ink-soft">
          This rep uploaded a new student ID. Their department can collect again once it&apos;s approved.
        </p>
        {row.studentId.viewUrl ? (
          <StudentIdPreview url={row.studentId.viewUrl} mimeType={row.studentId.mimeType} name={row.name} />
        ) : (
          <p className="rounded-2xl bg-paper p-6 text-center text-sm text-ink-soft">No file on record.</p>
        )}
        {rejecting && (
          <ReasonForm
            label="What should they fix? They'll see this."
            placeholder="e.g. The photo is blurry — upload a clear photo showing your name and matric number."
            confirmLabel="Send back"
            busyLabel="Sending…"
            busy={busy}
            loading={running === "rejected"}
            onCancel={() => setRejecting(false)}
            onConfirm={(note) => {
              setDecision("rejected");
              onDecide("rejected", note);
            }}
          />
        )}
      </div>
    </AdminModal>
  );
}
