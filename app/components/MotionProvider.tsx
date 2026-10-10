"use client";

import { LazyMotion } from "motion/react";

const loadFeatures = () => import("./motion-features").then((mod) => mod.default);

/**
 * Components use the slim `m` element instead of `motion`; this loads the
 * animation features once for the whole app, asynchronously. `strict` throws if a `motion.*`
 * element sneaks back in and drags the full bundle with it.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {children}
    </LazyMotion>
  );
}
