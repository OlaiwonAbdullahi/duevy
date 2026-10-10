"use client";

import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Download04Icon } from "@hugeicons/core-free-icons";

/** The `beforeinstallprompt` event isn't in the standard DOM lib types. */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// The browser fires `beforeinstallprompt` once, possibly before this component
// mounts, so capture it at module load and share it with every button.
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const subscribers = new Set<() => void>();
const notify = () => subscribers.forEach((fn) => fn());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}

function subscribe(fn: () => void) {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * Hero CTA that installs Duevy as a PWA. Uses the native install prompt where
 * available; on iOS (no install API) or unsupported browsers it explains the
 * manual steps instead.
 */
export function InstallAppButton({ className }: { className?: string }) {
  // Server snapshot is false so hydration matches; the client then re-checks.
  const installed = useSyncExternalStore(subscribe, isStandalone, () => false);

  // Already running as the installed app — nothing to download.
  if (installed) return null;

  const install = async () => {
    if (deferredPrompt) {
      const prompt = deferredPrompt;
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      // A prompt can only be used once.
      deferredPrompt = null;
      notify();
      if (outcome === "accepted") toast.success("Duevy is installing…");
      return;
    }

    if (isIos()) {
      toast("Install Duevy", {
        description: "Tap the Share button, then “Add to Home Screen”.",
      });
    } else {
      toast("Install Duevy", {
        description:
          "Open your browser menu and choose “Install app” or “Add to Home Screen”.",
      });
    }
  };

  return (
    <button type="button" onClick={install} className={className}>
      <HugeiconsIcon icon={Download04Icon} size={16} />
      Download app
    </button>
  );
}
