/**
 * Pilot feature gates. These ship fully built but are cut from the MVP pilot
 * scope — off by default, flip the env var (no code change) to re-enable for
 * Phase 2. Build-time inlined since these are NEXT_PUBLIC_ vars.
 *
 * Out of MVP scope (UI hidden): polls and paid voting, the AI assistant,
 * referrals, saved cards, and co-rep team management. Wallet, instalments,
 * self-service refunds and approval quorums have no UI at all.
 */
export const FEATURES = {
  polls: process.env.NEXT_PUBLIC_FEATURE_POLLS === "true",
  assistant: process.env.NEXT_PUBLIC_FEATURE_ASSISTANT === "true",
  referrals: process.env.NEXT_PUBLIC_FEATURE_REFERRALS === "true",
  cards: process.env.NEXT_PUBLIC_FEATURE_CARDS === "true",
  themes: process.env.NEXT_PUBLIC_FEATURE_THEMES === "true",
  /** Inviting/removing co-reps, transferring lead, reassigning dues. */
  coReps: process.env.NEXT_PUBLIC_FEATURE_CO_REPS === "true",
} as const;

export type FeatureFlag = keyof typeof FEATURES;
