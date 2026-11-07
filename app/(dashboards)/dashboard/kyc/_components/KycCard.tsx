"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ShieldIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Alert01Icon,
  IdIcon,
  FaceIdIcon,
  Upload01Icon,
  CloudUploadIcon,
  Pdf01Icon,
  Cancel01Icon,
  Camera01Icon,
  LockIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BRAND_INPUT } from "../../_components/form-styles";
import { DateOfBirthPicker } from "../../_components/DateOfBirthPicker";
import { Skeleton } from "../../_components/Skeleton";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/errors";
import {
  submitKyc,
  resubmitStudentId,
  submitLiveness,
  MAX_KYC_DOCUMENT_BYTES,
  STUDENT_ID_MIME_TYPES,
} from "@/lib/api/payouts";
import { kycRequirements, type KycState } from "@/lib/api/types";
import { useApplyKycState, useKycStatus } from "@/lib/api/queries";
import {
  joinNouns,
  kycChecks,
  kycLockedUntil,
  ninCheckState,
  type KycCheck,
  type KycCheckKey,
  type KycCheckState,
} from "@/lib/kyc";

// Camera code stays out of the main bundle until a capture is actually started.
const FaceCapture = dynamic(() => import("./FaceCapture").then((m) => m.FaceCapture), {
  ssr: false,
  loading: () => <Skeleton className="h-48 w-full rounded-2xl" />,
});

const ACCEPTED_DOCUMENTS = STUDENT_ID_MIME_TYPES.join(",");

const TILE_TONE: Record<KycCheckState, string> = {
  todo: "bg-cloud text-ink-soft",
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-brand/10 text-brand",
  rejected: "bg-rose-100 text-rose-600",
};

const TILE_BADGE: Record<KycCheckState, string> = {
  todo: "Not started",
  pending: "In review",
  approved: "Approved",
  rejected: "Needs attention",
};

const TILE_ICON: Record<KycCheckKey, typeof IdIcon> = {
  studentId: IdIcon,
  liveness: FaceIdIcon,
  nin: ShieldIcon,
};

/** Codes meaning our copy of the state is stale: something was already sent or decided. */
const STALE_CODES = new Set([
  "ALREADY_VERIFIED",
  "KYC_PENDING",
  "LIVENESS_PENDING",
  "LIVENESS_APPROVED",
  "STUDENT_ID_PENDING",
  "STUDENT_ID_APPROVED",
]);

type FormStep = "studentId" | "face" | "nin";

type Problem = {
  title: string;
  body: string;
  /** The form step the rep should fix. */
  step?: FormStep;
  /** The server state changed (an attempt was spent, a lock set, or ours was stale). */
  refetch?: boolean;
  /** The fix is the name on the rep's profile. */
  profileLink?: boolean;
};

type Notice = { tone: "success" | "info"; title: string; body: string };

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Client-side mirror of the API's student ID rules — a convenience; the server checks the bytes. */
function checkDocument(file: File | null): string | null {
  if (!file) return null;
  if (file.type && !(STUDENT_ID_MIME_TYPES as readonly string[]).includes(file.type)) {
    return "Use a JPEG, PNG, WebP or PDF file.";
  }
  if (file.size > MAX_KYC_DOCUMENT_BYTES) return "The student ID must be 5 MB or smaller.";
  return null;
}

const FIELD_STEP: Record<string, FormStep> = {
  studentIdCard: "studentId",
  liveness: "face",
  nin: "nin",
  dob: "nin",
};

const FIELD_LABEL: Record<string, string> = {
  studentIdCard: "Student ID",
  liveness: "Face capture",
  nin: "NIN",
  dob: "Date of birth",
};

/**
 * What went wrong, in words the rep can act on. Never includes the NIN or date
 * of birth: only the server's per-field issue (which never echoes them).
 */
function problemFor(err: unknown): Problem {
  if (!(err instanceof ApiError)) {
    return {
      title: "We couldn't reach Duevy",
      body: "Check your connection and try again. Nothing was submitted.",
    };
  }
  switch (err.code) {
    case "KYC_REJECTED":
      return {
        title: "Your NIN didn't match",
        body: "Your NIN and date of birth didn't match the national register. Check both against your NIN slip and try again. After three mismatches, retries lock for 24 hours.",
        step: "nin",
        refetch: true,
      };
    case "KYC_INPUT_UNREADABLE":
      return {
        title: "We couldn't check these details",
        body: "The identity service couldn't read the details as sent. Make sure the name on your Duevy profile matches your NIN record, then try again. This didn't count as an attempt.",
        step: "nin",
        profileLink: true,
      };
    case "KYC_PROVIDER_UNAVAILABLE":
      return {
        title: "The identity service is unavailable",
        body: "We couldn't reach the national register just now. Nothing was saved and it didn't count as an attempt. Please try again in a few minutes.",
      };
    case "KYC_RETRY_LOCKED": {
      const until = err.details?.[0]?.issue?.match(/\d{4}-\d{2}-\d{2}T[\d:.]+Z/)?.[0];
      return {
        title: "Too many failed attempts",
        body: until
          ? `NIN checks are locked until ${formatTime(until)}. You can try again after that.`
          : "NIN checks are locked for 24 hours. You can try again after that.",
        refetch: true,
      };
    }
    case "FILE_TOO_LARGE":
      return {
        title: "A file is too large",
        body: "The student ID must be 5 MB or smaller, and the face capture 15 MB or smaller.",
      };
    case "VALIDATION_ERROR": {
      const detail = err.details?.[0];
      const label = detail ? FIELD_LABEL[detail.field] : undefined;
      return {
        title: "Something needs fixing",
        body: detail && label ? `${label}: ${detail.issue}.` : err.message || "Check your details and try again.",
        step: detail ? FIELD_STEP[detail.field] : undefined,
      };
    }
    case "REP_NOT_APPROVED":
      return {
        title: "You can't verify yet",
        body: "Only reps and rep applicants can verify. If you've just applied, refresh the page.",
      };
    default:
      if (STALE_CODES.has(err.code)) {
        return {
          title: "Already received",
          body: "We already have this. We've refreshed your verification status.",
          refetch: true,
        };
      }
      if (err.status === 429) {
        return { title: "Slow down a moment", body: "Too many requests. Wait a minute, then try again." };
      }
      return { title: "Couldn't submit", body: err.message || "Please try again." };
  }
}

/** The card-level message after a submission, read out by screen readers. */
function noticeAfter(next: KycState, sentNin: boolean): Notice {
  if (next.canCollect) {
    return { tone: "success", title: "You're verified", body: "Every check has passed. Your department can collect dues." };
  }
  const waiting = kycChecks(next).filter((c) => c.state === "pending");
  if (sentNin && next.kycStatus === "verified") {
    return {
      tone: "success",
      title: "Your NIN matched",
      body: waiting.length
        ? `Next, a Duevy admin reviews ${joinNouns(waiting)}. We'll notify you when it's done.`
        : "We'll notify you as each remaining check completes.",
    };
  }
  if (sentNin && ninCheckState(next) === "pending") {
    return {
      tone: "info",
      title: "Your NIN needs a quick review",
      body: "Your details partly matched the national register, so a Duevy admin will review them. We'll notify you when they decide.",
    };
  }
  return {
    tone: "success",
    title: "Sent for review",
    body: waiting.length
      ? `A Duevy admin is reviewing ${joinNouns(waiting)}. We'll notify you when it's done.`
      : "We'll notify you as each check completes.",
  };
}

/**
 * Rep verification, driven by the admin's KYC policy (`requirements`): the
 * student ID card (always), a face capture taken in the app (on by default),
 * and NIN + date of birth checked against NIMC as they're submitted (only when
 * on). The first submission goes through one `POST …/kyc`; afterwards a
 * rejected student ID or face capture is replaced on its own endpoint. The rep
 * is verified once `canCollect` — every required check has passed.
 */
export function KycCard({
  spaceId,
  isLead,
  onChanged,
}: {
  spaceId?: string;
  isLead: boolean;
  onChanged?: () => void;
}) {
  // Shared with the dashboard gate and banner, so they all update together.
  const { data: status = null, isPending: loading, refetch } = useKycStatus(spaceId);
  const applyKycState = useApplyKycState();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [fixing, setFixing] = useState<KycCheckKey | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const apply = (next: KycState, sentNin = false) => {
    applyKycState(next, { spaceId, isLead });
    setNotice(noticeAfter(next, sentNin));
    onChanged?.();
  };

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["kyc-status"] });

  if (loading) {
    return (
      <section className="rounded-3xl border border-cloud bg-canvas p-5 sm:p-6" aria-busy>
        <Skeleton className="h-9 w-2/3 rounded-xl" />
        <Skeleton className="mt-5 h-16 rounded-2xl" />
        <Skeleton className="mt-2 h-16 rounded-2xl" />
        <Skeleton className="mt-2 h-16 rounded-2xl" />
      </section>
    );
  }
  if (!status) {
    return (
      <section className="rounded-3xl border border-cloud bg-canvas p-6 text-center">
        <p className="text-sm font-semibold text-ink">Couldn&apos;t load your verification status</p>
        <p className="mt-1 text-xs text-ink-soft">Check your connection and try again.</p>
        <Button variant="brand-outline" size="pill" className="mt-4" onClick={() => void refetch()}>
          <HugeiconsIcon icon={RefreshIcon} size={14} />
          Try again
        </Button>
      </section>
    );
  }

  // KYC lives on the user: every rep verifies themselves, whoever leads the space.
  const kyc = status.mine;
  const req = kycRequirements(kyc);
  const checks = kycChecks(kyc);
  const check = (key: KycCheckKey) => checks.find((c) => c.key === key);
  const studentId = check("studentId")!;
  const liveness = check("liveness");
  const nin = check("nin");
  const lockedUntil = kycLockedUntil(kyc);
  // A co-rep can be verified while the space still waits on its lead.
  const spaceWaitingOnLead = !isLead && !status.canCollect;

  const noticeRegion = (
    <div role="status" aria-live="polite">
      {notice && (
        <div
          className={cn(
            "mt-4 flex items-start gap-2.5 rounded-2xl px-4 py-3",
            notice.tone === "success" ? "bg-brand/5" : "bg-amber-50",
          )}
        >
          <HugeiconsIcon
            icon={notice.tone === "success" ? CheckmarkCircle02Icon : Clock01Icon}
            size={16}
            className={cn("mt-0.5 shrink-0", notice.tone === "success" ? "text-brand" : "text-amber-700")}
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-ink">{notice.title}</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-ink-soft">{notice.body}</p>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss"
            className="grid h-6 w-6 shrink-0 cursor-pointer place-items-center rounded-full text-ink-soft hover:bg-cloud hover:text-ink"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={12} />
          </button>
        </div>
      )}
    </div>
  );

  if (kyc.canCollect) {
    return (
      <section className="rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
          </span>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-ink">You&apos;re verified</h2>
            <p className="mt-0.5 text-xs text-ink-soft">
              {spaceWaitingOnLead
                ? "Your checks have passed. Your department can collect once its lead rep is verified too."
                : "Every check has passed. Your department can collect dues and withdraw."}
            </p>
          </div>
        </div>
        {noticeRegion}
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Completed checks">
          {checks.map((c) => (
            <li
              key={c.key}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand/5 px-3 py-1.5 text-[11px] font-medium text-brand"
            >
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={12} />
              {c.label}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  // The NIN needs (re)submitting. `POST …/kyc` always takes the student ID card
  // with it, so this goes through the full form.
  const ninNeedsAction = !!nin && (nin.state === "todo" || nin.state === "rejected");
  const livenessNeedsAction = !!liveness && (liveness.state === "todo" || liveness.state === "rejected");
  // The first submission (or a NIN retry) is one request. A partial match under
  // review (`409 KYC_PENDING`) or a retry lock would refuse it, so then the
  // student ID goes on its own endpoint instead.
  const fullForm =
    !lockedUntil && (ninNeedsAction || (studentId.state === "todo" && nin?.state !== "pending"));
  const nothingSent = checks.every((c) => c.state === "todo");
  const done = checks.filter((c) => c.state === "approved").length;

  const tileAction = (c: KycCheck): { label: string; icon: typeof IdIcon } | null => {
    if (fullForm || formOpen) return null;
    if (c.key === "studentId" && (c.state === "todo" || c.state === "rejected")) {
      return { label: c.state === "rejected" ? "Upload a new card" : "Upload card", icon: Upload01Icon };
    }
    if (c.key === "liveness" && (c.state === "todo" || c.state === "rejected")) {
      return { label: c.state === "rejected" ? "Retake" : "Take photo", icon: Camera01Icon };
    }
    return null;
  };

  const tileDetail = (c: KycCheck): string => {
    if (c.state === "approved") return c.key === "nin" ? "Matched the national register." : "Approved by a Duevy admin.";
    if (c.state === "pending") {
      if (c.key === "nin") return "Your details partly matched. A Duevy admin is reviewing them.";
      return `A Duevy admin is reviewing it${c.uploadedAt ? ` (sent ${formatTime(c.uploadedAt)})` : ""}.`;
    }
    if (c.state === "rejected") {
      if (c.key === "nin") {
        return lockedUntil
          ? `Too many failed attempts. You can try again after ${formatTime(lockedUntil)}.`
          : "It didn't match. Check your NIN and date of birth and try again.";
      }
      return c.key === "studentId"
        ? "It wasn't accepted. Upload a clearer photo or scan."
        : "It wasn't accepted. Take a new one in good light.";
    }
    if (c.key === "nin") return lockedUntil ? `Locked until ${formatTime(lockedUntil)}.` : "Checked instantly when you submit.";
    if (c.key === "liveness") return "A photo or short clip of your face, taken here.";
    return "A clear photo or scan showing your name, photo and matric number.";
  };

  return (
    <section className="rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cloud text-brand">
          <HugeiconsIcon icon={ShieldIcon} size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight text-ink">Verify to start collecting</h2>
          <p className="mt-0.5 text-xs text-ink-soft">
            {spaceWaitingOnLead
              ? "Verify yourself to act for your department. It collects once its lead rep is verified."
              : "Students can pay your dues once every check below has passed."}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-paper px-2.5 py-1 text-[11px] font-semibold tabular-nums text-ink-soft">
          {done}/{checks.length}
        </span>
      </div>

      {noticeRegion}

      {formOpen && fullForm ? (
        <KycForm
          spaceId={spaceId}
          needs={{ liveness: livenessNeedsAction, nin: ninNeedsAction }}
          studentIdNote={
            studentId.state === "pending" || studentId.state === "approved"
              ? "Your NIN check is sent together with your student ID card, so attach it again here."
              : studentId.state === "rejected"
                ? studentId.note ?? "Your last card wasn't accepted. Upload a clearer one."
                : null
          }
          livenessNote={liveness?.state === "rejected" ? liveness.note : null}
          onSubmitted={(next, sentNin) => {
            setFormOpen(false);
            apply(next, sentNin);
          }}
          onRefetch={refresh}
          onCancel={() => setFormOpen(false)}
        />
      ) : (
        <>
          <ul className="mt-4 flex flex-col gap-2">
            {checks.map((c) => {
              const action = tileAction(c);
              const open = fixing === c.key;
              return (
                <li key={c.key} className="rounded-2xl border border-cloud bg-paper/50 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <span className={cn("mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full", TILE_TONE[c.state])}>
                      <HugeiconsIcon icon={TILE_ICON[c.key]} size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <p className="text-xs font-semibold text-ink">{c.label}</p>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", TILE_TONE[c.state])}>
                          {TILE_BADGE[c.state]}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-ink-soft">{tileDetail(c)}</p>
                      {c.state === "rejected" && c.note && (
                        <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-[11px] leading-relaxed text-rose-700">
                          <span className="font-semibold">Reviewer&apos;s note: </span>
                          {c.note}
                        </p>
                      )}
                    </div>
                    {action && !open && (
                      <Button
                        variant="brand-outline"
                        size="pill"
                        className="shrink-0 max-[380px]:px-3"
                        onClick={() => setFixing(c.key)}
                        aria-label={`${action.label}: ${c.label}`}
                      >
                        <HugeiconsIcon icon={action.icon} size={14} />
                        <span className="max-[380px]:sr-only">{action.label}</span>
                      </Button>
                    )}
                  </div>
                  {open && c.key === "studentId" && (
                    <StudentIdFix
                      onCancel={() => setFixing(null)}
                      onUpload={async (file) => {
                        const next = await resubmitStudentId(spaceId, file);
                        setFixing(null);
                        toast.success("Student ID sent for review");
                        apply(next);
                      }}
                      onRefetch={refresh}
                    />
                  )}
                  {open && c.key === "liveness" && (
                    <LivenessFix
                      onCancel={() => setFixing(null)}
                      onUpload={async (file) => {
                        const next = await submitLiveness(spaceId, file);
                        setFixing(null);
                        toast.success("Face capture sent for review");
                        apply(next);
                      }}
                      onRefetch={refresh}
                    />
                  )}
                </li>
              );
            })}
          </ul>

          {fullForm && (
            <div className="mt-5 rounded-2xl border border-cloud bg-paper/50 p-4">
              <p className="text-xs font-semibold text-ink">
                {nin?.state === "rejected" ? "Try your NIN check again" : nothingSent ? "What you'll need" : "Finish verification"}
              </p>
              <ul className="mt-2 flex flex-col gap-1 text-[11px] leading-relaxed text-ink-soft">
                <li>• A clear photo or scan of your student ID card (JPEG, PNG, WebP or PDF, up to 5 MB)</li>
                {livenessNeedsAction && <li>• A camera, for a quick photo of your face</li>}
                {ninNeedsAction && <li>• Your 11-digit NIN and your date of birth</li>}
                <li>• About two minutes</li>
              </ul>
              <Button variant="brand" size="pill-lg" className="mt-4 w-full" onClick={() => {
                setNotice(null);
                setFixing(null);
                setFormOpen(true);
              }}>
                <HugeiconsIcon icon={ShieldIcon} size={15} />
                {nin?.state === "rejected" ? "Try again" : nothingSent ? "Start verification" : "Continue"}
              </Button>
            </div>
          )}

          {!fullForm && checks.every((c) => c.state === "approved" || c.state === "pending") && (
            <p className="mt-4 rounded-2xl bg-paper px-4 py-3 text-[11px] leading-relaxed text-ink-soft">
              Nothing more to do for now. We&apos;ll notify you as each review finishes.
            </p>
          )}

          {lockedUntil && (
            <p className="mt-4 flex items-start gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-[11px] leading-relaxed text-rose-700">
              <HugeiconsIcon icon={LockIcon} size={14} className="mt-0.5 shrink-0" />
              Too many failed NIN attempts. You can try again after {formatTime(lockedUntil)}.
            </p>
          )}
        </>
      )}

      {req.nin && !formOpen && (
        <p className="mt-4 text-[11px] leading-relaxed text-ink-soft">
          Your NIN and date of birth are checked against the national register and never stored. Your
          student ID{req.liveness ? " and face capture are" : " is"} kept privately for Duevy&apos;s review team.
        </p>
      )}
    </section>
  );
}

/** Drop zone for the student ID; once chosen, shows a preview card with the file's details. */
function FileField({
  label,
  hint,
  file,
  onChange,
  error,
  disabled,
}: {
  label: string;
  hint: React.ReactNode;
  file: File | null;
  onChange: (file: File | null) => void;
  error: string | null;
  disabled?: boolean;
}) {
  const inputId = useId();
  const errorId = useId();
  const [dragging, setDragging] = useState(false);
  const preview = useMemo(
    () => (file && file.type.startsWith("image/") ? URL.createObjectURL(file) : null),
    [file],
  );
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <div>
      <p className="text-xs font-medium text-ink">
        {label}
      </p>
      <div className="mt-0.5 text-[11px] leading-relaxed text-ink-soft">{hint}</div>

      {file ? (
        <div
          className={cn(
            "mt-2 flex items-center gap-3 rounded-2xl border bg-canvas p-3",
            error ? "border-rose-300" : "border-cloud",
          )}
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-cloud text-brand">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element -- local blob preview
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              <HugeiconsIcon icon={Pdf01Icon} size={20} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-ink">{file.name}</p>
            <p
              id={errorId}
              className={cn("mt-0.5 text-[11px]", error ? "font-medium text-rose-600" : "text-ink-soft")}
            >
              {error ?? `${formatBytes(file.size)} · Ready to upload`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            aria-label="Remove file"
            className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full text-ink-soft transition-colors hover:bg-cloud hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={14} />
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!disabled) onChange(e.dataTransfer.files?.[0] ?? null);
          }}
          className={cn(
            "mt-2 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-colors focus-within:border-brand focus-within:ring-[3px] focus-within:ring-brand/15",
            disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
            dragging ? "border-brand bg-brand/5" : "border-cloud bg-canvas hover:border-brand/40 hover:bg-brand/5",
          )}
        >
          <span className="grid h-11 w-11 place-items-center rounded-full bg-brand/10 text-brand">
            <HugeiconsIcon icon={CloudUploadIcon} size={20} />
          </span>
          <p className="mt-3 text-xs text-ink">
            <span className="font-semibold text-brand">Choose a file</span>
            <span className="max-sm:hidden"> or drag and drop</span>
          </p>
          <p className="mt-1 text-[11px] text-ink-soft">JPEG, PNG, WebP or PDF · up to 5 MB</p>
        </label>
      )}

      <input
        id={inputId}
        type="file"
        accept={ACCEPTED_DOCUMENTS}
        disabled={disabled}
        aria-label={label}
        aria-describedby={file ? errorId : undefined}
        onChange={(e) => {
          onChange(e.target.files?.[0] ?? null);
          // Clear so picking the same file again after removing it still fires.
          e.target.value = "";
        }}
        className="sr-only"
      />
    </div>
  );
}

function ProblemBox({ problem }: { problem: Problem }) {
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
      <HugeiconsIcon icon={Alert01Icon} size={16} className="mt-0.5 shrink-0 text-rose-600" />
      <div className="min-w-0">
        <p className="text-xs font-semibold text-rose-700">{problem.title}</p>
        <p className="mt-0.5 text-[11px] leading-relaxed text-rose-700/90">{problem.body}</p>
        {problem.profileLink && (
          <Link href="/dashboard/settings" className="mt-1 inline-block text-[11px] font-semibold text-rose-700 underline">
            Check the name on your profile
          </Link>
        )}
      </div>
    </div>
  );
}

/** Replaces a rejected (or missing) student ID card on its own endpoint. */
function StudentIdFix({
  onUpload,
  onCancel,
  onRefetch,
}: {
  onUpload: (file: File) => Promise<void>;
  onCancel: () => void;
  onRefetch: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const inFlight = useRef(false);
  const error = checkDocument(file);

  const upload = async () => {
    if (!file || error || inFlight.current) return;
    inFlight.current = true;
    setUploading(true);
    setProblem(null);
    try {
      await onUpload(file);
    } catch (err) {
      const p = problemFor(err);
      setProblem(p);
      if (p.refetch) onRefetch();
    } finally {
      inFlight.current = false;
      setUploading(false);
    }
  };

  return (
    <div className="mt-3 flex flex-col gap-3 border-t border-cloud pt-3" aria-busy={uploading}>
      <FileField
        label="New student ID card"
        hint="A clear photo or scan showing your name, photo and matric number."
        file={file}
        onChange={(f) => {
          setFile(f);
          setProblem(null);
        }}
        error={error}
        disabled={uploading}
      />
      {problem && <ProblemBox problem={problem} />}
      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Button variant="brand" size="pill-lg" className="flex-1" disabled={!file || !!error || uploading} onClick={upload}>
          {uploading ? (
            <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white motion-safe:animate-spin" />
          ) : (
            <HugeiconsIcon icon={Upload01Icon} size={15} />
          )}
          {uploading ? "Uploading…" : "Send for review"}
        </Button>
        <Button variant="brand-outline" size="pill-lg" disabled={uploading} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

/** A new face capture (first, or a retake after a rejection) on its own endpoint. */
function LivenessFix({
  onUpload,
  onCancel,
  onRefetch,
}: {
  onUpload: (file: File) => Promise<void>;
  onCancel: () => void;
  onRefetch: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const inFlight = useRef(false);

  const upload = async (file: File) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setUploading(true);
    setProblem(null);
    try {
      await onUpload(file);
    } catch (err) {
      const p = problemFor(err);
      setProblem(p);
      if (p.refetch) onRefetch();
    } finally {
      inFlight.current = false;
      setUploading(false);
    }
  };

  return (
    <div className="mt-3 flex flex-col gap-3 border-t border-cloud pt-3">
      <FaceCapture onConfirm={upload} confirmLabel="Send for review" busy={uploading} />
      {problem && <ProblemBox problem={problem} />}
      {!uploading && (
        <Button variant="brand-ghost" size="pill" onClick={onCancel}>
          Not now
        </Button>
      )}
    </div>
  );
}

const STEP_META: Record<FormStep, { title: string; icon: typeof IdIcon }> = {
  studentId: { title: "Student ID card", icon: IdIcon },
  face: { title: "Face capture", icon: FaceIdIcon },
  nin: { title: "NIN and date of birth", icon: ShieldIcon },
};

function ageOn(dob: string) {
  const d = new Date(`${dob}T00:00:00`);
  return (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
}

/**
 * The first submission (or a NIN retry), one step per check the policy asks
 * for. Everything goes in one `POST …/kyc`, so the NIN result is known as it
 * returns. The NIN and date of birth live only in this component's state.
 */
function KycForm({
  spaceId,
  needs,
  studentIdNote,
  livenessNote,
  onSubmitted,
  onRefetch,
  onCancel,
}: {
  spaceId?: string;
  needs: { liveness: boolean; nin: boolean };
  studentIdNote: string | null;
  livenessNote: string | null;
  onSubmitted: (state: KycState, sentNin: boolean) => void;
  onRefetch: () => void;
  onCancel: () => void;
}) {
  const steps = useMemo<FormStep[]>(
    () => ["studentId", ...(needs.liveness ? (["face"] as const) : []), ...(needs.nin ? (["nin"] as const) : [])],
    [needs.liveness, needs.nin],
  );
  const [index, setIndex] = useState(0);
  const [studentIdCard, setStudentIdCard] = useState<File | null>(null);
  const [face, setFace] = useState<File | null>(null);
  const [nin, setNin] = useState("");
  const [dob, setDob] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const ninId = useId();
  const dobId = useId();
  const consentId = useId();

  const step = steps[index];
  const last = index === steps.length - 1;
  const fileError = checkDocument(studentIdCard);

  // Revoke the face preview's object URL when it's replaced or the form closes.
  const facePreview = useMemo(() => (face ? URL.createObjectURL(face) : null), [face]);
  useEffect(() => {
    return () => {
      if (facePreview) URL.revokeObjectURL(facePreview);
    };
  }, [facePreview]);

  // Each step change moves focus to its heading, so the change is announced.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [index]);

  const goTo = (target: FormStep) => {
    const i = steps.indexOf(target);
    if (i >= 0) setIndex(i);
  };

  const validate = (s: FormStep): string | null => {
    if (s === "studentId") {
      if (!studentIdCard) return "Add a photo or scan of your student ID card.";
      return fileError;
    }
    if (s === "face") return face ? null : "Take a photo of your face to continue.";
    if (!/^\d{11}$/.test(nin)) return "Enter your 11-digit NIN.";
    if (!dob) return "Pick your date of birth.";
    const age = ageOn(dob);
    if (age < 15 || age > 100) return "Check your date of birth.";
    return null;
  };

  const next = () => {
    const err = validate(step);
    setStepError(err);
    if (!err) setIndex((i) => Math.min(i + 1, steps.length - 1));
  };

  const back = () => {
    setStepError(null);
    if (index === 0) onCancel();
    else setIndex((i) => i - 1);
  };

  const submit = async () => {
    if (inFlight.current) return;
    for (const s of steps) {
      const err = validate(s);
      if (err) {
        goTo(s);
        setStepError(err);
        return;
      }
    }
    if (!consent) {
      setStepError("Tick the box to confirm and consent.");
      return;
    }
    if (!studentIdCard) return;
    inFlight.current = true;
    setSubmitting(true);
    setProblem(null);
    setStepError(null);
    try {
      const result = await submitKyc(spaceId, {
        studentIdCard,
        ...(needs.liveness && face ? { liveness: face } : {}),
        ...(needs.nin ? { nin, dob } : {}),
      });
      onSubmitted(result, needs.nin);
    } catch (err) {
      const p = problemFor(err);
      setProblem(p);
      if (p.step) goTo(p.step);
      if (p.refetch) onRefetch();
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  if (submitting) {
    return (
      <div
        className="mt-5 flex flex-col items-center gap-3 rounded-2xl border border-cloud bg-paper/50 px-4 py-8 text-center"
        role="status"
        aria-live="polite"
        aria-busy
      >
        <span className="h-9 w-9 rounded-full border-[3px] border-brand/20 border-t-brand motion-safe:animate-spin" />
        <p className="text-sm font-semibold text-ink">
          {needs.nin ? "Checking your details…" : "Sending for review…"}
        </p>
        <p className="max-w-xs text-[11px] leading-relaxed text-ink-soft">
          {needs.nin
            ? "We're uploading your documents securely and checking your NIN with the national register. This can take up to a minute. Please keep this page open."
            : "We're uploading your documents securely. Please keep this page open."}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-cloud bg-paper/50 p-4">
      {/* Progress */}
      <div>
        <div className="flex items-center justify-between text-[11px] font-semibold text-ink-soft">
          <span>
            Step {index + 1} of {steps.length}
          </span>
          <span className="text-ink">{STEP_META[step].title}</span>
        </div>
        <ol className="mt-2 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
          {steps.map((s, i) => (
            <li
              key={s}
              aria-label={`${STEP_META[s].title}${i < index ? ", done" : i === index ? ", current" : ""}`}
              className={cn(
                "h-1.5 rounded-full transition-colors motion-reduce:transition-none",
                i <= index ? "bg-brand" : "bg-cloud",
              )}
            />
          ))}
        </ol>
      </div>

      {problem && <ProblemBox problem={problem} />}

      <h3 ref={headingRef} tabIndex={-1} className="flex items-center gap-2 text-sm font-semibold text-ink outline-none">
        <HugeiconsIcon icon={STEP_META[step].icon} size={16} className="text-brand" />
        {STEP_META[step].title}
      </h3>

      {step === "studentId" && (
        <FileField
          label="Upload your student ID card"
          hint={
            <>
              A clear photo or scan showing your name, photo and matric number.
              {studentIdNote && <span className="mt-1 block font-medium text-ink">{studentIdNote}</span>}
            </>
          }
          file={studentIdCard}
          onChange={(f) => {
            setStudentIdCard(f);
            setStepError(null);
          }}
          error={fileError}
        />
      )}

      {step === "face" && (
        <div className="flex flex-col gap-3">
          <p className="text-[11px] leading-relaxed text-ink-soft">
            A Duevy admin compares this with your student ID card. It&apos;s stored privately and used only to verify you.
          </p>
          {livenessNote && (
            <p className="rounded-xl bg-rose-50 px-3 py-2 text-[11px] leading-relaxed text-rose-700">
              <span className="font-semibold">Reviewer&apos;s note: </span>
              {livenessNote}
            </p>
          )}
          {face && facePreview ? (
            <div className="flex items-center gap-3 rounded-2xl border border-cloud bg-canvas p-3">
              <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-cloud">
                {face.type.startsWith("video/") ? (
                  <video src={facePreview} muted playsInline className="h-full w-full object-cover" aria-label="Your clip" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- local blob preview
                  <img src={facePreview} alt="Your face capture" className="h-full w-full object-cover" />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-ink">
                  {face.type.startsWith("video/") ? "Clip ready" : "Photo ready"}
                </p>
                <p className="mt-0.5 text-[11px] text-ink-soft">{formatBytes(face.size)}</p>
              </div>
              <Button variant="brand-outline" size="pill" onClick={() => setFace(null)}>
                <HugeiconsIcon icon={RefreshIcon} size={14} />
                Retake
              </Button>
            </div>
          ) : (
            <FaceCapture
              onConfirm={(file) => {
                setFace(file);
                setStepError(null);
              }}
            />
          )}
        </div>
      )}

      {step === "nin" && (
        <div className="flex flex-col gap-4">
          <p className="text-[11px] leading-relaxed text-ink-soft">
            We check these against the national register (NIMC) as you submit, under the name on your Duevy account.
            They&apos;re never stored.
          </p>
          <div>
            <label htmlFor={ninId} className="text-xs font-medium text-ink">
              NIN
            </label>
            <Input
              id={ninId}
              value={nin}
              onChange={(e) => {
                setNin(e.target.value.replace(/[^0-9]/g, "").slice(0, 11));
                setStepError(null);
              }}
              placeholder="11-digit National Identification Number"
              inputMode="numeric"
              autoComplete="off"
              spellCheck={false}
              maxLength={11}
              className={cn(BRAND_INPUT, "mt-1.5 tabular-nums tracking-wider")}
            />
            <p className="mt-1 text-[11px] text-ink-soft">
              It&apos;s on your NIN slip or in the NIMC app.{" "}
              <span className="tabular-nums">{nin.length}/11</span>
            </p>
          </div>
          <div>
            <p id={dobId} className="text-xs font-medium text-ink">
              Date of birth
            </p>
            <div role="group" aria-labelledby={dobId}>
              <DateOfBirthPicker
                value={dob}
                onChange={(v) => {
                  setDob(v);
                  setStepError(null);
                }}
                className="mt-1.5"
              />
            </div>
          </div>
        </div>
      )}

      {last && (
        <div className="flex items-start gap-2">
          <input
            id={consentId}
            type="checkbox"
            checked={consent}
            onChange={(e) => {
              setConsent(e.target.checked);
              setStepError(null);
            }}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-cloud accent-brand"
          />
          <label htmlFor={consentId} className="cursor-pointer text-[11px] leading-relaxed text-ink-soft">
            {needs.nin
              ? "I confirm this is my own student ID, face and NIN, and consent to Duevy checking my NIN and date of birth against the national identity register. Duevy doesn't store my NIN or date of birth."
              : "I confirm this is my own student ID and face, and consent to Duevy's review team using them to verify me."}{" "}
            My student ID{needs.liveness ? " and face capture are" : " is"} kept privately for review.
          </label>
        </div>
      )}

      {stepError && (
        <p role="alert" className="text-[11px] font-medium text-rose-600">
          {stepError}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        {last ? (
          <Button variant="brand" size="pill-lg" className="flex-1" onClick={submit}>
            <HugeiconsIcon icon={ShieldIcon} size={15} />
            {needs.nin ? "Verify and submit" : "Submit for review"}
          </Button>
        ) : (
          <Button variant="brand" size="pill-lg" className="flex-1" onClick={next}>
            Continue
            <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
          </Button>
        )}
        <Button variant="brand-outline" size="pill-lg" onClick={back}>
          {index === 0 ? (
            "Cancel"
          ) : (
            <>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={15} />
              Back
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
