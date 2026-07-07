"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ReactNode } from "react";

/**
 * Fades + slides its children in as they scroll into view.
 * Reveal happens once, is size-independent (triggers as the block enters
 * from the bottom), and collapses to a plain fade for reduced-motion users.
 */
export default function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();

  const variants: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 40 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="show"
      // Fire once the section is meaningfully on screen so the reveal plays
      // in front of the viewer instead of finishing before it scrolls in.
      // `amount` is capped so sections taller than the viewport still trigger.
      viewport={{ once: true, amount: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
