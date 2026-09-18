import { DEMO_MODE } from "./demo/config";

/**
 * Pilot feature gates. These ship fully built but are cut from the MVP pilot
 * scope — off by default, flip the env var (no code change) to re-enable for
 * Phase 2. Build-time inlined since these are NEXT_PUBLIC_ vars.
 *
 * Demo mode turns all of them on regardless: the point of the demo is to show
 * the whole product, and env files aren't committed, so a deployed demo would
 * otherwise come up with everything hidden.
 */
function on(envVar: string | undefined): boolean {
  return DEMO_MODE || envVar === "true";
}

export const FEATURES = {
  polls: on(process.env.NEXT_PUBLIC_FEATURE_POLLS),
  assistant: on(process.env.NEXT_PUBLIC_FEATURE_ASSISTANT),
  referrals: on(process.env.NEXT_PUBLIC_FEATURE_REFERRALS),
  cards: on(process.env.NEXT_PUBLIC_FEATURE_CARDS),
  themes: on(process.env.NEXT_PUBLIC_FEATURE_THEMES),
} as const;

export type FeatureFlag = keyof typeof FEATURES;
