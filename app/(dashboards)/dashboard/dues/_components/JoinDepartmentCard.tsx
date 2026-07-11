"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserMultipleIcon,
  CheckmarkCircle02Icon,
  Alert01Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/errors";
import { lookupSpace } from "@/lib/api/spaces";
import type { JoinableDepartment } from "./types";
import { adaptJoinable } from "./adapt";
import { KIND_GLYPH, SPACE_KIND_LABEL } from "./data";
import { SpaceEmblem } from "./SpaceEmblem";
import { BRAND_INPUT } from "../../_components/form-styles";

const CODE_LENGTH = 5;

/**
 * Search-by-code join. A student enters the 5-character code their rep shared;
 * once it resolves to a department (via `POST /spaces/lookup`), a preview
 * appears and they join in one tap — no request, no waiting for approval.
 */
export function JoinDepartmentCard({
  joinedIds,
  onJoin,
}: {
  joinedIds: string[];
  onJoin: (dept: JoinableDepartment) => void;
}) {
  const [code, setCode] = useState("");
  const [match, setMatch] = useState<JoinableDepartment | null>(null);
  const [notFound, setNotFound] = useState(false);

  const normalized = code.trim().toUpperCase();
  const complete = normalized.length === CODE_LENGTH;
  const alreadyJoined = match ? joinedIds.includes(match.id) : false;

  // Resolve the code once complete. Debounced + race-guarded so a stale response
  // can't overwrite a newer lookup.
  useEffect(() => {
    if (!complete) {
      setMatch(null);
      setNotFound(false);
      return;
    }
    let cancelled = false;
    setNotFound(false);
    const timer = setTimeout(async () => {
      try {
        const dept = await lookupSpace(normalized);
        if (!cancelled) setMatch(adaptJoinable(dept));
      } catch (err) {
        if (!cancelled) {
          setMatch(null);
          setNotFound(!(err instanceof ApiError) || err.status === 404);
        }
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [complete, normalized]);

  const handleChange = (value: string) => {
    // Codes are alphanumeric and upper-cased; strip anything else as they type.
    const cleaned = value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, CODE_LENGTH);
    setCode(cleaned);
  };

  const join = () => {
    if (!match || alreadyJoined) return;
    onJoin(match);
    setCode("");
    setMatch(null);
  };

  return (
    <section className="rounded-3xl border border-cloud bg-canvas p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-cloud text-brand">
          <HugeiconsIcon icon={UserAdd01Icon} size={18} />
        </span>
        <div>
          <h2 className="text-base font-semibold tracking-tight text-ink">
            Join a department
          </h2>
          <p className="mt-0.5 text-xs text-ink-soft">
            Got a code from your rep? Enter it to find your department and join.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Input
          value={code}
          onChange={(event) => handleChange(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && join()}
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          placeholder="Enter 5-character code"
          aria-label="Department join code"
          className={cn(
            BRAND_INPUT,
            "h-12 flex-1 bg-paper text-base font-semibold uppercase tracking-[0.35em] placeholder:text-sm placeholder:font-normal placeholder:tracking-normal md:text-base",
          )}
        />
        <Button
          variant="brand"
          size="pill-xl"
          onClick={join}
          disabled={!match || alreadyJoined}
          className="shrink-0"
        >
          Join
        </Button>
      </div>

      {/* Result region — swaps between the match preview and a "not found" note. */}
      <AnimatePresence mode="wait" initial={false}>
        {match ? (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mt-4 flex flex-col gap-4 rounded-2xl border border-cloud bg-paper p-4 sm:flex-row sm:items-center"
          >
            <SpaceEmblem
              space={match}
              glyph={KIND_GLYPH[match.kind]}
              size={56}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">
                {match.name}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-soft">
                <span>{SPACE_KIND_LABEL[match.kind]}</span>
                <span className="text-cloud">•</span>
                <span>{match.faculty}</span>
                <span className="text-cloud">•</span>
                <span className="inline-flex items-center gap-1">
                  <HugeiconsIcon icon={UserMultipleIcon} size={13} />
                  {match.memberCount.toLocaleString("en-NG")}
                </span>
              </div>
              <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-ink-soft">
                {match.about}
              </p>
            </div>
            {alreadyJoined && (
              <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-cloud px-3 py-1 text-[11px] font-semibold text-brand sm:self-center">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={13} />
                Already joined
              </span>
            )}
          </motion.div>
        ) : (
          notFound && (
            <motion.p
              key="not-found"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-cloud bg-paper px-4 py-3 text-xs text-ink-soft"
            >
              <HugeiconsIcon
                icon={Alert01Icon}
                size={14}
                className="shrink-0 text-ink-soft"
              />
              No department found for{" "}
              <span className="font-semibold text-ink">{normalized}</span>. Check
              the code with your rep.
            </motion.p>
          )
        )}
      </AnimatePresence>
    </section>
  );
}
