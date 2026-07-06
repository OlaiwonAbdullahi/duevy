"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * First-visit walkthrough of the dashboard chrome. Steps spotlight elements
 * marked with `data-tour` attributes (Topbar, Sidebar); a step whose target
 * isn't visible at start — the sidebar on mobile, the menu button on desktop —
 * is dropped, so the same list serves every screen size.
 *
 * Runs automatically once (tracked in localStorage) right after onboarding
 * lands the user here; can be replayed from Settings via useTour().
 */

export const TOUR_DONE_KEY = "duevy-tour-done";

type TourStep = {
  id: string;
  /** CSS selector; the first *visible* match is spotlighted. Absent = centered card. */
  target?: string;
  title: string;
  body: string;
};

const STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Duevy 👋",
    body: "Your dues, wallet and receipts — all in one place. Here's a quick look around; it takes about thirty seconds.",
  },
  {
    id: "nav",
    target: '[data-tour="nav"]',
    title: "Everything lives here",
    body: "Wallet, dues, transactions and settings. Reps also get tools for collections, polls and managing the department.",
  },
  {
    id: "menu",
    target: '[data-tour="menu"]',
    title: "Your menu",
    body: "Wallet, dues, transactions and settings all live in here. Reps also get tools for collections and managing the department.",
  },
  {
    id: "search",
    target: '[data-tour="search"]',
    title: "Jump anywhere",
    body: "Search opens the command palette — every page and action, a keystroke away. Ctrl K (or ⌘K) works too.",
  },
  {
    id: "notifications",
    target: '[data-tour="notifications"]',
    title: "Stay in the loop",
    body: "Due reminders, payment confirmations and space updates land here.",
  },
  {
    id: "theme",
    target: '[data-tour="theme"]',
    title: "Make it yours",
    body: "Switch between light and dark. Reps can also pick a colour theme for their whole space under Manage department.",
  },
  {
    id: "done",
    title: "You're all set 🎉",
    body: "That's the lay of the land. You can replay this tour anytime from Settings.",
  },
];

function findVisibleTarget(selector: string): HTMLElement | null {
  for (const el of Array.from(document.querySelectorAll<HTMLElement>(selector))) {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    const visible =
      rect.width > 0 &&
      rect.height > 0 &&
      rect.right > 0 &&
      rect.bottom > 0 &&
      rect.left < window.innerWidth &&
      rect.top < window.innerHeight &&
      style.display !== "none" &&
      style.visibility !== "hidden";
    if (visible) return el;
  }
  return null;
}

type TourContextValue = { start: () => void };

const TourContext = createContext<TourContextValue | null>(null);

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used inside a <TourProvider>");
  return ctx;
}

export function TourProvider({ children }: { children: ReactNode }) {
  // The running tour's steps, filtered to targets that exist on this screen;
  // null while no tour is running.
  const [steps, setSteps] = useState<TourStep[] | null>(null);
  const [index, setIndex] = useState(0);

  const start = useCallback(() => {
    setIndex(0);
    setSteps(STEPS.filter((s) => !s.target || findVisibleTarget(s.target)));
  }, []);

  const finish = useCallback(() => {
    setSteps(null);
    try {
      localStorage.setItem(TOUR_DONE_KEY, "1");
    } catch {
      // Private mode — the tour will simply offer itself again next visit.
    }
  }, []);

  // First visit only: give the dashboard a beat to settle, then run.
  useEffect(() => {
    try {
      if (localStorage.getItem(TOUR_DONE_KEY)) return;
    } catch {
      return;
    }
    const t = setTimeout(start, 900);
    return () => clearTimeout(t);
  }, [start]);

  return (
    <TourContext.Provider value={{ start }}>
      {children}
      <AnimatePresence>
        {steps && (
          <TourOverlay
            steps={steps}
            index={index}
            onIndex={setIndex}
            onFinish={finish}
          />
        )}
      </AnimatePresence>
    </TourContext.Provider>
  );
}

/* ------------------------------------------------------------------ */

const SPOT_PAD = 6; // breathing room around the spotlit element
const CARD_GAP = 14; // gap between spotlight and card

type Box = { top: number; left: number; width: number; height: number };

function TourOverlay({
  steps,
  index,
  onIndex,
  onFinish,
}: {
  steps: TourStep[];
  index: number;
  onIndex: (i: number) => void;
  onFinish: () => void;
}) {
  const step = steps[index];
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  const spotSteps = steps.filter((s) => s.target);
  const spotNumber = step.target ? spotSteps.indexOf(step) + 1 : 0;

  const [box, setBox] = useState<Box | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardPos, setCardPos] = useState<{ top: number; left: number } | null>(
    null,
  );

  // Track the target's rectangle, following window resizes and any scrolling.
  useLayoutEffect(() => {
    if (!step.target) {
      setBox(null);
      return;
    }
    const selector = step.target;
    const measure = () => {
      const el = findVisibleTarget(selector);
      if (!el) {
        setBox(null); // target vanished mid-tour → card just centres itself
        return;
      }
      const r = el.getBoundingClientRect();
      setBox({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step]);

  // Place the card beside the spotlight (below it when there's room, else
  // above), clamped to the viewport. Runs pre-paint, so no flicker.
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    if (!box) {
      setCardPos(null);
      return;
    }
    const cw = card.offsetWidth;
    const ch = card.offsetHeight;
    const below = box.top + box.height + SPOT_PAD + CARD_GAP;
    let top =
      below + ch <= window.innerHeight - 16
        ? below
        : box.top - SPOT_PAD - CARD_GAP - ch;
    top = Math.max(16, top);
    let left = box.left + box.width / 2 - cw / 2;
    left = Math.max(16, Math.min(left, window.innerWidth - cw - 16));
    setCardPos({ top, left });
  }, [box, index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFinish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onFinish]);

  const centered = !box;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[200]"
      role="dialog"
      aria-modal="true"
      aria-label="Product tour"
    >
      {/* Dim layer: a moving cutout around the target, or a plain wash. */}
      {box ? (
        <div
          className="pointer-events-none fixed z-[201] rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            top: box.top - SPOT_PAD,
            left: box.left - SPOT_PAD,
            width: box.width + SPOT_PAD * 2,
            height: box.height + SPOT_PAD * 2,
            boxShadow: "0 0 0 200vmax rgba(8, 12, 10, 0.6)",
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-[rgba(8,12,10,0.6)]" />
      )}

      {/* Step card. Keyed per step so each one gets an entrance. Centering
          uses a grid wrapper, not translate classes — motion owns transform. */}
      <div
        className={cn(
          "pointer-events-none fixed inset-0 z-[202]",
          centered && "grid place-items-center p-4",
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            ref={cardRef}
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto w-80 max-w-[calc(100vw-2rem)] rounded-3xl border border-cloud bg-canvas p-5 shadow-2xl"
            style={
              centered
                ? undefined
                : {
                    position: "absolute",
                    top: cardPos?.top,
                    left: cardPos?.left,
                    visibility: cardPos ? "visible" : "hidden",
                  }
            }
          >
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-base font-semibold tracking-tight text-ink">
              {step.title}
            </h2>
            {spotNumber > 0 && (
              <span className="shrink-0 rounded-full bg-cloud px-2 py-0.5 text-[11px] font-semibold text-brand">
                {spotNumber} of {spotSteps.length}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
            {step.body}
          </p>

          <div className="mt-4 flex items-center gap-2">
            {isFirst && (
              <>
                <button
                  type="button"
                  onClick={onFinish}
                  className="rounded-full px-3.5 py-2 text-xs font-semibold text-ink-soft transition-colors duration-300 hover:text-ink cursor-pointer"
                >
                  Skip for now
                </button>
                <button
                  type="button"
                  autoFocus
                  onClick={() => onIndex(index + 1)}
                  className="ml-auto rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition-colors duration-300 hover:bg-brand-bright cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                >
                  Show me around
                </button>
              </>
            )}
            {!isFirst && !isLast && (
              <>
                <button
                  type="button"
                  onClick={onFinish}
                  className="rounded-full px-3.5 py-2 text-xs font-semibold text-ink-soft transition-colors duration-300 hover:text-ink cursor-pointer"
                >
                  Skip tour
                </button>
                <button
                  type="button"
                  onClick={() => onIndex(index - 1)}
                  className="ml-auto rounded-full border border-cloud px-3.5 py-2 text-xs font-semibold text-ink transition-colors duration-300 hover:bg-paper cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  autoFocus
                  onClick={() => onIndex(index + 1)}
                  className="rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition-colors duration-300 hover:bg-brand-bright cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
                >
                  Next
                </button>
              </>
            )}
            {isLast && (
              <button
                type="button"
                autoFocus
                onClick={onFinish}
                className="ml-auto rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition-colors duration-300 hover:bg-brand-bright cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                Finish
              </button>
            )}
          </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>,
    document.body,
  );
}
