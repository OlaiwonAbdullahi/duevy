"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import {
  Alert01Icon,
  Building03Icon,
  CheckmarkCircle02Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { useAuth } from "@/lib/auth/auth-context";
import { ApiError } from "@/lib/api/errors";
import { lookupSpace, joinSpace } from "@/lib/api/spaces";
import { adaptJoinable } from "@/app/(dashboards)/dashboard/dues/_components/adapt";
import {
  MIN_CODE,
  MAX_CODE,
} from "@/app/(dashboards)/dashboard/dues/_components/data";
import type { JoinableDepartment } from "@/app/(dashboards)/dashboard/dues/_components/types";
import { EmptyState } from "@/app/(dashboards)/dashboard/_components/EmptyState";
import { SpacePreviewCard } from "./_components/SpacePreviewCard";

const CODE_PATTERN = new RegExp(`^[A-Z0-9-]{${MIN_CODE},${MAX_CODE}}$`);

type Phase =
  | "loading"
  | "looking-up"
  | "preview"
  | "joining"
  | "joined"
  | "already-member"
  | "own-space"
  | "invalid"
  | "rate-limited"
  | "error";

export default function JoinSpacePage() {
  const params = useParams<{ code: string }>();
  const rawCode = params.code;
  const router = useRouter();
  const { user, status, refreshUser } = useAuth();

  const [phase, setPhase] = useState<Phase>("loading");
  const [dept, setDept] = useState<JoinableDepartment | null>(null);

  const performLookup = useCallback(async () => {
    const normalized = rawCode.trim().toUpperCase();
    if (!CODE_PATTERN.test(normalized)) {
      setPhase("invalid");
      return;
    }

    setPhase("looking-up");
    try {
      const raw = await lookupSpace(normalized);
      const adapted = adaptJoinable(raw);
      setDept(adapted);

      const membership = user?.spaces.find(
        (s) => s.id === adapted.id,
      )?.membership;
      if (
        membership === "rep" ||
        membership === "lead" ||
        membership === "co"
      ) {
        setPhase("own-space");
      } else if (membership === "member" || membership === "guest") {
        setPhase("already-member");
      } else {
        setPhase("preview");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "JOIN_CODE_INVALID" || err.status === 404) {
          setPhase("invalid");
        } else if (err.status === 429 || err.code === "RATE_LIMITED") {
          setPhase("rate-limited");
        } else {
          setPhase("error");
        }
      } else {
        setPhase("error");
      }
    }
  }, [rawCode, user]);

  // Wait out the brief refresh-cookie exchange on a hard reload before acting —
  // redirecting during "loading" would wrongly bounce an already-signed-in user.
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace(`/signup?next=${encodeURIComponent(`/join/${rawCode}`)}`);
      return;
    }
    performLookup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const performJoin = async () => {
    if (!dept) return;
    setPhase("joining");
    try {
      await joinSpace(dept.id, { code: dept.code });
      await refreshUser();
      setPhase("joined");
    } catch (err) {
      if (err instanceof ApiError && err.code === "ALREADY_MEMBER") {
        setPhase("already-member");
        return;
      }
      if (err instanceof ApiError && err.code === "JOIN_CODE_INVALID") {
        setPhase("invalid");
        return;
      }
      setPhase("preview");
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12 sm:px-8">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 self-center text-xl tracking-tight text-ink transition-opacity hover:opacity-80"
      >
        <Image
          src="/icons/logo2.svg"
          alt="Duevy Logo"
          width={25}
          height={32}
          className="h-7 w-auto"
          priority
        />
        Duevy.
      </Link>

      {phase === "loading" || phase === "looking-up" ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="relative grid h-14 w-14 place-items-center rounded-full bg-cloud text-brand">
            <HugeiconsIcon icon={Search01Icon} size={24} />
            <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-brand" />
          </span>
          <h1 className="text-lg font-semibold text-ink">
            Checking your invite
          </h1>
          <p className="max-w-xs text-sm text-ink-soft">
            Hold on while we look up this space.
          </p>
        </div>
      ) : phase === "preview" || phase === "joining" ? (
        dept && (
          <SpacePreviewCard
            dept={dept}
            busy={phase === "joining"}
            onJoin={performJoin}
          />
        )
      ) : phase === "joined" ? (
        <EmptyState
          icon={CheckmarkCircle02Icon}
          title="You're in!"
          description={`You've joined ${dept?.name ?? "the space"}. Its dues and updates are now in your dashboard.`}
          action={
            <Button variant="brand" size="pill-lg" asChild>
              <Link href="/dashboard/dues">Go to dashboard</Link>
            </Button>
          }
        />
      ) : phase === "already-member" ? (
        <EmptyState
          icon={CheckmarkCircle02Icon}
          title="Already a member"
          description={`You're already part of ${dept?.name ?? "this space"} — no need to join again.`}
          action={
            <Button variant="brand" size="pill-lg" asChild>
              <Link href="/dashboard/dues">Go to dashboard</Link>
            </Button>
          }
        />
      ) : phase === "own-space" ? (
        <EmptyState
          icon={Building03Icon}
          title="This is your department"
          description={`You manage ${dept?.name ?? "this space"}. Head to Circle to see your members and share this link yourself.`}
          action={
            <Button variant="brand" size="pill-lg" asChild>
              <Link href="/dashboard/circle">Open Circle</Link>
            </Button>
          }
        />
      ) : phase === "rate-limited" ? (
        <EmptyState
          icon={Alert01Icon}
          title="Too many attempts"
          description="You've tried this too many times in the last minute. Wait a moment, then try again."
          action={
            <Button variant="brand" size="pill-lg" onClick={performLookup}>
              Try again
            </Button>
          }
        />
      ) : phase === "error" ? (
        <EmptyState
          icon={Alert01Icon}
          title="Something went wrong"
          description="Couldn't reach Duevy. Check your connection and try again."
          action={
            <Button variant="brand" size="pill-lg" onClick={performLookup}>
              Retry
            </Button>
          }
        />
      ) : (
        <EmptyState
          icon={Alert01Icon}
          title="Link not valid"
          description="This join link is invalid or has expired. Ask your rep for a fresh one."
        />
      )}
    </main>
  );
}
