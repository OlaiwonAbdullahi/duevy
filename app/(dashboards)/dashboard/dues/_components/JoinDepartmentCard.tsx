"use client";

import { useState } from "react";
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
import { KIND_GLYPH, SPACE_KIND_LABEL, MIN_CODE, MAX_CODE } from "./data";
import { SpaceEmblem } from "./SpaceEmblem";
import { BRAND_INPUT } from "../../_components/form-styles";

/**
 * Search-by-code join, two steps: enter the code and **Look up** the department
 * (`POST /spaces/lookup`); once it resolves, a preview appears with a **Join**
 * button. Codes may contain dashes (e.g. "CSC29-LMYB").
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
  const [looking, setLooking] = useState(false);

  const normalized = code.trim().toUpperCase();
  const ready = normalized.length >= MIN_CODE;
  const alreadyJoined = match ? joinedIds.includes(match.id) : false;

  const handleChange = (value: string) => {
    // Codes are upper-cased alphanumerics with optional dashes (e.g. CSC29-LMYB).
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, MAX_CODE);
    setCode(cleaned);
    // Editing the code invalidates any previous lookup result.
    setMatch(null);
    setNotFound(false);
  };

  const lookup = async () => {
    if (!ready || looking) return;
    setLooking(true);
    setMatch(null);
    setNotFound(false);
    try {
      const dept = await lookupSpace(normalized);
      setMatch(adaptJoinable(dept));
    } catch (err) {
      setNotFound(!(err instanceof ApiError) || err.status === 404);
    } finally {
      setLooking(false);
    }
  };

  const join = () => {
    if (!match || alreadyJoined) return;
    onJoin(match);
    setCode("");
    setMatch(null);
    setNotFound(false);
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
            Got a code from your rep? Enter it and look up your department.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Input
          value={code}
          onChange={(event) => handleChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            // If a match is already showing, Enter confirms; otherwise it looks up.
            if (match && !alreadyJoined) join();
            else lookup();
          }}
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          placeholder="Enter your department code"
          aria-label="Department join code"
          className={cn(
            BRAND_INPUT,
            "h-12 flex-1 bg-paper text-base font-semibold uppercase tracking-[0.35em] placeholder:text-sm placeholder:font-normal placeholder:tracking-normal md:text-base",
          )}
        />
        <Button
          variant="brand"
          size="pill-xl"
          onClick={lookup}
          disabled={!ready || looking}
          className="shrink-0"
        >
          {looking ? "Looking up…" : "Look up"}
        </Button>
      </div>

      {/* Result region — the match preview (with a Join button) or a "not found" note. */}
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
            <SpaceEmblem space={match} glyph={KIND_GLYPH[match.kind]} size={56} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{match.name}</p>
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
              {match.about && (
                <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-ink-soft">
                  {match.about}
                </p>
              )}
            </div>
            {alreadyJoined ? (
              <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-cloud px-3 py-1 text-[11px] font-semibold text-brand sm:self-center">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={13} />
                Already joined
              </span>
            ) : (
              <Button
                variant="brand"
                size="pill"
                onClick={join}
                className="shrink-0 self-start sm:self-center"
              >
                Join department
              </Button>
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
              <span className="font-semibold text-ink">{normalized}</span>. Check the
              code with your rep.
            </motion.p>
          )
        )}
      </AnimatePresence>
    </section>
  );
}
