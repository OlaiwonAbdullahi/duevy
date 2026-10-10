"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * A user's avatar. Prefers a real uploaded `src` (from `/me/avatar`); otherwise
 * falls back to one generated from their name by tapback.co, and finally to the
 * name's initials on a brand plate if neither image can load. `unoptimized`
 * sends the webp straight through, so no remote-image config is needed.
 */
export function UserAvatar({
  name,
  src,
  size = 36,
  className,
}: {
  name: string;
  /** A real avatar URL (`user.avatarUrl`), when the user has uploaded one. */
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  // A new src (e.g. right after an upload) deserves a fresh attempt even if a
  // previous one failed.
  const [trackedSrc, setTrackedSrc] = useState(src);
  if (src !== trackedSrc) {
    setTrackedSrc(src);
    setFailed(false);
  }

  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  if (failed) {
    return (
      <span
        aria-label={name}
        className={cn(
          "grid shrink-0 place-items-center rounded-full bg-brand font-semibold text-white",
          className,
        )}
        style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      >
        {initials}
      </span>
    );
  }

  return (
    <Image
      src={src || `https://tapback.co/api/avatar/${encodeURIComponent(name)}.webp`}
      alt={name}
      width={size}
      height={size}
      unoptimized
      onError={() => setFailed(true)}
      className={cn("shrink-0 rounded-full object-cover", className)}
      style={{ width: size, height: size }}
    />
  );
}
