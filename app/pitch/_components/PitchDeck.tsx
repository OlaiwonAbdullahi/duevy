"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, m } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  FullScreenIcon,
  MinimizeScreenIcon,
} from "@hugeicons/core-free-icons";
import { slides } from "./slides";

const SWIPE_THRESHOLD = 50;

/** Reads `#3` style hashes into a zero-based slide index. */
function indexFromHash() {
  const n = Number.parseInt(window.location.hash.slice(1), 10);
  if (Number.isNaN(n)) return 0;
  return Math.min(Math.max(n - 1, 0), slides.length - 1);
}

function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

/**
 * Full-screen presenter for the pitch. Arrow keys / space / PageUp-Down move
 * between slides, Home/End jump, F toggles fullscreen, and swipes work on
 * touch. The URL hash is the current slide, so a link opens on it.
 */
export default function PitchDeck() {
  // -1 on the server: the hash is client-only, so the slide waits for it
  // rather than flashing slide 1 before a deep link resolves.
  const index = useSyncExternalStore(subscribeToHash, indexFromHash, () => -1);
  const ready = index >= 0;
  const [direction, setDirection] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const goTo = useCallback(
    (next: number) => {
      const clamped = Math.min(Math.max(next, 0), slides.length - 1);
      if (clamped === index) return;
      setDirection(clamped > index ? 1 : -1);
      // replace() keeps slide changes out of the back-button history.
      window.location.replace(`#${clamped + 1}`);
    },
    [index],
  );

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Let sliders and other controls keep their own arrow keys.
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=true]")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
        case "PageDown":
        case " ":
          e.preventDefault();
          goTo(index + 1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
        case "PageUp":
          e.preventDefault();
          goTo(index - 1);
          break;
        case "Home":
          e.preventDefault();
          goTo(0);
          break;
        case "End":
          e.preventDefault();
          goTo(slides.length - 1);
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, goTo, toggleFullscreen]);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    // Horizontal swipes only, so a slide that scrolls on a phone still scrolls.
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
    goTo(index + (dx < 0 ? 1 : -1));
  };

  const slide = slides[Math.max(index, 0)];
  const dark = slide.tone === "brand";

  return (
    <div
      className={`fixed inset-0 overflow-hidden transition-colors duration-500 ${
        dark ? "bg-[#08583f]" : "bg-[#fbfaf7]"
      }`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Duevy doodle artwork behind the green slides */}
      <div
        aria-hidden
        className={`absolute inset-0 bg-[url('/doodle-card.jpg')] bg-cover bg-center transition-opacity duration-700 ${
          dark ? "opacity-100" : "opacity-0"
        }`}
      />
      {/* Top bar */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 md:px-10 h-16">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logos/duevy-mark.svg"
            alt="Duevy"
            width={24}
            height={24}
            style={{ width: "auto" }}
            className={`h-6 transition-[filter] ${dark ? "brightness-0 invert" : ""}`}
            priority
          />
          <span
            className={`text-lg tracking-tight transition-colors ${
              dark ? "text-white" : "text-[#1b2520]"
            }`}
          >
            Duevy.
          </span>
        </Link>
        <span
          className={`text-[13px] font-medium tabular-nums transition-colors ${
            dark ? "text-white/70" : "text-[#7a847f]"
          }`}
        >
          {String(Math.max(index, 0) + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
        </span>
      </header>

      {/* Slide */}
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        {ready && (
        <m.section
          key={index}
          custom={direction}
          variants={{
            enter: (d: number) => ({ opacity: 0, x: d * 60 }),
            center: { opacity: 1, x: 0 },
            exit: (d: number) => ({ opacity: 0, x: d * -60 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
          aria-roledescription="slide"
          aria-label={`${index + 1} of ${slides.length}: ${slide.title}`}
        >
          <div className="absolute inset-0 overflow-y-auto overflow-x-hidden no-scrollbar">
            <div className="min-h-full flex items-center px-5 md:px-16 pt-20 pb-28">
              <div className="w-full max-w-6xl mx-auto">{slide.render()}</div>
            </div>
          </div>
        </m.section>
        )}
      </AnimatePresence>

      {/* Controls */}
      <footer
        className={`absolute inset-x-0 bottom-0 z-20 px-5 md:px-10 pt-10 pb-[calc(1.25rem+env(safe-area-inset-bottom))] bg-linear-to-t transition-colors duration-500 ${
          dark ? "from-[#08583f]/90 via-[#08583f]/40" : "from-[#fbfaf7] via-[#fbfaf7]/90"
        } to-transparent pointer-events-none [&>*]:pointer-events-auto`}
      >
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-1.5 flex-1">
            {slides.map((s, i) => (
              <button
                key={s.title}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}: ${s.title}`}
                aria-current={i === index ? "step" : undefined}
                className="group py-2 flex-1 cursor-pointer"
              >
                <span
                  className={`block h-1 rounded-full transition-all duration-500 ${
                    i <= index
                      ? dark
                        ? "bg-white"
                        : "bg-[#0b6e4f]"
                      : dark
                        ? "bg-white/20 group-hover:bg-white/40"
                        : "bg-[#e6f2ec] group-hover:bg-[#0b6e4f]/30"
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Mobile: single progress bar */}
          <div className={`md:hidden flex-1 h-1 rounded-full ${dark ? "bg-white/20" : "bg-[#e6f2ec]"}`}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${dark ? "bg-white" : "bg-[#0b6e4f]"}`}
              style={{ width: `${((index + 1) / slides.length) * 100}%` }}
            />
          </div>

          <div className="flex items-center gap-2">
            <ControlButton dark={dark} label="Previous slide" onClick={() => goTo(index - 1)} disabled={index === 0}>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
            </ControlButton>
            <ControlButton
              dark={dark}
              label="Next slide"
              onClick={() => goTo(index + 1)}
              disabled={index === slides.length - 1}
              primary
            >
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} />
            </ControlButton>
            <ControlButton
              dark={dark}
              label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              onClick={toggleFullscreen}
              className="hidden md:grid"
            >
              <HugeiconsIcon icon={isFullscreen ? MinimizeScreenIcon : FullScreenIcon} size={16} />
            </ControlButton>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ControlButton({
  children,
  label,
  onClick,
  disabled,
  primary,
  dark,
  className = "grid",
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  dark: boolean;
  className?: string;
}) {
  const tone = primary
    ? dark
      ? "bg-white text-[#0b6e4f] hover:bg-white/90"
      : "bg-[#0b6e4f] text-white hover:bg-[#08583f]"
    : dark
      ? "bg-white/10 text-white hover:bg-white/20"
      : "bg-[#f4f2ec] text-[#1b2520] hover:bg-[#e6f2ec]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`${className} place-items-center h-10 w-10 rounded-full transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${tone}`}
    >
      {children}
    </button>
  );
}
