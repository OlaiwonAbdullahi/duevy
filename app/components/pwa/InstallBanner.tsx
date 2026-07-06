"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Download04Icon,
  Cancel01Icon,
  ArrowUp01Icon,
} from "@hugeicons/core-free-icons";

/** The `beforeinstallprompt` event isn't in the standard DOM lib types. */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "duevy-install-dismissed";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari exposes this instead of the display-mode media query.
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * A branded prompt to install Duevy as an app. Uses the native install flow on
 * Chrome/Edge/Android; on iOS Safari (which has no install API) it shows the
 * Add-to-Home-Screen steps instead. Dismissal is remembered.
 */
export function InstallBanner() {
  const [promptEvent, setPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  // Starts hidden so the first client render matches the server (nothing), then
  // reveals after paint once we've checked the browser-only signals.
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    // Already installed, or dismissed before — stay out of the way entirely.
    if (isStandalone() || localStorage.getItem(DISMISS_KEY) === "1") return;

    // Reveal after paint so we never hydrate a banner the server didn't render.
    const raf = requestAnimationFrame(() => {
      setHidden(false);
      // iOS can't fire beforeinstallprompt, so offer manual steps there.
      if (isIos()) setIosHint(true);
    });

    const onPrompt = (e: Event) => {
      e.preventDefault(); // stop the mini-infobar; we show our own UI
      setPromptEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setPromptEvent(null);
      setIosHint(false);
      setHidden(true);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const close = () => {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // private mode / storage disabled — dismiss for this session only
    }
  };

  const install = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  };

  const show = !hidden && (promptEvent !== null || iosHint);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-4 z-60 mx-auto flex w-[calc(100%-2rem)] max-w-md items-center gap-3 rounded-3xl border border-cloud bg-canvas/95 p-3 pr-2 shadow-[0_20px_50px_-24px_rgba(11,110,79,0.5)] backdrop-blur sm:bottom-6"
          role="dialog"
          aria-label="Install Duevy"
        >
          <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-brand">
            <Image
              src="/icons/logo.svg"
              alt="Duevy"
              fill
              sizes="48px"
              className="object-cover"
            />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">Install Duevy</p>
            {iosHint && !promptEvent ? (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-soft">
                Tap
                <HugeiconsIcon
                  icon={ArrowUp01Icon}
                  size={13}
                  className="text-brand"
                />
                Share, then{" "}
                <span className="font-medium text-ink">Add to Home Screen</span>
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-ink-soft">
                Add it to your home screen — pay dues in a tap.
              </p>
            )}
          </div>

          {promptEvent && (
            <button
              type="button"
              onClick={install}
              className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 text-[13px] font-semibold text-white transition-colors duration-300 hover:bg-brand-bright cursor-pointer"
            >
              <HugeiconsIcon icon={Download04Icon} size={15} />
              Install
            </button>
          )}

          <button
            type="button"
            onClick={close}
            aria-label="Dismiss"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-soft transition-colors duration-300 hover:bg-paper hover:text-ink cursor-pointer"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
