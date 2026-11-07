"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Camera01Icon,
  Video01Icon,
  RefreshIcon,
  Tick02Icon,
  Alert01Icon,
  Image01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LIVENESS_MIME_TYPES, MAX_LIVENESS_BYTES } from "@/lib/api/payouts";

/** How long a recorded clip runs. */
const CLIP_SECONDS = 3;
/** Longest edge of a captured still; plenty for a face next to an ID card. */
const MAX_STILL_EDGE = 1280;

type Phase =
  | { kind: "idle" }
  | { kind: "starting" }
  | { kind: "live" }
  | { kind: "recording"; secondsLeft: number }
  | { kind: "review"; file: File; url: string }
  | { kind: "error"; reason: CameraProblem };

type CameraProblem = "denied" | "no-camera" | "in-use" | "unsupported" | "failed";

const PROBLEM_COPY: Record<CameraProblem, { title: string; body: string }> = {
  denied: {
    title: "Camera access is blocked",
    body: "Allow camera access for Duevy in your browser's site settings, then try again, or take a selfie with your phone's camera instead.",
  },
  "no-camera": {
    title: "No camera found",
    body: "We couldn't find a front camera on this device. Take a selfie with your phone instead, or switch to a device with a camera.",
  },
  "in-use": {
    title: "Your camera is busy",
    body: "Another app or tab is using the camera. Close it and try again, or take a selfie instead.",
  },
  unsupported: {
    title: "This browser can't open the camera here",
    body: "Take a selfie with your device's camera instead, or open Duevy in an up-to-date browser.",
  },
  failed: {
    title: "The camera didn't start",
    body: "Try again, or take a selfie with your device's camera instead.",
  },
};

function problemFor(err: unknown): CameraProblem {
  const name = err instanceof DOMException || err instanceof Error ? err.name : "";
  if (name === "NotAllowedError" || name === "SecurityError" || name === "PermissionDeniedError") return "denied";
  if (name === "NotFoundError" || name === "OverconstrainedError" || name === "DevicesNotFoundError") return "no-camera";
  if (name === "NotReadableError" || name === "TrackStartError" || name === "AbortError") return "in-use";
  return "failed";
}

/** The first clip format this browser's MediaRecorder can produce that the API accepts. */
function pickClipType(): string | null {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") return null;
  const candidates = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? null;
}

const ALLOWED = new Set<string>(LIVENESS_MIME_TYPES);

/** Client-side mirror of the API's rule (the server checks the bytes). */
function checkCapture(file: File): string | null {
  if (file.size > MAX_LIVENESS_BYTES) return "That file is over 15 MB. Take a photo or a shorter clip.";
  if (file.type && !ALLOWED.has(file.type.split(";")[0])) {
    return "Use a JPEG, PNG or WebP photo, or an MP4, MOV or WebM video.";
  }
  return null;
}

/** Re-encode a photo the API won't take (e.g. an iPhone HEIC) as JPEG, if the browser can decode it. */
async function toJpeg(file: File): Promise<File | null> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_STILL_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    return blob ? new File([blob], "face.jpg", { type: "image/jpeg" }) : null;
  } catch {
    return null;
  }
}

/**
 * Takes the rep's face capture in the app: a live front-camera preview with an
 * oval guide, then a JPEG still (or a short clip) to review before using it.
 * Falls back to the device's own camera (`capture="user"`) when the browser
 * can't open one. Every MediaStream track is stopped as soon as it's no longer
 * needed — after a capture, on cancel and on unmount — and every object URL is
 * revoked.
 */
export function FaceCapture({
  onConfirm,
  onCancel,
  confirmLabel = "Use this",
  busy = false,
  allowVideo = true,
}: {
  /** Called with the reviewed capture. The capture stays on screen while `busy`. */
  onConfirm: (file: File) => void;
  onCancel?: () => void;
  confirmLabel?: string;
  /** The parent is sending the capture: every control is disabled. */
  busy?: boolean;
  allowVideo?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [fileError, setFileError] = useState<string | null>(null);
  const [clipType] = useState(() => (allowVideo ? pickClipType() : null));
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timersRef = useRef<number[]>([]);
  const urlRef = useRef<string | null>(null);
  const captureButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const fileInputId = useId();
  const statusId = useId();

  const clearTimers = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  };

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const revokeUrl = () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
  };

  // Unmount: nothing may keep the camera light on or leak a blob.
  useEffect(
    () => () => {
      clearTimers();
      const recorder = recorderRef.current;
      recorderRef.current = null;
      if (recorder && recorder.state !== "inactive") {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        recorder.stop();
      }
      stopStream();
      revokeUrl();
    },
    [stopStream],
  );

  // Move focus to the control that matters in each phase, for keyboard and screen-reader users.
  useEffect(() => {
    if (phase.kind === "live") captureButtonRef.current?.focus();
    if (phase.kind === "review") confirmButtonRef.current?.focus();
  }, [phase.kind]);

  const review = (file: File) => {
    const problem = checkCapture(file);
    if (problem) {
      setFileError(problem);
      return;
    }
    setFileError(null);
    revokeUrl();
    const url = URL.createObjectURL(file);
    urlRef.current = url;
    setPhase({ kind: "review", file, url });
  };

  const startCamera = async () => {
    setFileError(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setPhase({ kind: "error", reason: "unsupported" });
      return;
    }
    setPhase({ kind: "starting" });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stopStream();
        return;
      }
      video.srcObject = stream;
      await video.play().catch(() => {});
      setPhase({ kind: "live" });
    } catch (err) {
      stopStream();
      setPhase({ kind: "error", reason: problemFor(err) });
    }
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const scale = Math.min(1, MAX_STILL_EDGE / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        stopStream();
        if (!blob) {
          setPhase({ kind: "error", reason: "failed" });
          return;
        }
        review(new File([blob], "face.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.9,
    );
  };

  const recordClip = () => {
    const stream = streamRef.current;
    if (!stream || !clipType) return;
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType: clipType });
    } catch {
      setFileError("This browser couldn't record a clip. Take a photo instead.");
      return;
    }
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      recorderRef.current = null;
      clearTimers();
      stopStream();
      const type = (recorder.mimeType || clipType).split(";")[0];
      const blob = new Blob(chunks, { type });
      review(new File([blob], type === "video/mp4" ? "face.mp4" : "face.webm", { type }));
    };
    recorderRef.current = recorder;
    recorder.start();
    setPhase({ kind: "recording", secondsLeft: CLIP_SECONDS });
    for (let s = 1; s < CLIP_SECONDS; s++) {
      timersRef.current.push(
        window.setTimeout(() => setPhase({ kind: "recording", secondsLeft: CLIP_SECONDS - s }), s * 1000),
      );
    }
    timersRef.current.push(
      window.setTimeout(() => {
        if (recorder.state !== "inactive") recorder.stop();
      }, CLIP_SECONDS * 1000),
    );
  };

  const retake = () => {
    revokeUrl();
    void startCamera();
  };

  const cancel = () => {
    clearTimers();
    stopStream();
    revokeUrl();
    setPhase({ kind: "idle" });
    onCancel?.();
  };

  const onFilePicked = async (file: File | undefined) => {
    if (!file) return;
    stopStream();
    // A photo the API won't take (often HEIC from an iPhone) is re-encoded as JPEG.
    if (file.type.startsWith("image/") && !ALLOWED.has(file.type)) {
      const jpeg = await toJpeg(file);
      if (!jpeg) {
        setFileError("We couldn't read that photo. Use a JPEG, PNG or WebP photo.");
        return;
      }
      review(jpeg);
      return;
    }
    review(file);
  };

  const live = phase.kind === "live" || phase.kind === "recording";
  const showStage = phase.kind === "starting" || live;
  const statusText =
    phase.kind === "starting"
      ? "Starting your camera…"
      : phase.kind === "live"
        ? "Camera on. Centre your face in the oval."
        : phase.kind === "recording"
          ? `Recording, ${phase.secondsLeft} second${phase.secondsLeft === 1 ? "" : "s"} left. Turn your head slowly left, then right.`
          : phase.kind === "review"
            ? "Check your capture, then use it or retake it."
            : "";

  const fallbackPicker = (
    <>
      <label
        htmlFor={fileInputId}
        className={cn(
          "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-brand transition-colors hover:bg-brand/5 focus-within:ring-2 focus-within:ring-brand/40",
          busy && "pointer-events-none opacity-50",
        )}
      >
        <HugeiconsIcon icon={Image01Icon} size={14} />
        Take a selfie with your device instead
      </label>
      <input
        id={fileInputId}
        type="file"
        accept="image/*"
        capture="user"
        disabled={busy}
        className="sr-only"
        onChange={(e) => {
          void onFilePicked(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </>
  );

  return (
    <div className="flex flex-col gap-3" aria-busy={phase.kind === "starting" || busy}>
      <p id={statusId} role="status" aria-live="polite" className="sr-only">
        {statusText}
      </p>

      {/* The video element stays mounted while the camera runs so the stream has somewhere to go. */}
      <div
        className={cn(
          "relative mx-auto aspect-[3/4] w-full max-w-[320px] overflow-hidden rounded-3xl bg-ink",
          !showStage && "hidden",
        )}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          aria-describedby={statusId}
          aria-label="Live camera preview"
          // Mirrored like a mirror while framing; the capture itself is not mirrored.
          className="h-full w-full -scale-x-100 object-cover"
        />
        <FaceGuide recording={phase.kind === "recording"} />
        {phase.kind === "starting" && (
          <div className="absolute inset-0 grid place-items-center bg-ink/60">
            <span className="h-7 w-7 rounded-full border-2 border-white/30 border-t-white motion-safe:animate-spin" />
          </div>
        )}
        {phase.kind === "recording" && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-ink/70 px-2.5 py-1 text-[11px] font-semibold text-white">
            <span className="h-2 w-2 rounded-full bg-rose-500 motion-safe:animate-pulse" />
            {phase.secondsLeft}s
          </span>
        )}
      </div>

      {phase.kind === "idle" && (
        <div className="rounded-2xl border border-cloud bg-canvas p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
              <HugeiconsIcon icon={Camera01Icon} size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink">Take a quick photo of your face</p>
              <ul className="mt-1.5 flex flex-col gap-0.5 text-[11px] leading-relaxed text-ink-soft">
                <li>• Face the light, with nothing bright behind you</li>
                <li>• Remove sunglasses, caps or face coverings</li>
                <li>• Keep your whole face inside the oval</li>
              </ul>
            </div>
          </div>
          <Button variant="brand" size="pill-lg" className="mt-4 w-full" disabled={busy} onClick={startCamera}>
            <HugeiconsIcon icon={Camera01Icon} size={16} />
            Open camera
          </Button>
          <div className="mt-2 flex justify-center">{fallbackPicker}</div>
        </div>
      )}

      {phase.kind === "error" && (
        <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2.5">
            <HugeiconsIcon icon={Alert01Icon} size={16} className="mt-0.5 shrink-0 text-amber-700" />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink">{PROBLEM_COPY[phase.reason].title}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-ink-soft">{PROBLEM_COPY[phase.reason].body}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-col items-stretch gap-1 sm:flex-row sm:items-center sm:justify-between">
            {fallbackPicker}
            {phase.reason !== "unsupported" && (
              <Button variant="brand-outline" size="pill" disabled={busy} onClick={startCamera}>
                <HugeiconsIcon icon={RefreshIcon} size={14} />
                Try the camera again
              </Button>
            )}
          </div>
        </div>
      )}

      {live && (
        <div className="flex flex-col gap-2">
          <p className="text-center text-[11px] text-ink-soft" aria-hidden>
            {phase.kind === "recording"
              ? "Turn your head slowly left, then right."
              : "Centre your face in the oval and look at the camera."}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              ref={captureButtonRef}
              variant="brand"
              size="pill-lg"
              className="flex-1"
              disabled={phase.kind !== "live" || busy}
              onClick={takePhoto}
            >
              <HugeiconsIcon icon={Camera01Icon} size={16} />
              Take photo
            </Button>
            {clipType && (
              <Button
                variant="brand-outline"
                size="pill-lg"
                className="flex-1"
                disabled={phase.kind !== "live" || busy}
                onClick={recordClip}
              >
                <HugeiconsIcon icon={Video01Icon} size={16} />
                {phase.kind === "recording" ? "Recording…" : `Record ${CLIP_SECONDS}s clip`}
              </Button>
            )}
          </div>
          <Button variant="brand-ghost" size="pill" disabled={phase.kind === "recording"} onClick={cancel}>
            Close camera
          </Button>
        </div>
      )}

      {phase.kind === "review" && (
        <div className="flex flex-col gap-3">
          <div className="relative mx-auto aspect-[3/4] w-full max-w-[320px] overflow-hidden rounded-3xl bg-ink">
            {phase.file.type.startsWith("video/") ? (
              <video
                src={phase.url}
                controls
                playsInline
                muted
                aria-label="Your recorded clip"
                className="h-full w-full object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- local blob preview
              <img src={phase.url} alt="Your face capture" className="h-full w-full object-cover" />
            )}
          </div>
          <p className="text-center text-[11px] text-ink-soft">
            Is your whole face clear, sharp and well lit?
          </p>
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <Button
              ref={confirmButtonRef}
              variant="brand"
              size="pill-lg"
              className="flex-1"
              disabled={busy}
              onClick={() => onConfirm(phase.file)}
            >
              {busy ? (
                <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white motion-safe:animate-spin" />
              ) : (
                <HugeiconsIcon icon={Tick02Icon} size={16} />
              )}
              {busy ? "Sending…" : confirmLabel}
            </Button>
            <Button variant="brand-outline" size="pill-lg" className="flex-1" disabled={busy} onClick={retake}>
              <HugeiconsIcon icon={RefreshIcon} size={16} />
              Retake
            </Button>
          </div>
        </div>
      )}

      {fileError && (
        <p role="alert" className="text-center text-[11px] font-medium text-rose-600">
          {fileError}
        </p>
      )}
    </div>
  );
}

/** Dimmed surround with an oval cut-out for the face. */
function FaceGuide({ recording }: { recording: boolean }) {
  const maskId = `face-guide-${useId().replace(/:/g, "")}`;
  return (
    <svg
      aria-hidden
      viewBox="0 0 300 400"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <defs>
        <mask id={maskId}>
          <rect width="300" height="400" fill="white" />
          <ellipse cx="150" cy="185" rx="98" ry="130" fill="black" />
        </mask>
      </defs>
      <rect width="300" height="400" fill="rgb(0 0 0 / 0.45)" mask={`url(#${maskId})`} />
      <ellipse
        cx="150"
        cy="185"
        rx="98"
        ry="130"
        fill="none"
        strokeWidth="3"
        strokeDasharray={recording ? undefined : "10 8"}
        className={cn(recording ? "stroke-rose-400" : "stroke-white/90")}
      />
    </svg>
  );
}
