"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
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
import { KycMedia, ReasonForm, Spinner, formatMatchScore } from "../../_components/review";
import {
  applicationKycReady,
  type ApplicationKyc,
  type KycPolicy,
  type RepApplication,
  type StudentIdReviewRow,
} from "@/lib/api/admin";

type CheckState = "done" | "waiting" | "failed" | "todo";

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
  detail: ReactNode;
  children?: ReactNode;
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
          <div className="mt-0.5 text-xs text-ink-soft">{detail}</div>
        </div>
      </div>
      {children && <div className="mt-3 sm:pl-11">{children}</div>}
    </li>
  );
}

/** The NIN check (Didit → NIMC); only shown while the policy requires it. */
function ninCheck(kyc: ApplicationKyc | null): { state: CheckState; detail: ReactNode } {
  const identity = kyc?.identity;
  const s = identity?.status ?? "unverified";
  if (s === "verified") return { state: "done", detail: "NIMC confirmed the NIN and date of birth (checked through Didit)." };
  if (s === "rejected")
    return {
      state: "failed",
      detail:
        identity?.ninReviewNote ??
        identity?.rejectionReason ??
        "The NIN and date of birth didn't match the national register. The applicant can retry.",
    };
  if (s === "pending" && identity?.ninReviewStatus === "pending")
    return {
      state: "waiting",
      detail: (
        <>
          Only a partial match
          {identity.nameMatchScore !== null && identity.nameMatchScore !== undefined
            ? ` (name match ${formatMatchScore(identity.nameMatchScore)})`
            : ""}
          . An admin decides it in the{" "}
          <Link href="/admin/verification?tab=nin" className="font-semibold text-brand hover:underline">
            NIN queue
          </Link>
          .
        </>
      ),
    };
  if (s === "pending") return { state: "waiting", detail: "Submitted — waiting for the result." };
  return { state: "todo", detail: "The applicant hasn't submitted their NIN yet." };
}

/** The face capture; shown while the policy requires it (or one is on file). */
function livenessCheck(kyc: ApplicationKyc | null): { state: CheckState; detail: string } {
  const l = kyc?.liveness;
  const s = l?.status ?? null;
  if (s === "approved")
    return {
      state: "done",
      detail: l?.viewUrl ? "Approved." : l?.reviewNote ?? "Approved (verified before face capture existed).",
    };
  if (s === "pending")
    return { state: "waiting", detail: "Check it's a live person and the same face as on the student ID card." };
  if (s === "rejected") return { state: "failed", detail: `Retake requested: ${l?.reviewNote ?? "waiting for a new capture."}` };
  return { state: "todo", detail: "No face capture yet." };
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
 * Review one rep application: the requested space, then the checks the
 * verification policy requires (email; NIN only while required; student ID;
 * face capture while required), then final approval. Approving also approves
 * the student ID and creates the space. The face capture is decided on its
 * own (here or in the queue); the space can't collect until it's approved.
 */
export function ApplicationReviewModal({
  app,
  policy,
  loading,
  busy,
  onClose,
  onApprove,
  onReject,
  onRejectId,
  onReviewLiveness,
  onRefreshLinks,
}: {
  app: RepApplication | null;
  /** `null` while loading or unavailable — the NIN is then treated as required, as before. */
  policy: KycPolicy | null;
  loading: boolean;
  busy: boolean;
  onClose: () => void;
  onApprove: (app: RepApplication) => void;
  onReject: (app: RepApplication, reason: string) => void;
  /** Resolves `true` once the ID was sent back, so the note form can close. */
  onRejectId: (app: RepApplication, note: string) => Promise<boolean>;
  /** Resolves `true` once saved. */
  onReviewLiveness: (app: RepApplication, decision: "approved" | "rejected", note?: string) => Promise<boolean>;
  /** Re-fetches the application, for fresh signed links. */
  onRefreshLinks: () => void;
}) {
  const [mode, setMode] = useState<"review" | "reject-app" | "reject-id" | "reject-liveness">("review");
  // Which button started the running request, so only that one shows a spinner.
  const [action, setAction] = useState<
    "approve" | "reject" | "reject-id" | "approve-liveness" | "reject-liveness" | null
  >(null);
  const running = busy ? action : null;
  const pending = app?.status === "pending";
  const kyc = app?.kyc ?? null;
  const ready = applicationKycReady(kyc, policy);

  // Without a policy (older API, or it failed to load) assume the NIN is required.
  const ninRequired = policy ? policy.ninRequired : true;
  const livenessRequired = policy ? policy.livenessRequired : !!kyc?.liveness?.status;
  const showLiveness = livenessRequired || !!kyc?.liveness?.status;

  const email = app?.applicant?.emailVerified;
  const nin = ninCheck(kyc);
  const id = idCheck(kyc);
  const liveness = livenessCheck(kyc);
  const waitingOn = [
    !email && "email verification",
    ninRequired && nin.state !== "done" && "the NIN check",
    (id.state === "todo" || id.state === "failed") && "a student ID",
  ].filter(Boolean) as string[];
  const livenessOutstanding = livenessRequired && liveness.state !== "done";
  const name = app?.applicant?.name ?? "applicant";

  let step = 0;
  const nextStep = () => ++step;

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

          {/* The checks the policy requires, in the order they happen. */}
          <ol className="space-y-3">
            <Check
              step={nextStep()}
              title="Email verified"
              state={email ? "done" : "todo"}
              detail={email ? "The applicant confirmed their email address." : "Waiting for the applicant to open the verification link."}
            />
            {ninRequired && <Check step={nextStep()} title="NIN check (NIMC)" state={nin.state} detail={nin.detail} />}
            <Check step={nextStep()} title="Student ID card" state={id.state} detail={id.detail}>
              {kyc?.studentId.viewUrl && (
                <div className="space-y-3">
                  <KycMedia
                    url={kyc.studentId.viewUrl}
                    mimeType={kyc.studentId.mimeType}
                    label={`Student ID card for ${name}`}
                    onRefresh={onRefreshLinks}
                  />
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
            {showLiveness && (
              <Check
                step={nextStep()}
                title={livenessRequired ? "Face capture" : "Face capture (not required)"}
                state={liveness.state}
                detail={liveness.detail}
              >
                {kyc?.liveness?.viewUrl && (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <KycMedia
                        url={kyc.liveness.viewUrl}
                        mimeType={kyc.liveness.mimeType}
                        kind={kyc.liveness.kind}
                        label={`Face capture for ${name}`}
                        onRefresh={onRefreshLinks}
                      />
                      {kyc.studentId.viewUrl && (
                        <KycMedia
                          url={kyc.studentId.viewUrl}
                          mimeType={kyc.studentId.mimeType}
                          label={`Student ID card for ${name}, to compare`}
                          onRefresh={onRefreshLinks}
                        />
                      )}
                    </div>
                    {kyc.liveness.status === "pending" && mode === "review" && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="brand-outline"
                          size="pill"
                          disabled={busy}
                          aria-busy={running === "approve-liveness" || undefined}
                          onClick={() => {
                            setAction("approve-liveness");
                            void onReviewLiveness(app, "approved");
                          }}
                        >
                          {running === "approve-liveness" && <Spinner />}
                          {running === "approve-liveness" ? "Approving…" : "Approve face capture"}
                        </Button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setMode("reject-liveness")}
                          className="cursor-pointer text-xs font-semibold text-rose-600 hover:underline disabled:opacity-50"
                        >
                          Not a match? Ask for a retake
                        </button>
                      </div>
                    )}
                    {mode === "reject-liveness" && (
                      <ReasonForm
                        label="Why isn't it acceptable? They'll see this."
                        placeholder="e.g. Your face isn't clearly visible — retake it facing the camera in good light."
                        confirmLabel="Ask for a retake"
                        busyLabel="Sending…"
                        busy={busy}
                        loading={running === "reject-liveness"}
                        onCancel={() => setMode("review")}
                        onConfirm={async (note) => {
                          setAction("reject-liveness");
                          if (await onReviewLiveness(app, "rejected", note)) setMode("review");
                        }}
                      />
                    )}
                  </div>
                )}
              </Check>
            )}
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
                    {livenessOutstanding &&
                      " It can't collect payments until the face capture is approved too."}
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
          <KycMedia url={row.studentId.viewUrl} mimeType={row.studentId.mimeType} label={`Student ID card for ${row.name}`} />
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
