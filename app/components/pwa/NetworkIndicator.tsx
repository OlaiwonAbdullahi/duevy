"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  WifiDisconnected02Icon,
  Wifi01Icon,
} from "@hugeicons/core-free-icons";

/** Subscribe to the browser's connectivity events for useSyncExternalStore. */
function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

/**
 * A small connectivity pill. Stays put while offline; flashes a brief "Back
 * online" when the connection returns, then hides. Silent when all's well.
 */
export function NetworkIndicator() {
  // useSyncExternalStore reads navigator.onLine on the client and assumes
  // "online" during SSR — no hydration mismatch, no setState-in-effect.
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );

  const [reconnected, setReconnected] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const onOnline = () => {
      setReconnected(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setReconnected(false), 2600);
    };
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("online", onOnline);
      clearTimeout(timer.current);
    };
  }, []);

  const offline = !online;
  const visible = offline || reconnected;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={offline ? "offline" : "online"}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          role="status"
          aria-live="polite"
          className={`fixed left-1/2 top-4 z-70 flex -translate-x-1/2 items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-medium shadow-[0_12px_30px_-16px_rgba(0,0,0,0.4)] backdrop-blur ${
            offline
              ? "border-rose-200 bg-rose-50/95 text-rose-700"
              : "border-cloud bg-canvas/95 text-brand"
          }`}
        >
          <HugeiconsIcon
            icon={offline ? WifiDisconnected02Icon : Wifi01Icon}
            size={16}
          />
          {offline ? "You're offline" : "Back online"}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
